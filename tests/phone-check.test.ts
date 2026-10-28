import test from "node:test";
import assert from "node:assert/strict";
import { phoneCheckSession, heardPhoneTestPhrase } from "../lib/phone-check.ts";
import { createSession, issues } from "../lib/access.ts";
import { communityForm } from "../lib/forms.ts";
test("phone checks use an isolated complete fictional fixture with distinct applicant and landlord addresses",()=>{
 const original=createSession(communityForm),before=JSON.stringify(original),sample=phoneCheckSession();assert.equal(issues(sample).length,0);
 assert.equal(sample.answers.home_address.value,sample.answers.contact_address.value);assert.notEqual(sample.answers.home_address.value,sample.answers.landlord_address.value);assert.equal(sample.answers.full_name.value,"Alex Example");assert.equal(sample.answers.monthly_income.value,"0");assert.equal(JSON.stringify(original),before);
});
test("phone speech verification accepts the test words with punctuation but never marks silence or other words passed",()=>{
 for(const text of ["blue bicycle","Blue bicycle."," BLUE   BICYCLE! "])assert.equal(heardPhoneTestPhrase(text),true);
 for(const text of ["","blue","bicycle","I heard it","not blue bicycle","blue bicycles"])assert.equal(heardPhoneTestPhrase(text),false);
});
