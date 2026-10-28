import test from "node:test";
import assert from "node:assert/strict";
import { callFreeNvidia, NVIDIA_META_MODEL, NVIDIA_MODEL_PAGE, nvidiaFreeEndpointAvailable } from "../lib/nvidia.ts";
import { metaConfiguration } from "../lib/meta-configuration.ts";
import { handleAssist } from "../lib/assist.ts";
import { communityForm } from "../lib/forms.ts";
const page = "<h1>meta/muse-glimmer-30b</h1><section><h3>Model Availability</h3><dl><dt>Free Endpoint</dt><dd>Available</dd><dt>Partner Endpoint</dt><dd>Available</dd></dl></section>";
const source = communityForm.sourceText, form = {title: communityForm.title,fields: communityForm.fields,warnings: []};
const successful = (content = JSON.stringify(form), extra = {}) => Response.json({model:NVIDIA_META_MODEL,choices:[{finish_reason:"stop",message:{content}}],...extra});
test("NVIDIA catalog checks require the exact model and an available free endpoint outside scripts",()=>{
  assert.equal(nvidiaFreeEndpointAvailable(page),true);
  for(const html of [page.replace("Available","Deprecated"),page.replace("muse-glimmer-30b","other-model"),"<script>meta/muse-glimmer-30b Model Availability Free Endpoint Available</script>","x".repeat(2_000_001)])assert.equal(nvidiaFreeEndpointAvailable(html),false);
});
test("NVIDIA missing keys and unapproved models do not contact any service",async()=>{
  let calls=0;const fetcher:typeof fetch=async()=>{calls++;return new Response();};
  await assert.rejects(callFreeNvidia({task:"extract",text:source,fetcher}),/not connected/);
  await assert.rejects(callFreeNvidia({key:"test-placeholder",model:"meta/paid",task:"extract",text:source,fetcher}),/not approved/);
  assert.equal(calls,0);
});
test("a changed or unavailable NVIDIA catalog prevents inference without exposing the key",async()=>{
  for(const mode of ["deprecated","unavailable","network"]){let calls=0;
    await assert.rejects(callFreeNvidia({key:"test-placeholder",task:"extract",text:source,fetcher:async(url,init)=>{calls++;assert.equal(String(url),NVIDIA_MODEL_PAGE);assert.equal(init?.headers,undefined);if(mode==="network")throw new Error("offline");return mode==="unavailable"?new Response("unavailable",{status:503}):new Response(page.replace("Available","Deprecated"));}}));assert.equal(calls,1);
  }
});
test("NVIDIA sends only the fixed free model with documented parameters and validates real schema shape",async()=>{
  let calls=0;const result=await callFreeNvidia({key:"test-placeholder",task:"extract",text:source,fetcher:async(url,init)=>{
    calls++;if(String(url)===NVIDIA_MODEL_PAGE)return new Response(page);
    assert.equal(String(url),"https://integrate.api.nvidia.com/v1/chat/completions");assert.equal(init?.redirect,"error");
    const body=JSON.parse(String(init?.body));assert.equal(body.model,NVIDIA_META_MODEL);assert.equal(body.temperature,0.95);assert.equal(body.reasoning_effort,"low");assert.equal(body.tool_choice,"none");assert.equal(body.stream,false);assert.equal(body.models,undefined);assert.equal(body.provider,undefined);assert.equal(body.max_tokens,7000);
    assert.ok(body.messages[0].content.includes("untrusted data"));return successful();
  }});assert.equal(result.model,NVIDIA_META_MODEL);assert.equal(result.provider,"NVIDIA API Catalog");assert.equal(result.reportedCost,null);assert.ok("title" in result.data);assert.equal(result.data.title,form.title);assert.equal(calls,2);
});
test("NVIDIA never turns another model, truncated output, reasoning-only output or malformed JSON into a proposal",async()=>{
  const results=[successful(JSON.stringify(form),{model:"other/model"}),Response.json({model:NVIDIA_META_MODEL,choices:[{finish_reason:"length",message:{content:JSON.stringify(form)}}]}),Response.json({model:NVIDIA_META_MODEL,choices:[{message:{reasoning_content:JSON.stringify(form)}}]}),successful("not JSON")];
  for(const response of results)await assert.rejects(callFreeNvidia({key:"test-placeholder",task:"extract",text:source,fetcher:async url=>String(url)===NVIDIA_MODEL_PAGE?new Response(page):response}));
});
test("NVIDIA extraction still rejects invented source text and wrong-field answers",async()=>{
  const invented=JSON.stringify({...form,fields:[{...form.fields[0],sourceQuote:"invented source"}]});
  await assert.rejects(callFreeNvidia({key:"test-placeholder",task:"extract",text:source,fetcher:async url=>String(url)===NVIDIA_MODEL_PAGE?new Response(page):successful(invented)}));
  await assert.rejects(callFreeNvidia({key:"test-placeholder",task:"answer",field:{id:"household_size",label:"People in your household",kind:"number"},text:"three people",fetcher:async url=>String(url)===NVIDIA_MODEL_PAGE?new Response(page):successful(JSON.stringify({fieldId:"landlord_address",value:"3",needsClarification:false,question:""}))}));
});
test("NVIDIA pending, rate-limit and network failures stay failures without fallback requests",async()=>{
  for(const status of [202,401,429,500,0]){let calls=0;await assert.rejects(callFreeNvidia({key:"test-placeholder",task:"extract",text:source,fetcher:async url=>{calls++;if(String(url)===NVIDIA_MODEL_PAGE)return new Response(page);if(!status)throw new Error("offline");return new Response("unavailable",{status});}}));assert.equal(calls,2);}
});
test("provider selection uses only the selected provider's key and unknown configuration stays disabled",()=>{
  const absent=metaConfiguration({OPENROUTER_API_KEY:"test-other-provider"});assert.equal(absent.provider,"nvidia");assert.equal(absent.configured,false);assert.equal(absent.key,undefined);
  assert.equal(metaConfiguration({NVIDIA_API_KEY:"test-placeholder"}).configured,true);
  const unknown=metaConfiguration({META_PROVIDER:"invalid",NVIDIA_API_KEY:"test-placeholder",OPENROUTER_API_KEY:"test-placeholder"});assert.equal(unknown.provider,"unavailable");assert.equal(unknown.configured,false);
});
test("the actual assist handler uses NVIDIA only when selected and retains consent and authentication checks",async()=>{
  const origin="https://fixture.example.invalid",field={id:"household_size",label:"People in your household",kind:"number"};
  const make=(consent=true)=>new Request(`${origin}/api/assist`,{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify({task:"answer",text:"three people",field,fictionalDataOnly:true,consent})});
  let calls=0;const fetcher:typeof fetch=async url=>{calls++;return String(url)===NVIDIA_MODEL_PAGE?new Response(page):successful(JSON.stringify({fieldId:field.id,value:"3",needsClarification:false,question:""}));};
  assert.equal((await handleAssist(make(),{authenticated:false,provider:"nvidia",key:"test-placeholder",fetcher})).status,401);
  assert.equal((await handleAssist(make(false),{authenticated:true,provider:"nvidia",key:"test-placeholder",fetcher})).status,400);assert.equal(calls,0);
  const response=await handleAssist(make(),{authenticated:true,provider:"nvidia",key:"test-placeholder",fetcher});assert.equal(response.status,200);assert.equal(calls,2);const data=await response.json() as {provider:string;data:{value:string}};assert.equal(data.provider,"NVIDIA API Catalog");assert.equal(data.data.value,"3");
});
