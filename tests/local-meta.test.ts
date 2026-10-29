import test from "node:test";
import assert from "node:assert/strict";
import { indexLocalSource, localExtractionRequest, executeLocalExtraction, parseLocalExtraction, localAnswerRequest, parseLocalAnswer, LOCAL_META, LOCAL_META_MODELS, assertLocalModelMetadata } from "../lib/local-meta-policy.ts";
import { createSession, applyProposal, proposeAnswer, restoreSession } from "../lib/access.ts";
const source = "Fictional move-in practice\n[Page 1]\nApplicant name (required)\nApplicant home address (required)\n[Page 2]\nRepeat the same applicant home address (required)\nLandlord mailing address (required)";
const questions = { line_1: "skip", line_2: "text", line_3: "text", line_4: "text", line_5: "text" };
const output = (fields: unknown = questions) => JSON.stringify({ fields });
test("model receipts and loading identities cannot confuse the small and large Meta checkpoints",()=>{
  for(const key of ["small","large","compact"] as const){
    const model=LOCAL_META_MODELS[key];assert.ok(model.url.includes(model.revision));
    assertLocalModelMetadata(key,{"general.architecture":"llama","general.name":`Llama-3.2-${model.family}-Instruct`});
    assert.throws(()=>assertLocalModelMetadata(key,{"general.architecture":"llama","general.name":`Llama-3.2-${key==="small"?"3B":"1B"}-Instruct`}));
  }
});
test("local source index derives exact quotes and pages without treating document text as policy", () => {
  const lines = indexLocalSource(source);
  assert.equal(lines.length, 5); assert.equal(lines[3].page, 2);
  const request = localExtractionRequest(source);
  assert.ok(request.requests.every(step=>step.request.messages[0].content.includes("untrusted")));
  assert.ok(request.requests.some(step=>step.request.messages[1].content.includes("Landlord")));
  assert.ok(LOCAL_META.url.includes(LOCAL_META.revision)); assert.equal(LOCAL_META.bytes, 807690656);
});

test("sequential question inference is atomic, cancellable and preserves each response boundary", async () => {
  const plan=localExtractionRequest(source),seen:string[]=[];
  const result=await executeLocalExtraction(plan,async(_request,id)=>{seen.push(id);return '{"kind":"text"}';});
  assert.deepEqual(seen,["line_2","line_3","line_4","line_5"]);
  assert.equal(result.fields.line_1,"skip");assert.equal(result.data.fields.length,4);
  const controller=new AbortController();let calls=0;
  await assert.rejects(executeLocalExtraction(plan,async()=>{calls++;controller.abort();return '{"kind":"text"}';},{signal:controller.signal}),/Cancelled/);
  assert.equal(calls,1);
  await assert.rejects(executeLocalExtraction(plan,async()=>'{"kind":"text","answer":"Invented"}'),/usable question type/);
  assert.throws(()=>localExtractionRequest(source+'\nMaximum 4 guests'),/numeric limit/);
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
test("every source ID is required; generated links and flags cannot override source metadata", () => {
  for (const changed of [
    { not_in_source: "text" },
    { ...questions, line_6: "text" },
    { ...questions, line_2: undefined },
    { ...questions, line_3: { kind: "text", required: false } },
  ]) assert.throws(() => parseLocalExtraction(output(changed), source));
  assert.throws(() => parseLocalExtraction(JSON.stringify({fields: questions, required: false}), source));
  const form = parseLocalExtraction(output(Object.fromEntries(Object.entries(questions).reverse())), source);
  assert.deepEqual(form.fields.map(f => f.id), ["line_2", "line_3", "line_4", "line_5"]);
});
test("local source and output limits reject malformed requests before inference or form replacement", () => {
  assert.throws(() => indexLocalSource("short")); assert.throws(() => indexLocalSource("x".repeat(4001)));
  assert.throws(() => indexLocalSource("[Page 11]\n" + "Question".repeat(5)));
  assert.throws(() => parseLocalExtraction("not JSON", source));
  assert.throws(() => parseLocalExtraction(output({...questions,line_2:"execute"}), source));
  assert.throws(() => parseLocalExtraction(output({...questions,line_2:true}), source));
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
  assert.throws(()=>parseLocalExtraction(output({...questions,line_3:"skip"}),source),/left out/);
});

test("required flags and exact repeated labels come from the source and never cross roles", () => {
  const text = "Fictional address practice\nApplicant address (required)\nSame applicant address (required)\nLandlord address (not required)\nSame landlord address (optional)";
  const form = parseLocalExtraction(output({line_1:"skip",line_2:"text",line_3:"text",line_4:"text",line_5:"text"}),text);
  assert.deepEqual(form.fields.map(f=>f.required),[true,true,false,false]);
  assert.deepEqual(form.fields.map(f=>f.factKey),["line_2","line_2","line_4","line_4"]);
  assert.throws(()=>parseLocalExtraction(output({...questions,line_4:"number"}),source),/type conflicts|repeated/);
  assert.throws(()=>parseLocalExtraction(output(questions),source.replace("Repeat the same applicant home address","Repeat the same venue address")),/repeated/);
});

test("explicit field types, titles, conditional rules and numeric limits cannot silently degrade", () => {
  const text = "Fictional registration practice\nEmail address (optional)\nHow many guests? (required)\nReminder? Yes or No (optional)";
  const fields = {line_1:"skip",line_2:"email",line_3:"number",line_4:"yesno"};
  const form = parseLocalExtraction(output(fields),text);
  assert.deepEqual(form.fields.map(f=>f.kind),["email","number","yesno"]);
  for(const key of ["line_2","line_3","line_4"]) assert.throws(()=>parseLocalExtraction(output({...fields,[key]:"text"}),text),/type conflicts/);
  assert.throws(()=>parseLocalExtraction(output({...fields,line_1:"text"}),text),/title/);
  for(const changed of [text.replace("How many guests?","How many guests, up to 4?"),text.replace("How many guests?","How many guests, 1-4?"),text.replace("Email address","Email address if a reminder is requested")]) assert.throws(()=>parseLocalExtraction(output(fields),changed),/condition or numeric limit/);
});

test("the actual version-11 date, budget and description misclassifications fail closed", () => {
  const text = "Fictional bicycle repair appointment\nContact name (required)\nContact email (optional)\nAppointment date YYYY-MM-DD (required)\nRepair budget in dollars (required)\nDescribe the bicycle problem (required)\nHome address (required)\nRepeat the same home address (required)\nWorkshop address (required)";
  const fields = {line_1:"skip",line_2:"text",line_3:"email",line_4:"date",line_5:"money",line_6:"longtext",line_7:"text",line_8:"text",line_9:"text"};
  for(const [key,kind] of [["line_2","yesno"],["line_4","number"],["line_5","yesno"],["line_6","text"],["line_7","yesno"]]) assert.throws(()=>parseLocalExtraction(output({...fields,[key]:kind}),text),/type conflicts/);
  const form=parseLocalExtraction(output(fields),text);
  assert.equal(form.fields[5].factKey,form.fields[6].factKey);
  assert.notEqual(form.fields[7].factKey,form.fields[5].factKey);
});
