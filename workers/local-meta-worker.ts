import type { Wllama } from "@wllama/wllama/esm/index.js";
import { LOCAL_META_MODELS } from "../lib/local-meta-policy";
import { selectModelStorage } from "../lib/local-model-storage";
import { traceModelFileReads } from "../lib/model-file-reads";
import { acquireModelLease } from "../lib/local-model-lease";
import type { ModelLease } from "../lib/local-model-lease";
import type { RuntimeCommand, RuntimeReply, CompletionResult } from "../lib/local-model-runtime";

const scope = globalThis as unknown as { onmessage: ((event: MessageEvent<RuntimeCommand>) => void) | null; postMessage(message: RuntimeReply): void; crossOriginIsolated: boolean; location: Location };
let engine: Wllama | null = null;
let lease: ModelLease | null = null;
scope.onmessage = async event => {
  const command = event.data;
  try {
    if (command.task === "load") {
      if (engine || lease) throw new Error("A model is already active.");
      if (command.origin !== scope.location.origin || !Object.hasOwn(LOCAL_META_MODELS,command.modelKey)) throw new Error("The local model request could not be checked.");
      const model = LOCAL_META_MODELS[command.modelKey];
      const progress = (stage:"checking"|"downloading"|"loading", value?:number, detail?:string) => scope.postMessage({id:command.id,task:"progress",progress:{stage,progress:value,detail}});
      progress("checking",undefined,"origin-model-lock");
      lease = await acquireModelLease(navigator.locks);
      progress("checking",undefined,"runtime-import");
      const {Wllama,CacheManager} = await import("@wllama/wllama/esm/index.js");
      progress("checking",undefined,"storage-open");
      const storage = await selectModelStorage(command.origin);
      if (storage.label !== "Origin-private files" && command.modelKey !== "small") throw new Error("This browser could not set up local file storage for the larger model. Continue with a prepared form or reviewed manual proposal.");
      const cacheManager = new CacheManager([storage.backend]);
      const quiet = {debug(...values:unknown[]){
        const text=String(values[0]??"");
        if(text.includes("Calling wllamaStart"))progress("loading",100,"runtime-start");
        else if(text==="Loading model...")progress("loading",100,"weights-load");
      },log(){},warn(){},error(){}};
      const next = new Wllama({default:`${command.origin}/wasm/wllama.wasm`},{logger:quiet,suppressNativeLog:true,allowOffline:true,cacheManager});
      engine = next;
      next.setCompat({wasm:`${command.origin}/wasm/compat/wllama.wasm`,worker:`${command.origin}/wasm/compat/wllama.js`},"firefox_safari");
      const gpu = (navigator as Navigator & {gpu?:{requestAdapter():Promise<unknown>}}).gpu;
      let useGpu = false;
      try { useGpu = command.preferGpu && !!(await gpu?.requestAdapter()); } catch { /* CPU remains available. */ }
      progress("checking",undefined,"model-index");
      const file = await next.modelManager.getModelOrDownload({url:model.url},{progressCallback:({loaded,total})=>progress("downloading",Math.min(100,Math.round(100*loaded/(total||model.bytes))))});
      progress("checking",undefined,"model-open");
      let readCount = 0, readBytes = 0;
      const blobs = (await file.open()).map(blob => traceModelFileReads(blob, read => {
        if (read.outcome === "ready") { readCount++; readBytes += read.bytes; }
        if (read.outcome === "error" || (read.outcome === "start" && read.bytes > 1024 * 1024) || (read.outcome === "ready" && readCount % 256 === 0))
          progress("loading",100,`file-read-${read.outcome}: offset=${read.offset} bytes=${read.bytes} completed=${readCount} total=${readBytes}${read.error?` error=${read.error}`:""}`);
      }));
      if (blobs.reduce((size,blob)=>size+blob.size,0)!==model.bytes) throw new Error("The saved model file is incomplete. Remove its downloaded files and retry; your form is unchanged.");
      progress("checking",undefined,"model-header-read");
      const header = await blobs[0].slice(0,16).arrayBuffer();
      if (header.byteLength !== 16) throw new Error("The saved model header is incomplete. Your form is unchanged.");
      progress("loading",100,next.getWorkerResources().compat?"runtime-compatibility":"runtime-native");
      const params = {n_ctx:command.modelKey!=="small"?1024:4096,n_batch:command.modelKey!=="small"?32:128,n_ubatch:command.modelKey!=="small"?32:128,n_parallel:1,warmup:false,n_threads:scope.crossOriginIsolated?Math.min(4,navigator.hardwareConcurrency||1):1,n_gpu_layers:useGpu?99:0,seed:42};
      await next.loadModel(blobs,params);
      scope.postMessage({id:command.id,task:"loaded",result:{metadata:next.getLoadedContextInfo().metadata,backend:useGpu?"WebGPU":"CPU / WebAssembly",storage:storage.label,temporaryStorage:storage.temporary,params:{n_ctx:params.n_ctx,n_parallel:params.n_parallel,warmup:params.warmup,n_batch:params.n_batch,n_ubatch:params.n_ubatch}}});
    } else if (command.task === "complete") {
      if (!engine?.isModelLoaded()) throw new Error("Load the optional on-device Meta model first.");
      const result = await engine.createChatCompletion(command.input);
      scope.postMessage({id:command.id,task:"complete",result:result as CompletionResult});
    }
  } catch(error) {
    // LocalModelRuntime terminates a failed load's worker. The browser then
    // releases its lock together with the runtime, avoiding an allocation race.
    scope.postMessage({id:command.id,task:"error",message:error instanceof Error?error.message:"On-device AI could not continue. Your confirmed answers are unchanged."});
  }
};
