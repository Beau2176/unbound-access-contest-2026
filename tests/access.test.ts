import test from "node:test";
import assert from "node:assert/strict";
import {applyProposal,createSession,exportRows,findCorrectionTargets,issues,parseCommand,proposeAnswer,restoreSession,valueError} from "../lib/access.ts";
import type {Session} from "../lib/access.ts";
import {communityForm,secondForm} from "../lib/forms.ts";
const answer=(s:Session,id:string,value:string)=>applyProposal(s,proposeAnswer(s,id,value));
for(const form of [communityForm,secondForm]){
  test(`${form.title}: all declared source labels occur in the real source`,()=>{for(const f of form.fields)assert.ok(form.sourceText.includes(f.sourceQuote),f.id);});
  test(`${form.title}: required omissions are detected`,()=>{const s=createSession(form);for(const f of form.fields.filter(f=>f.required))assert.ok(issues(s).some(i=>i.fieldId===f.id));});
  test(`${form.title}: a proposal is reversible before confirmation`,()=>{const s=createSession(form),before=structuredClone(s);proposeAnswer(s,form.fields[0].id,"Fictional Person");assert.deepEqual(s,before);});
  test(`${form.title}: linked correction does not alter another role's address`,()=>{
    const shared=form.fields.find(f=>form.fields.some(g=>g.id!==f.id&&g.factKey===f.factKey))!;
    const other=form.fields.find(f=>f.id!==shared.id&&f.factKey!==shared.factKey&&/address/i.test(f.label))!;
    let s=answer(createSession(form),other.id,"900 Venue Lane, Exampletown");s=answer(s,shared.id,"10 Old Street, Exampletown");
    const p=proposeAnswer(s,shared.id,"20 New Street, Exampletown","voice");assert.equal(p.changes.length,2);const next=applyProposal(s,p);
    for(const f of form.fields.filter(f=>f.factKey===shared.factKey))assert.equal(next.answers[f.id].value,"20 New Street, Exampletown");
    assert.equal(next.answers[other.id].value,"900 Venue Lane, Exampletown");assert.equal(s.answers[shared.id].value,"10 Old Street, Exampletown");
  });
  test(`${form.title}: ambiguous address correction requires clarification`,()=>assert.equal(findCorrectionTargets(form,"my address").length,2));
  test(`${form.title}: exports contain exactly the confirmed values`,()=>{let s=createSession(form);s=answer(s,form.fields[0].id,"Zoë Álvarez");const r=exportRows(s);assert.equal(r[0].value,"Zoë Álvarez");assert.equal(r[1].value,"[Not answered]");});
}
test("zero income is a valid stated answer",()=>{const s=answer(createSession(communityForm),"monthly_income","$0.00");assert.equal(s.answers.monthly_income.value,"0.00");assert.ok(!issues(s).some(i=>i.fieldId==="monthly_income"));});
test("numbers obey the original field constraints",()=>{const s=createSession(communityForm);assert.throws(()=>proposeAnswer(s,"household_size","0"));assert.throws(()=>proposeAnswer(s,"household_size","13"));assert.throws(()=>proposeAnswer(s,"household_size","2.5"));assert.equal(proposeAnswer(s,"household_size","three").changes[0].after,"3");});
test("conditional questions and contradictions are visible",()=>{let s=answer(createSession(communityForm),"support","Yes");assert.ok(issues(s).some(i=>i.fieldId==="support_details"));s=answer(s,"support_details","Large print");s=answer(s,"support","No");assert.ok(issues(s).some(i=>i.message.includes("support details")));s=answer(s,"support_details","");assert.ok(!issues(s).some(i=>i.fieldId==="support"));});
test("stale confirmation is rejected without overwriting newer facts",()=>{const s=createSession(communityForm),p=proposeAnswer(s,"full_name","Alex");const next=answer(s,"household_size","3");assert.throws(()=>applyProposal(next,p),/changed/);assert.equal(next.answers.household_size.value,"3");});
test("unknown fields, cross-role updates and incomplete linked updates are rejected",()=>{const s=createSession(communityForm);assert.throws(()=>proposeAnswer(s,"not_a_question","invented"));const p=proposeAnswer(s,"home_address","100 Example Road");assert.throws(()=>applyProposal(s,{...p,changes:p.changes.slice(0,1)}),/linked/);assert.throws(()=>applyProposal(s,{...p,changes:[p.changes[0],{fieldId:"landlord_address",before:"",after:"100 Example Road"}]}),/separately/);});
test("unverified links do not propagate a personal fact",()=>{const s=createSession({...communityForm,linksVerified:false});const next=answer(s,"home_address","100 Example Road");assert.equal(next.answers.contact_address,undefined);});
test("session restoration preserves history and rejects broken storage",()=>{const s=answer(createSession(communityForm),"full_name","Alex Example");assert.deepEqual(restoreSession(JSON.stringify(s)),s);assert.equal(restoreSession("broken json"),null);assert.equal(restoreSession(JSON.stringify({version:2})),null);});
test("invalid dates are rejected without a RangeError",()=>{const f=secondForm.fields.find(f=>f.kind==="date")!;assert.ok(valueError(f,"not-a-date"));assert.ok(valueError(f,"2026-02-30"));assert.equal(valueError(f,"2026-11-03"),null);});
test("voice commands stay distinct from personal answers",()=>{assert.equal(parseCommand("Stop.").command,"stop");assert.deepEqual(parseCommand("Change my home address to 24 Example Lane."),{command:"correct",target:"my home address",value:"24 Example Lane"});assert.equal(parseCommand("No").command,"answer");assert.equal(parseCommand("confirm").command,"confirm");assert.equal(findCorrectionTargets(communityForm,"monthly income")[0].id,"monthly_income");});
