import test from "node:test";
import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createSession,applyProposal,proposeAnswer,issues} from "../lib/access.ts";
import {communityForm} from "../lib/forms.ts";
import {reviewDocument,prepareReviewDownload,pdfFailure} from "../lib/pdf.ts";
test("the real PDF exporter handles long answers, accents, and incomplete review state",async()=>{
 let s=createSession(communityForm);
 const values={full_name:"Zoë Álvarez",home_address:"20 New Example Lane, Sampletown",household_size:"3",monthly_income:"0",landlord_address:"900 Venue Road, Sampletown",request:"I am requesting help with a fictional community project and would like the coordinator to review these details carefully. ".repeat(18),support:"Yes",support_details:"Large print and questions read aloud.",email:"alex@example.invalid"};
 for(const [id,value] of Object.entries(values))s=applyProposal(s,proposeAnswer(s,id,value));
 assert.equal(issues(s).length,0);
 const font=new Uint8Array(await readFile(new URL("../public/fonts/DejaVuSans.ttf",import.meta.url)));
 const complete=await reviewDocument(s,true,font),draft=await reviewDocument(s,false,font);
 assert.equal(complete.complete,true);assert.equal(draft.complete,false);assert.ok(complete.doc.getNumberOfPages()>=3);
 const dir=process.env.UNBOUND_PDF_QA_DIR??join(tmpdir(),"unbound-access-pdf-qa");await mkdir(dir,{recursive:true});
 await writeFile(join(dir,"reviewed.pdf"),new Uint8Array(complete.doc.output("arraybuffer")));await writeFile(join(dir,"draft.pdf"),new Uint8Array(draft.doc.output("arraybuffer")));
 console.log(`PDF QA files: ${dir}; ${complete.doc.getNumberOfPages()} pages`);
});
test("a failed PDF font request preserves answers and a retry creates a real draft file",async t=>{
 const session=applyProposal(createSession(communityForm),proposeAnswer(createSession(communityForm),"full_name","Zoë Example"));
 const before=JSON.stringify(session),font=new Uint8Array(await readFile(new URL("../public/fonts/DejaVuSans.ttf",import.meta.url)));
 let requests=0;t.mock.method(globalThis,"fetch",async()=>{if(++requests===1)throw new TypeError("Failed to fetch");return new Response(font);});
 await assert.rejects(prepareReviewDownload(session,false),/answers are preserved/);
 assert.equal(JSON.stringify(session),before);
 const retry=await prepareReviewDownload(session,false);
 assert.equal(retry.complete,false);assert.equal(retry.fileName,"UNBOUND_Access_Incomplete_Draft.pdf");
 assert.equal(retry.blob.type,"application/pdf");assert.equal(await retry.blob.slice(0,5).text(),"%PDF-");
 assert.equal(JSON.stringify(session),before);assert.equal(requests,2);
});
test("PDF load failures give a useful recovery message without exposing asset URLs",()=>{
 for(const message of ["Failed to fetch dynamically imported module: https://example.invalid/jspdf-old.js","Importing a module script failed.","Loading chunk 42 failed"]){
  const result=pdfFailure(new TypeError(message));
  assert.equal(result.reload,true);assert.match(result.message,/Reload this tab/);assert.doesNotMatch(result.message,/https:|jspdf-old/);
 }
 const font=pdfFailure(new Error("The PDF font could not load. Your answers are preserved. Check your connection and try the PDF download again."));
 assert.equal(font.reload,false);assert.match(font.message,/font could not load/);
 const unknown=pdfFailure(new Error("Internal details https://example.invalid/asset.js"));
 assert.equal(unknown.reload,false);assert.match(unknown.message,/answers are unchanged/);assert.doesNotMatch(unknown.message,/Internal|https:/);
});
test("a reviewed record can be exported with an unanswered optional email",async t=>{
 let session=createSession(communityForm);
 for(const [id,value] of Object.entries({full_name:"Morgan Example",home_address:"101 Practice Street",household_size:"2",monthly_income:"0",request:"Fictional practice only",support:"No"}))session=applyProposal(session,proposeAnswer(session,id,value));
 assert.equal(issues(session).length,0);const before=JSON.stringify(session);
 const font=new Uint8Array(await readFile(new URL("../public/fonts/DejaVuSans.ttf",import.meta.url)));
 t.mock.method(globalThis,"fetch",async()=>new Response(font));
 const result=await prepareReviewDownload(session,true);
 assert.equal(result.complete,true);assert.equal(result.fileName,"UNBOUND_Access_Reviewed.pdf");assert.equal(await result.blob.slice(0,5).text(),"%PDF-");
 assert.equal(JSON.stringify(session),before);assert.equal(session.answers.email,undefined);
});
test("a conflicting imported follow-up cannot be labelled reviewed or silently erased",async t=>{
 const form=structuredClone(communityForm);form.origin="manual";
 for(const field of form.fields){if(field.id==="support")field.id="needs_help";if(field.id==="support_details"){field.id="help_details";field.requiredWhen!.fieldId="needs_help";}}
 let session=createSession(form);
 for(const [id,value] of Object.entries({full_name:"Morgan Example",home_address:"101 Practice Street",household_size:"2",monthly_income:"0",request:"Fictional practice",needs_help:"Yes",help_details:"Large print"}))session=applyProposal(session,proposeAnswer(session,id,value));
 const font=new Uint8Array(await readFile(new URL("../public/fonts/DejaVuSans.ttf",import.meta.url)));
 t.mock.method(globalThis,"fetch",async()=>new Response(font));
 assert.equal((await prepareReviewDownload(session,true)).complete,true);
 session=applyProposal(session,proposeAnswer(session,"needs_help","No"));
 const result=await prepareReviewDownload(session,true);
 assert.equal(result.complete,false);assert.equal(result.fileName,"UNBOUND_Access_Incomplete_Draft.pdf");
 assert.equal(session.answers.help_details.value,"Large print");assert.equal(await result.blob.slice(0,5).text(),"%PDF-");
});
