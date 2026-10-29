import test from "node:test";
import assert from "node:assert/strict";
import { applyProposal, createSession, exportRows, normalizeValue, proposeAnswer, restoreSession } from "../lib/access.ts";
import { communityForm } from "../lib/forms.ts";

const email = communityForm.fields.find(field => field.id === "email")!;

test("email accepts spoken at, spelled-out at and dot from microphone or keyboard dictation", () => {
  for (const input of [
    "alex at example dot com", "alex AT example.com", "alex A-T example dot com",
    "alex A T example dot com", "alex at sign example dot com",
    "alex @ example dot com", "alex at example . com", " alex @ example . com ",
  ]) {
    for (const method of ["typed", "voice"] as const) {
      const session = createSession(communityForm);
      const proposal = proposeAnswer(session, email.id, input, method);
      assert.equal(proposal.changes[0].after, "alex@example.com", `${method}: ${input}`);
      assert.equal(proposal.transcript, input);
      assert.equal(proposal.method, method);
      assert.deepEqual(session.answers, {});
    }
  }
});

test("valid email usernames, case, plus aliases and subdomains are preserved", () => {
  for (const input of ["PatAtWork@example.com", "Dot@example.com", "Alex.Dot+At@Mail.Example.co.uk", "at.dot@example.com"]) {
    assert.equal(normalizeValue(email, input), input);
  }
  assert.equal(normalizeValue(email, "Alex dot Smith+news at mail dot example dot co dot uk"), "Alex.Smith+news@mail.example.co.uk");
});

test("email separator conversion does not rewrite names, addresses or descriptions", () => {
  for (const kind of ["text", "longtext"] as const) {
    assert.equal(normalizeValue({ ...email, kind }, "Pat at Dot Avenue A-T"), "Pat at Dot Avenue A-T");
  }
});

test("unclear emails never change a confirmed address or guess missing words", () => {
  let session = createSession(communityForm);
  session = applyProposal(session, proposeAnswer(session, email.id, "saved@example.com"));
  const before = JSON.stringify(session);
  for (const input of [
    "alex at example", "alex example dot com", "alex smith at example dot com",
    "alex at example dot com or pat at example dot org", "alex at at example dot com",
    "alex at example dot com and another person", "alex@example.com;pat@example.org",
  ]) {
    assert.throws(() => proposeAnswer(session, email.id, input, "voice"), /Check the email address/, input);
    assert.equal(JSON.stringify(session), before);
  }
});

test("normalized email corrections need confirmation and survive restoration and export", () => {
  let session = createSession(communityForm);
  session = applyProposal(session, proposeAnswer(session, email.id, "saved@example.com"));
  session = applyProposal(session, proposeAnswer(session, "home_address", "10 Fictional Lane"));
  session = applyProposal(session, proposeAnswer(session, "landlord_address", "900 Separate Road"));
  const before = JSON.stringify(session);
  const cancelled = proposeAnswer(session, email.id, "cancelled at example dot org", "voice");
  assert.equal(cancelled.changes[0].after, "cancelled@example.org");
  assert.equal(JSON.stringify(session), before);
  const proposal = proposeAnswer(session, email.id, "alex A-T example dot com", "voice");
  assert.equal(proposal.changes[0].before, "saved@example.com");
  const confirmed = applyProposal(session, proposal);
  assert.equal(confirmed.answers.email.value, "alex@example.com");
  assert.equal(confirmed.answers.email.confirmed, true);
  assert.equal(confirmed.answers.home_address.value, "10 Fictional Lane");
  assert.equal(confirmed.answers.contact_address.value, "10 Fictional Lane");
  assert.equal(confirmed.answers.landlord_address.value, "900 Separate Road");
  assert.deepEqual(restoreSession(JSON.stringify(confirmed)), confirmed);
  assert.equal(exportRows(confirmed).find(row => row.id === email.id)?.value, "alex@example.com");
  assert.equal(JSON.stringify(session), before);
});
