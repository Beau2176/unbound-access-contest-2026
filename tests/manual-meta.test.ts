import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { importManualMeta } from "../lib/manual-meta.ts";
import { applyProposal, createSession, groups, proposeAnswer, restoreSession } from "../lib/access.ts";
const source=await readFile(new URL("../docs/evaluation/third-form.txt",import.meta.url),"utf8");
const expected=JSON.parse(await readFile(new URL("../docs/evaluation/expected-fields.json",import.meta.url),"utf8"));
test("manual Meta imports preserve provenance, exact sources and shared facts across review and recovery",()=>{
 const form=importManualMeta("```json\n"+JSON.stringify(expected)+"\n```",source);assert.equal(form.origin,"manual");assert.equal(form.sourceText,source);assert.equal(form.fields.length,9);
 assert.equal(groups(form).find(g=>g.some(f=>f.id==="participant_home"))?.length,2);
 let session=createSession(form);session=applyProposal(session,proposeAnswer(session,"participant_home","40 Practice Street"));session=applyProposal(session,proposeAnswer(session,"venue_address","900 Venue Road"));session=applyProposal(session,proposeAnswer(session,"participant_home","41 Practice Street"));
 assert.equal(session.answers.home_repeat.value,"41 Practice Street");assert.equal(session.answers.venue_address.value,"900 Venue Road");assert.equal(restoreSession(JSON.stringify(session))?.form.origin,"manual");
});
test("malformed or unsupported imported proposals cannot replace an existing confirmed session",()=>{
 const form=importManualMeta(JSON.stringify(expected),source);const session=applyProposal(createSession(form),proposeAnswer(createSession(form),"participant_name","Alex Example")),before=JSON.stringify(session);
 const cases=["not JSON",JSON.stringify({...expected,fields:expected.fields.map((f:Record<string,unknown>,i:number)=>i===0?{...f,factKey:""}:f)}),JSON.stringify({...expected,fields:expected.fields.map((f:Record<string,unknown>,i:number)=>i===0?{...f,sourcePage:9}:f)}),JSON.stringify({...expected,fields:expected.fields.map((f:Record<string,unknown>,i:number)=>i===0?{...f,sourceQuote:"invented quote"}:f)})];
 for(const output of cases)assert.throws(()=>importManualMeta(output,source));assert.equal(JSON.stringify(session),before);
});
