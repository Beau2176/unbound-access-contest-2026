import test from "node:test";
import assert from "node:assert/strict";
import { LocalModelRuntime } from "../lib/local-model-runtime.ts";
import type { ModelWorker, RuntimeReply, RuntimeCommand, ModelLoaded } from "../lib/local-model-runtime.ts";
import { opfsModelStorage } from "../lib/local-model-storage.ts";
import { traceModelFileReads } from "../lib/model-file-reads.ts";
import type { ModelRead } from "../lib/model-file-reads.ts";

class FakeWorker implements ModelWorker {
  onmessage: ModelWorker["onmessage"] = null;
  onerror: ModelWorker["onerror"] = null;
  sent: RuntimeCommand[] = []; terminated = 0;
  postMessage(message: RuntimeCommand) { this.sent.push(message); }
  terminate() { this.terminated++; }
  emit(reply: RuntimeReply) { this.onmessage?.({data:reply} as MessageEvent<RuntimeReply>); }
}
class Clock {
  now=0; jobs=new Set<{at:number;run:()=>void}>();
  set=(run:()=>void,delay:number)=>{const job={at:this.now+delay,run};this.jobs.add(job);return()=>{this.jobs.delete(job);};};
  advance(ms:number){this.now+=ms;for(const job of [...this.jobs].sort((a,b)=>a.at-b.at))if(job.at<=this.now&&this.jobs.delete(job))job.run();}
}
const loaded:ModelLoaded={metadata:{"general.architecture":"llama","general.name":"Llama-3.2-3B-Instruct"},backend:"CPU / WebAssembly",storage:"Origin-private files",temporaryStorage:false,params:{n_ctx:2048,n_parallel:1,warmup:false}};
const loadArgs={modelKey:"large" as const,preferGpu:false,origin:"https://practice.invalid"};
const completion={messages:[{role:"user" as const,content:"A fictional question"}],response_format:{type:"json_schema" as const,json_schema:{name:"kind",schema:{},strict:true}},temperature:0,seed:42,max_tokens:24};

test("loading cancellation settles even when the runtime ignores abort, releases its worker and ignores late readiness",async()=>{
  const worker=new FakeWorker(),clock=new Clock(),runtime=new LocalModelRuntime(worker,clock),controller=new AbortController();
  const promise=runtime.load(loadArgs,controller.signal,()=>{}),rejection=assert.rejects(promise,/cancelled/);
  const staleHandler=worker.onmessage;controller.abort();await rejection;
  assert.equal(worker.terminated,1);assert.equal(runtime.isModelLoaded(),false);assert.equal(clock.jobs.size,0);
  staleHandler?.({data:{id:1,task:"loaded",result:loaded}} as MessageEvent<RuntimeReply>);
  assert.equal(runtime.isModelLoaded(),false);runtime.destroy();assert.equal(worker.terminated,1);
});
test("a stalled initialization reaches its deadline and leaves a fresh retry independent of late messages",async()=>{
  const worker=new FakeWorker(),clock=new Clock(),runtime=new LocalModelRuntime(worker,clock);
  const pending=runtime.load(loadArgs,new AbortController().signal,()=>{}),rejection=assert.rejects(pending,/too long to load/);
  worker.emit({id:1,task:"progress",progress:{stage:"loading",progress:100}});clock.advance(120001);await rejection;
  assert.equal(worker.terminated,1);assert.equal(clock.jobs.size,0);
  const retryWorker=new FakeWorker(),retry=new LocalModelRuntime(retryWorker,clock);
  const retried=retry.load(loadArgs,new AbortController().signal,()=>{});
  worker.emit({id:1,task:"loaded",result:loaded});assert.equal(retry.isModelLoaded(),false);
  retryWorker.emit({id:1,task:"loaded",result:loaded});assert.deepEqual(await retried,loaded);assert.equal(retry.isModelLoaded(),true);
  retry.destroy();
});
test("download progress renews the idle deadline while a stopped download remains bounded",async()=>{
  const worker=new FakeWorker(),clock=new Clock(),runtime=new LocalModelRuntime(worker,clock),seen:string[]=[];
  const pending=runtime.load(loadArgs,new AbortController().signal,p=>seen.push(p.stage)),rejection=assert.rejects(pending,/stopped making progress/);
  clock.advance(85000);worker.emit({id:1,task:"progress",progress:{stage:"downloading",progress:50}});clock.advance(85000);
  assert.equal(worker.terminated,0);clock.advance(5001);await rejection;
  assert.deepEqual(seen,["downloading"]);assert.equal(worker.terminated,1);
});
test("continuous download updates cannot extend the absolute loading deadline indefinitely",async()=>{
  const worker=new FakeWorker(),clock=new Clock(),runtime=new LocalModelRuntime(worker,clock);
  const pending=runtime.load(loadArgs,new AbortController().signal,()=>{}),rejection=assert.rejects(pending,/ten minutes/);
  for(let n=0;n<8;n++){clock.advance(75000);worker.emit({id:1,task:"progress",progress:{stage:"downloading",progress:n}});}
  await rejection;assert.equal(worker.terminated,1);assert.equal(runtime.isModelLoaded(),false);
});
test("load and completion worker failures settle without leaving pending timers or accepting another request's reply",async()=>{
  const worker=new FakeWorker(),clock=new Clock(),runtime=new LocalModelRuntime(worker,clock);
  const pending=runtime.load(loadArgs,new AbortController().signal,()=>{});
  worker.emit({id:1,task:"loaded",result:loaded});await pending;assert.equal(clock.jobs.size,0);
  const generated=runtime.complete(completion,new AbortController().signal),failed=assert.rejects(generated,/could not continue/);
  worker.emit({id:1,task:"complete",result:{choices:[{message:{content:'{"kind":"text"}'},finish_reason:"stop"}]}});
  assert.equal(clock.jobs.size,1);worker.onerror?.({} as ErrorEvent);await failed;assert.equal(clock.jobs.size,0);
  assert.equal(runtime.isModelLoaded(),false);assert.equal(worker.terminated,1);
});
test("cancelling an in-progress completion terminates the runtime and preserves the exact previous returned response",async()=>{
  const worker=new FakeWorker(),clock=new Clock(),runtime=new LocalModelRuntime(worker,clock);
  const pending=runtime.load(loadArgs,new AbortController().signal,()=>{});worker.emit({id:1,task:"loaded",result:loaded});await pending;
  const first=runtime.complete(completion,new AbortController().signal);
  const original={choices:[{message:{content:'{"kind":"text"}'},finish_reason:"stop"}]};worker.emit({id:2,task:"complete",result:original});assert.deepEqual(await first,original);
  const controller=new AbortController(),second=runtime.complete(completion,controller.signal),rejected=assert.rejects(second,/cancelled/);
  controller.abort();await rejected;assert.equal(worker.terminated,1);assert.equal(original.choices[0].message.content,'{"kind":"text"}');
});
test("cold inference has a bounded three-minute budget; later completions retain the shorter deadline",async()=>{
  const worker=new FakeWorker(),clock=new Clock(),runtime=new LocalModelRuntime(worker,clock);
  const loading=runtime.load(loadArgs,new AbortController().signal,()=>{});worker.emit({id:1,task:"loaded",result:loaded});await loading;
  const first=runtime.complete(completion,new AbortController().signal);void first.catch(()=>{});
  clock.advance(90001);assert.equal(worker.terminated,0,"a cold prompt must not be killed at the old ninety-second boundary");
  clock.advance(89998);worker.emit({id:2,task:"complete",result:{choices:[{message:{content:'{"kind":"text"}'},finish_reason:"stop"}]}});await first;
  const later=runtime.complete(completion,new AbortController().signal),rejected=assert.rejects(later,/too long/);
  clock.advance(90001);await rejected;assert.equal(worker.terminated,1);
  const otherWorker=new FakeWorker(),otherClock=new Clock(),other=new LocalModelRuntime(otherWorker,otherClock);
  const nextLoad=other.load(loadArgs,new AbortController().signal,()=>{});otherWorker.emit({id:1,task:"loaded",result:loaded});await nextLoad;
  const neverCompletes=other.complete(completion,new AbortController().signal),bounded=assert.rejects(neverCompletes,/too long/);
  otherClock.advance(180001);await bounded;assert.equal(otherWorker.terminated,1);
});
test("timeout releases the page-owned model lease without waiting for an uncooperative worker",async()=>{
  const worker=new FakeWorker(),clock=new Clock();let releases=0;
  worker.terminate=()=>{worker.terminated++;throw new Error("Worker teardown failed");};
  const runtime=new LocalModelRuntime(worker,clock,()=>{releases++;});
  const loading=runtime.load(loadArgs,new AbortController().signal,()=>{});worker.emit({id:1,task:"loaded",result:loaded});await loading;
  const completionPending=runtime.complete(completion,new AbortController().signal),rejected=assert.rejects(completionPending,/too long/);
  clock.advance(180001);await rejected;assert.equal(releases,1);assert.equal(worker.terminated,1);assert.equal(clock.jobs.size,0);
  runtime.destroy();assert.equal(releases,1);
});
test("a short health check does not consume the longer budget for a new task's first system prompt",async()=>{
  const worker=new FakeWorker(),clock=new Clock(),runtime=new LocalModelRuntime(worker,clock);
  const loading=runtime.load(loadArgs,new AbortController().signal,()=>{});worker.emit({id:1,task:"loaded",result:loaded});await loading;
  const health=runtime.complete(completion,new AbortController().signal);
  worker.emit({id:2,task:"complete",result:{choices:[{message:{content:'{"ready":true}'},finish_reason:"stop"}]}});await health;
  const extraction={...completion,messages:[{role:"system" as const,content:"Classify source questions"},...completion.messages]};
  const first=runtime.complete(extraction,new AbortController().signal);void first.catch(()=>{});
  clock.advance(90001);assert.equal(worker.terminated,0);
  worker.emit({id:3,task:"complete",result:{choices:[{message:{content:'{"kind":"text"}'},finish_reason:"stop"}]}});await first;
  const warm=runtime.complete(extraction,new AbortController().signal),rejected=assert.rejects(warm,/too long/);
  clock.advance(90001);await rejected;assert.equal(worker.terminated,1);
});
test("cancellation and worker errors release their page-owned model lease exactly once",async()=>{
  for(const mode of ["cancel","error"]){
    const worker=new FakeWorker(),clock=new Clock(),controller=new AbortController();let releases=0;
    const runtime=new LocalModelRuntime(worker,clock,()=>{releases++;});
    const pending=runtime.load(loadArgs,controller.signal,()=>{}),rejected=assert.rejects(pending,/cancelled|could not continue/);
    if(mode==="cancel")controller.abort();else worker.onerror?.({} as ErrorEvent);
    await rejected;assert.equal(releases,1);runtime.destroy();assert.equal(releases,1);
  }
});

function directoryFixture() {
  const files=new Map<string,Blob>();let contentReads=0;
  const directory={
    async getFileHandle(key:string,options?:{create?:boolean}){
      if(!files.has(key)&&!options?.create)throw new DOMException("Missing","NotFoundError");
      if(!files.has(key))files.set(key,new Blob());
      return {kind:"file",name:key,async getFile(){const blob=files.get(key)!;Object.defineProperty(blob,"arrayBuffer",{value:()=>{contentReads++;throw new Error("Do not read file contents for size");},configurable:true});return blob;},async createWritable(){const chunks:ArrayBuffer[]=[];return new WritableStream({write(chunk){chunks.push(new Uint8Array(chunk).buffer);},close(){files.set(key,new Blob(chunks));}});}};
    },
    async removeEntry(key:string){files.delete(key);},
    async *entries(){for(const key of files.keys())yield[key,{kind:"file",name:key}] as const;},
  };
  return{files,directory:directory as unknown as Parameters<typeof opfsModelStorage>[0],contentReads:()=>contentReads};
}
test("disk-backed model enumeration and size checks never read the model body",async()=>{
  const f=directoryFixture();f.files.set("model.gguf",new Blob([new Uint8Array(1048576)]));
  const storage=opfsModelStorage(f.directory);assert.equal(await storage.getSize("model.gguf"),1048576);
  assert.deepEqual(await storage.list(),[{key:"model.gguf",size:1048576}]);assert.equal(f.contentReads(),0);
});
test("new model downloads stream to disk and subsequent checks use file metadata",async()=>{
  const f=directoryFixture(),storage=opfsModelStorage(f.directory);
  const response=new Response("exact original model bytes");
  Object.defineProperty(response,"blob",{value:()=>{throw new Error("No whole-file Blob materialization");}});
  await storage.write("model.gguf",response.body!);
  assert.deepEqual(await storage.list(),[{key:"model.gguf",size:26}]);assert.equal(await storage.getSize("model.gguf"),26);
  assert.equal(f.contentReads(),0);
});
test("storage denial stays an error rather than pretending a damaged file is missing",async()=>{
  const f=directoryFixture();f.directory.getFileHandle=async()=>{throw new DOMException("Denied","SecurityError");};
  await assert.rejects(opfsModelStorage(f.directory).getSize("model.gguf"),/Denied/);
});
test("an interrupted zero-byte disk file is not reused and a streamed retry replaces it",async()=>{
  const f=directoryFixture();f.files.set("model.gguf",new Blob());
  const storage=opfsModelStorage(f.directory);
  assert.equal(await storage.getSize("model.gguf"),-1);
  await storage.write("model.gguf",new Response("original bytes").body!);
  assert.equal(await storage.getSize("model.gguf"),14);assert.equal(f.contentReads(),0);
});
test("model file tracing preserves original slice bytes and reports requested offsets without reading the whole file",async()=>{
  const blob = new Blob(["unchanged-model-bytes"]), reads:ModelRead[]=[];
  Object.defineProperty(blob,"arrayBuffer",{value:()=>{throw new Error("No whole-file read");}});
  const traced=traceModelFileReads(blob,read=>reads.push(read));
  assert.equal(traced,blob);assert.equal(traced.size,21);
  assert.equal(new TextDecoder().decode(await traced.slice(10,15).arrayBuffer()),"model");
  assert.equal(new TextDecoder().decode(await traced.slice(-5).arrayBuffer()),"bytes");
  assert.deepEqual(reads,[{offset:10,bytes:5,outcome:"start"},{offset:10,bytes:5,outcome:"ready"},{offset:16,bytes:5,outcome:"start"},{offset:16,bytes:5,outcome:"ready"}]);
});
test("model file tracing preserves a real read rejection and records its range",async()=>{
  const blob=new Blob(["unreadable"]),reads:ModelRead[]=[],failure=new DOMException("Snapshot unavailable","NotReadableError");
  Object.defineProperty(blob,"slice",{configurable:true,value:()=>{const chunk=new Blob(["read"]);Object.defineProperty(chunk,"arrayBuffer",{configurable:true,value:async()=>{throw failure;}});return chunk;}});
  const traced=traceModelFileReads(blob,read=>reads.push(read));
  await assert.rejects(traced.slice(2,6).arrayBuffer(),error=>error===failure);
  assert.deepEqual(reads,[{offset:2,bytes:4,outcome:"start"},{offset:2,bytes:4,outcome:"error",error:"NotReadableError: Snapshot unavailable"}]);
});
