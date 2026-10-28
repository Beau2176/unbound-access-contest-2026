import test from "node:test";
import assert from "node:assert/strict";
import { handleAssist } from "../lib/assist.ts";
import { FREE_META_MODEL } from "../lib/meta.ts";
const origin = "https://fixture.example.invalid", body = { task: "extract", text: "FICTIONAL FORM. Full name (required).", fictionalDataOnly: true, consent: true };
const request = (data: unknown = body, headers: Record<string,string> = {}) => new Request(`${origin}/api/assist`, { method: "POST", headers: { origin, "content-type": "application/json", ...headers }, body: JSON.stringify(data) });
test("the API refuses anonymous requests without reaching a provider", async () => {
  let calls=0; const r = await handleAssist(request(), { authenticated:false, key:"test-placeholder",fetcher:async()=>{calls++;return new Response();} });
  assert.equal(r.status,401);assert.equal(calls,0);assert.equal(r.headers.get("cache-control"),"no-store");
});
test("the API refuses another origin even for an authenticated request", async () => {
  const r=await handleAssist(request(body,{origin:"https://unrelated.example.invalid"}),{authenticated:true});assert.equal(r.status,403);
});
test("the API requires explicit fictional-data consent", async () => {
  for(const data of [{...body,consent:false},{...body,fictionalDataOnly:false}])assert.equal((await handleAssist(request(data),{authenticated:true})).status,400);
});
test("the API rejects unknown properties and malformed answer fields", async () => {
  for(const data of [{...body,tools:["submit-form"]},{...body,task:"answer"},{...body,task:"answer",field:{id:"bad id",label:"Name",kind:"text"}}])assert.equal((await handleAssist(request(data),{authenticated:true})).status,400);
});
test("the API returns a recoverable missing-credential error", async () => {
  const r=await handleAssist(request(),{authenticated:true}),data=await r.json() as {preservedAnswers?:boolean;data?:unknown};assert.equal(r.status,503);assert.equal(data.preservedAnswers,true);assert.equal(data.data,undefined);
});
test("oversize request bodies are rejected with and without a content-length header", async () => {
  const cases:Record<string,string>[]=[{},{"content-length":"81000"}];
  for(const headers of cases){const r=await handleAssist(request({...body,text:"x".repeat(81000)},headers),{authenticated:true});assert.equal(r.status,413);}
});
test("the API rejects malformed JSON and unsupported content types", async () => {
  const badJson=new Request(`${origin}/api/assist`,{method:"POST",headers:{origin,"content-type":"application/json"},body:"{broken"});
  assert.equal((await handleAssist(badJson,{authenticated:true})).status,400);
  assert.equal((await handleAssist(request(body,{"content-type":"text/plain"}),{authenticated:true})).status,415);
});
test("the API returns only a validated same-field proposal from a stubbed free provider", async () => {
  const field={id:"household_size",label:"People in your household",kind:"number"};let calls=0;
  const r=await handleAssist(request({...body,task:"answer",text:"three people",field}),{authenticated:true,key:"test-placeholder",fetcher:async url=>{
    calls++;return String(url).endsWith("/models")?Response.json({data:[{id:FREE_META_MODEL,pricing:{prompt:"0",completion:"0"}}]}):Response.json({choices:[{message:{content:JSON.stringify({fieldId:field.id,value:"3",needsClarification:false,question:""})}}],usage:{cost:0}});
  }});const result=await r.json() as {data:{fieldId:string};reportedCost:number};assert.equal(r.status,200);assert.equal(result.data.fieldId,field.id);assert.equal(result.reportedCost,0);assert.equal(calls,2);
});
