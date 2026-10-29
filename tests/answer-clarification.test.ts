import test from "node:test";
import assert from "node:assert/strict";
import { applyProposal, createSession, proposeAnswer } from "../lib/access.ts";
import { communityForm, secondForm } from "../lib/forms.ts";
import { handleAssist } from "../lib/assist.ts";
import { parseMetaContent } from "../lib/meta.ts";
import { parseLocalAnswer } from "../lib/local-meta-policy.ts";

const origin = "https://fixture.example.invalid";
const field = { id: "household_size", label: "People in your household", kind: "number" as const };
const body = { task: "answer", text: "I am not sure how many people will come.", field, fictionalDataOnly: true, consent: true };
const request = (data: unknown = body, from = origin) => new Request(`${origin}/api/assist`, {
  method: "POST", headers: { origin: from, "content-type": "application/json" }, body: JSON.stringify(data),
});

test("uncertain typed and spoken answers ask for clarification without changing confirmed state", () => {
  let session = createSession(communityForm);
  session = applyProposal(session, proposeAnswer(session, "household_size", "3"));
  const before = JSON.stringify(session);
  for (const method of ["typed", "voice"] as const) {
    for (const [id, text] of [
      ["household_size", "I am not sure how many people will come."],
      ["household_size", "I think three"], ["monthly_income", "about 500 dollars"],
      ["support", "Maybe yes"], ["full_name", "I don't know"],
      ["email", "Not sure yet"], ["request", "I have no idea"],
    ]) assert.throws(() => proposeAnswer(session, id, text, method), /What (?:exact |answer)|Yes or No/);
  }
  assert.equal(JSON.stringify(session), before);
  assert.throws(() => proposeAnswer(createSession(secondForm), "collection_date", "Probably 2026-11-03"), /What exact date/);
});

test("uncertain linked-address corrections preserve both confirmed copies and the other role", () => {
  let session = createSession(communityForm);
  session = applyProposal(session, proposeAnswer(session, "home_address", "10 Example Road"));
  session = applyProposal(session, proposeAnswer(session, "landlord_address", "90 Separate Lane"));
  const before = JSON.stringify(session);
  assert.throws(() => proposeAnswer(session, "home_address", "I cannot remember", "voice"), /What answer/);
  assert.equal(JSON.stringify(session), before);
  assert.equal(session.answers.contact_address.value, "10 Example Road");
  assert.equal(session.answers.landlord_address.value, "90 Separate Lane");
});

test("clear values, explicit clearing and descriptive uncertainty remain usable", () => {
  const session = createSession(communityForm);
  for (const [id, text, expected] of [
    ["household_size", "three people", "3"], ["monthly_income", "zero dollars", "0"],
    ["support", "No", "No"], ["full_name", "May Be", "May Be"],
    ["request", "Information about the workshop", "Information about the workshop"],
    ["request", "I don't know how to apply and need someone to read the form.", "I don't know how to apply and need someone to read the form."],
    ["email", "maybe at example dot com", "maybe@example.com"],
    ["home_address", "", ""],
  ]) assert.equal(proposeAnswer(session, id, text).changes[0].after, expected);
  assert.equal(proposeAnswer(createSession(secondForm), "collection_date", "2026-11-03").changes[0].after, "2026-11-03");
});

test("the authenticated answer endpoint clarifies uncertainty without contacting any provider", async () => {
  for (const provider of [undefined, "openrouter", "nvidia", "unavailable"] as const) {
    let calls = 0;
    const response = await handleAssist(request(), { authenticated: true, provider,
      fetcher: async () => { calls++; throw new Error("No provider should be contacted"); } });
    const result = await response.json() as { data: { fieldId: string; value: string; needsClarification: boolean; question: string }; model: string; reportedCost: number };
    assert.equal(response.status, 200);
    assert.equal(calls, 0);
    assert.equal(result.data.fieldId, field.id);
    assert.equal(result.data.value, "");
    assert.equal(result.data.needsClarification, true);
    assert.match(result.data.question, /What exact number/);
    assert.match(result.model, /no AI call/);
    assert.equal(result.reportedCost, 0);
  }
});

test("the clarification shortcut preserves authentication, origin, schema and consent checks", async () => {
  assert.equal((await handleAssist(request(), { authenticated: false })).status, 401);
  assert.equal((await handleAssist(request(body, "https://other.example.invalid"), { authenticated: true })).status, 403);
  for (const data of [{ ...body, consent: false }, { ...body, fictionalDataOnly: false }, { ...body, field: { ...field, id: "bad id" } }]) {
    assert.equal((await handleAssist(request(data), { authenticated: true })).status, 400);
  }
});

test("raw local and hosted model guesses remain rejected for uncertain input", () => {
  for (const utterance of ["I am not sure how many people will come.", "I think three", "Probably three", "I have no idea"]) {
    assert.throws(() => parseLocalAnswer('{"value":"3","question":""}', field, utterance), /uncertainty/);
    assert.throws(() => parseMetaContent(JSON.stringify({ fieldId: field.id, value: "3", needsClarification: false, question: "" }), "answer", utterance, field), /uncertainty/);
  }
});

test("an actual clarification response is preserved and never supplies a guessed value", () => {
  const result = parseLocalAnswer('{"value":"","question":"How many people should I use?"}', field, body.text);
  assert.deepEqual(result, { fieldId: field.id, value: "", needsClarification: true, question: "How many people should I use?" });
});
