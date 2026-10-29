import test from "node:test";
import assert from "node:assert/strict";
import {sourceWordingProposal} from "../lib/source-wording.ts";
import {explicitSourceKind} from "../lib/local-meta-policy.ts";
import {createSession,applyProposal,proposeAnswer,restoreSession} from "../lib/access.ts";

test("source-only questions preserve provenance, pages, zero and separate address roles through recovery",()=>{
  const source="[Page 1]\nFictional library donation\nDonor name (required)\nPreferred email (optional)\nNumber of books (required)\nAmount paid in dollars (required)\n[Page 2]\nReminder? Yes or No (required)\nVisit date YYYY-MM-DD (required)\nDescribe the donation (required)\nPickup address (required)\nVenue address (required)\nRepeat pickup address (required)";
  const form=sourceWordingProposal(source);assert.equal(form.origin,"source");assert.equal(form.fields.length,10);
  assert.deepEqual(form.fields.map(f=>f.kind),["text","email","number","money","yesno","date","longtext","text","text","text"]);
  assert.equal(form.fields[1].required,false);assert.equal(form.fields[4].sourcePage,2);
  assert.equal(form.fields[7].factKey,form.fields[9].factKey);assert.notEqual(form.fields[7].factKey,form.fields[8].factKey);
  let session=createSession(form);for(const [id,value] of [["line_5","0"],["line_9","12 Fictional Lane"],["line_10","90 Venue Road"]]) session=applyProposal(session,proposeAnswer(session,id,value));
  assert.equal(session.answers.line_11.value,"12 Fictional Lane");assert.equal(session.answers.line_10.value,"90 Venue Road");
  assert.equal(restoreSession(JSON.stringify(session))?.form.origin,"source");assert.match(form.warnings[0],/No AI request/);
});
test("source wording respects the requested format over incidental email, address or dollar words",()=>{
  assert.equal(explicitSourceKind("Email reminders? Yes or No"),"yesno");
  assert.equal(explicitSourceKind("Describe the address problem"),"longtext");
  assert.equal(explicitSourceKind("Number of email addresses"),"number");
  assert.equal(explicitSourceKind("How many dollars were paid?"),"money");
});
test("source-only review never guesses unknown types or discards unsupported conditions and limits",()=>{
  for(const line of ["What brings you here?","Email address if a reminder is needed (required)","Number of guests, maximum 4 (required)"])
    assert.throws(()=>sourceWordingProposal("Fictional unsupported practice form\n"+line));
});
