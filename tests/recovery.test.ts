import test from "node:test";
import assert from "node:assert/strict";
import { applyProposal, createSession, findCorrectionTargets, issues, normalizeValue, parseCommand, proposeAnswer, resolveClarification, restoreSession, validFormDefinition } from "../lib/access.ts";
import { communityForm, secondForm } from "../lib/forms.ts";
test("voice can select an ambiguous fact by label, ordinal, or option number", () => {
  const choices = findCorrectionTargets(communityForm, "my address"); assert.equal(choices.length, 2);
  for (const text of ["one", "first", "first one", "option one", "1", "Your home address"]) assert.equal(resolveClarification(communityForm, choices, text)?.id, "home_address", text);
  for (const text of ["two", "second", "option two", "Landlord mailing address"]) assert.equal(resolveClarification(communityForm, choices, text)?.id, "landlord_address", text);
  for (const text of ["address", "five", "0", "900 Example Road"]) assert.equal(resolveClarification(communityForm, choices, text), null, text);
});
test("spoken review, PDF, and clearing commands stay explicit", () => {
  for (const text of ["Confirm review", "I have reviewed my answers.", "Finish review"]) assert.equal(parseCommand(text).command, "confirm_review");
  for (const text of ["Download PDF", "Save my PDF", "Download draft"]) assert.equal(parseCommand(text).command, "download");
  assert.equal(parseCommand("Clear this answer").command, "clear_answer");
  assert.equal(parseCommand("Confirm").command, "confirm");
  assert.equal(parseCommand("I need help to download my paperwork").command, "answer");
});
test("clearing a linked fact is proposed and confirmed without clearing another role", () => {
  let s = createSession(communityForm); s = applyProposal(s, proposeAnswer(s, "home_address", "10 Example Lane"));
  s = applyProposal(s, proposeAnswer(s, "landlord_address", "900 Fictional Street"));
  const proposal = proposeAnswer(s, "home_address", "", "voice"); assert.equal(s.answers.home_address.value, "10 Example Lane");
  const next = applyProposal(s, proposal); assert.equal(next.answers.contact_address.value, ""); assert.equal(next.answers.landlord_address.value, "900 Fictional Street");
  assert.ok(issues(next).some(issue => issue.fieldId === "home_address"));
});
test("spoken zero dollars and household counts need no model call", () => {
  const income = communityForm.fields.find(f => f.id === "monthly_income")!, household = communityForm.fields.find(f => f.id === "household_size")!;
  for (const value of ["zero", "zero dollars", "0", "$0.00"]) assert.equal(Number(normalizeValue(income, value)), 0);
  assert.equal(normalizeValue(household, "three people"), "3");
});
test("malformed thousands separators are not silently turned into a different amount", () => {
  const s = createSession(communityForm); assert.throws(() => proposeAnswer(s, "monthly_income", "1,2"));
  assert.throws(() => proposeAnswer(s, "monthly_income", "12,34"));
  assert.equal(proposeAnswer(s, "monthly_income", "$1,234.50").changes[0].after, "1234.50");
});
test("restoration rejects incomplete or incompatible form metadata without crashing", () => {
  for (const change of [
    (s: ReturnType<typeof createSession>) => { s.form.fields[0].help = undefined as unknown as string; },
    (s: ReturnType<typeof createSession>) => { s.form.fields[1].id = s.form.fields[0].id; },
    (s: ReturnType<typeof createSession>) => { s.form.fields[0].sourcePage = 9; },
    (s: ReturnType<typeof createSession>) => { s.form.fields[0].sourceQuote = "Not in the source"; },
    (s: ReturnType<typeof createSession>) => { s.form.fields[0].requiredWhen = { fieldId: "missing", equals: "Yes" }; },
    (s: ReturnType<typeof createSession>) => { s.form.fields[2].min = 12; s.form.fields[2].max = 1; },
    (s: ReturnType<typeof createSession>) => { s.form.fields[8].kind = "number"; },
    (s: ReturnType<typeof createSession>) => { s.revision = -1; },
  ]) { const session = createSession(communityForm); change(session); assert.equal(restoreSession(JSON.stringify(session)), null); }
  assert.equal(restoreSession("null"), null);
});
test("restoration rejects malformed answer and history records", () => {
  const original = applyProposal(createSession(communityForm), proposeAnswer(createSession(communityForm), "full_name", "Alex Example"));
  for (const change of [
    (s: typeof original) => { s.answers.full_name = null as unknown as typeof s.answers.full_name; },
    (s: typeof original) => { s.answers.full_name.method = "invented" as "typed"; },
    (s: typeof original) => { s.answers.full_name.at = "bad date"; },
    (s: typeof original) => { s.audit = []; },
    (s: typeof original) => { s.audit[0].changes[0].fieldId = "missing"; },
  ]) { const session = structuredClone(original); change(session); assert.equal(restoreSession(JSON.stringify(session)), null); }
});
test("both supported forms keep source integrity and restore many sequential corrections", () => {
  for (const form of [communityForm, secondForm]) {
    assert.equal(validFormDefinition(form), true); let session = createSession(form);
    const address = form.fields.find(f => f.id === "home_address" || f.id === "delivery_address")!;
    const other = form.fields.find(f => f.id === "landlord_address" || f.id === "venue_address")!;
    session = applyProposal(session, proposeAnswer(session, other.id, "900 Separate Role Street"));
    for (let i = 0; i < 100; i++) {
      const before = JSON.stringify(session), proposal = proposeAnswer(session, address.id, `${i + 1} Fictional Lane`, "voice");
      assert.equal(JSON.stringify(session), before); session = applyProposal(session, proposal);
      assert.equal(session.answers[other.id].value, "900 Separate Role Street");
      assert.deepEqual(restoreSession(JSON.stringify(session)), session);
    }
  }
});
test("long correction histories retain current answers and remain recoverable", () => {
 let session=createSession(communityForm);
 session=applyProposal(session,proposeAnswer(session,"landlord_address","900 Separate Role Street"));
 for(let i=0;i<60;i++)session=applyProposal(session,proposeAnswer(session,"request",`${i}: `+"A".repeat(2995)));
 const raw=JSON.stringify(session),restored=restoreSession(raw);
 assert.ok(restored,"A legitimate long-answer session must not turn into a blank form on reload");
 assert.deepEqual(restored,session);assert.equal(restored.answers.request.value,"59: "+"A".repeat(2995));
 assert.equal(restored.answers.landlord_address.value,"900 Separate Role Street");assert.equal(restored.revision,61);
 assert.ok((restored.auditOffset??0)>0);assert.ok(raw.length<300000);
 const next=applyProposal(restored,proposeAnswer(restored,"home_address","101 Practice Street"));
 assert.equal(next.answers.contact_address.value,"101 Practice Street");assert.deepEqual(restoreSession(JSON.stringify(next)),next);
});
test("over a thousand corrections remain recoverable without resetting revision or linked facts", () => {
 let session=createSession(communityForm);
 for(let i=0;i<1010;i++)session=applyProposal(session,proposeAnswer(session,"home_address",`${i} Practice Street`));
 assert.equal(session.revision,1010);assert.equal(session.answers.contact_address.value,"1009 Practice Street");
 const restored=restoreSession(JSON.stringify(session));assert.ok(restored);assert.deepEqual(restored,session);assert.ok(session.audit.length<=100);
 const s=structuredClone(session);
 for(const offset of [-1,0.5,session.revision+1]){s.auditOffset=offset;assert.equal(restoreSession(JSON.stringify(s)),null);}
});
test("conditional conflicts are detected for imported field IDs and retain the person's details", () => {
 const form=structuredClone(communityForm);form.origin="manual";
 for(const field of form.fields){if(field.id==="support")field.id="needs_help";if(field.id==="support_details"){field.id="help_details";field.requiredWhen!.fieldId="needs_help";}}
 assert.equal(validFormDefinition(form),true);
 let session=createSession(form);
 for(const [id,value] of [["needs_help","Yes"],["help_details","Large print"],["needs_help","No"]])session=applyProposal(session,proposeAnswer(session,id,value));
 assert.ok(issues(session).some(issue=>issue.fieldId==="needs_help"&&issue.message.includes("follow-up")));
 assert.equal(session.answers.help_details.value,"Large print","A conflicting parent correction must not silently erase the details");
 session=applyProposal(session,proposeAnswer(session,"help_details",""));
 assert.ok(!issues(session).some(issue=>issue.fieldId==="needs_help"||issue.fieldId==="help_details"));
});
test("legacy histories beyond the old restore limits migrate without discarding confirmed answers",()=>{
 const legacy=createSession(communityForm),at=legacy.startedAt;
 legacy.answers.request={value:"Final confirmed description",confirmed:true,method:"typed",at};
 legacy.audit=Array.from({length:1001},(_,i)=>({at,method:"typed" as const,changes:[{fieldId:"request",before:i?"A".repeat(200):"",after:i===1000?"Final confirmed description":"A".repeat(200)}]}));
 legacy.revision=1001;legacy.interactions=1001;
 const raw=JSON.stringify(legacy);assert.ok(raw.length>300000&&raw.length<1000000);
 const restored=restoreSession(raw);assert.ok(restored);assert.equal(restored.revision,1001);
 assert.equal(restored.answers.request.value,"Final confirmed description");assert.equal(restored.auditOffset,901);assert.equal(restored.audit.length,100);
 assert.deepEqual(restoreSession(JSON.stringify(restored)),restored);
});
test("cyclic or unreachable imported conditions are rejected before they can hide questions",()=>{
 const cyclic=structuredClone(communityForm);
 cyclic.fields.find(f=>f.id==="support")!.requiredWhen={fieldId:"support_details",equals:"Large print"};
 assert.equal(validFormDefinition(cyclic),false);assert.equal(restoreSession(JSON.stringify(createSession(cyclic))),null);
 for(const equals of ["Maybe","yes","1"]){const form=structuredClone(communityForm);form.fields.find(f=>f.id==="support_details")!.requiredWhen!.equals=equals;assert.equal(validFormDefinition(form),false);}
 assert.equal(validFormDefinition(communityForm),true);assert.equal(validFormDefinition(secondForm),true);
});
