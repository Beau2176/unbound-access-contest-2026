import test from "node:test";
import assert from "node:assert/strict";
import { indexLocalSource, localExtractionRequest, parseLocalExtraction, localAnswerRequest, parseLocalAnswer, LOCAL_META } from "../lib/local-meta-policy.ts";
import { createSession, applyProposal, proposeAnswer, restoreSession } from "../lib/access.ts";
const source = "Fictional move-in practice\n[Page 1]\nApplicant name (required)\nApplicant home address (required)\n[Page 2]\nRepeat the same applicant home address (required)\nLandlord mailing address (required)";
const questions = [
  ["line_2", "text", true, ""], ["line_3", "text", true, ""], ["line_4", "text", true, "line_3"], ["line_5", "text", true, ""],
];
const output = (q: unknown = questions) => JSON.stringify({ title: "Move-in practice", questions: q, warnings: [] });
test("local source index derives exact quotes and pages without treating document text as policy", () => {
  const lines = indexLocalSource(source);
  assert.equal(lines.length, 5); assert.equal(lines[3].page, 2);
  const request = localExtractionRequest(source);
  assert.ok(request.messages[0].content.includes("untrusted")); assert.ok(request.messages[1].content.includes("Landlord"));
  assert.ok(LOCAL_META.url.includes(LOCAL_META.revision)); assert.equal(LOCAL_META.bytes, 807690656);
});
test("a checked local proposal preserves origin, source quotes and shared-role isolation after recovery", () => {
  const form = parseLocalExtraction(output(), source); assert.equal(form.origin, "local");
  assert.equal(form.fields[2].sourceQuote, "Repeat the same applicant home address (required)");
  let session = createSession(form);
  session = applyProposal(session, proposeAnswer(session, "line_3", "10 Example Road"));
  session = applyProposal(session, proposeAnswer(session, "line_5", "90 Venue Lane"));
  session = applyProposal(session, proposeAnswer(session, "line_3", "11 Example Road", "meta"));
  assert.equal(session.answers.line_4.value, "11 Example Road"); assert.equal(session.answers.line_5.value, "90 Venue Lane");
  assert.equal(restoreSession(JSON.stringify(session))?.form.origin, "local");
});
test("unknown, duplicated, reordered, self-linked and forward-linked source IDs are rejected", () => {
  for (const changed of [
    [["not_in_source", "text", true, ""]],
    [questions[0], questions[0]],
    [questions[1], questions[0]],
    [["line_2", "text", true, "line_2"]],
    [["line_2", "text", true, "line_3"], questions[1]],
  ]) assert.throws(() => parseLocalExtraction(output(changed), source));
});
test("local source and output limits reject malformed requests before inference or form replacement", () => {
  assert.throws(() => indexLocalSource("short")); assert.throws(() => indexLocalSource("x".repeat(4001)));
  assert.throws(() => indexLocalSource("[Page 11]\n" + "Question".repeat(5)));
  assert.throws(() => parseLocalExtraction("not JSON", source));
  assert.throws(() => parseLocalExtraction(output([["line_2", "execute", true, ""]]), source));
  assert.throws(() => parseLocalExtraction(output([["line_2", "text", "true", ""]]), source));
});
test("local answer proposals are bound to one field and require coherent clarification", () => {
  const field = { id: "people", label: "People in your household", kind: "number" as const };
  const req = localAnswerRequest(field, "there are three of us"); assert.ok(req.messages[1].content.includes('"id":"people"'));
  assert.equal(parseLocalAnswer(JSON.stringify({ value: "3", question: "" }), field, "three").value, "3");
  for (const answer of [
    { fieldId: "other", value: "3", question: "" },
    { value: "3", question: "How many?" },
    { value: "", question: "" },
  ]) assert.throws(() => parseLocalAnswer(JSON.stringify(answer), field, "uncertain"));
  assert.throws(() => localAnswerRequest(field, "x".repeat(1501)));
});
test("a guessed number, uncertainty override and invented text are rejected even when the model JSON is valid", () => {
  const field={id:"people",label:"People in your household",kind:"number" as const};
  assert.throws(()=>parseLocalAnswer('{"value":"3","question":""}',field,"I am not sure how many people will come."),/uncertainty/);
  assert.throws(()=>parseLocalAnswer('{"value":"3","question":""}',field,"two people"),/number/);
  assert.throws(()=>parseLocalAnswer('{"value":"Taylor Example","question":""}',{id:"name",label:"Your name",kind:"text"},"My name is Alex Example."),/wording/);
  assert.equal(parseLocalAnswer('{"value":"0","question":""}',{id:"amount",label:"Amount paid",kind:"money"},"zero dollars").value,"0");
  assert.throws(()=>parseLocalAnswer('{"value":"Yes","question":""}',{id:"support",label:"Need support?",kind:"yesno"},"No, I do not."),/Yes\/No/);
  assert.equal(parseLocalAnswer('{"value":"Information about the workshop","question":""}',{id:"request",label:"What help?",kind:"longtext"},"Information about the workshop").value,"Information about the workshop");
});
test("an otherwise valid partial extraction cannot omit explicitly marked source questions", () => {
  assert.throws(()=>parseLocalExtraction(output([questions[0]]),source),/left out/);
});
