"use client";
import type { Wllama } from "@wllama/wllama/esm/index.js";
import { LOCAL_META_MODELS, assertLocalModelMetadata, localAnswerRequest, localExtractionRequest, parseLocalAnswer, executeLocalExtraction } from "./local-meta-policy";
import type { LocalField, LocalModelKey } from "./local-meta-policy";
import type { FormDefinition } from "./access";

type LocalCall = { sourceId: string; raw: string; elapsedMs: number; tokens?: { prompt: number; completion: number } };
export type LocalReceipt = { at: string; model: string; revision: string; contract: string; task: "extract" | "answer"; input: unknown; request: unknown; raw: string; rawFormat?: string; calls?: LocalCall[]; assembledFields?: unknown; elapsedMs: number; tokens?: { prompt: number; completion: number }; accepted: boolean; error?: string };
type LocalState = { phase: "idle" | "downloading" | "loading" | "ready" | "running" | "error"; progress: number; message: string; receipts: LocalReceipt[]; modelKey?: LocalModelKey; temporaryStorage?: boolean; backend?: "WebGPU" | "CPU / WebAssembly" };
const initial: LocalState = { phase: "idle", progress: 0, message: "On-device AI is off. Practice forms are ready to use.", receipts: [] };
let state = initial, engine: Wllama | null = null, controller: AbortController | null = null;
const listeners = new Set<() => void>();
export const getLocalMetaState = () => state;
export const getLocalMetaServerState = () => initial;
export function subscribeLocalMeta(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function update(patch: Partial<LocalState>) { state = { ...state, ...patch }; listeners.forEach(f => f()); }
// Private/insecure preview contexts may not provide OPFS. This supported backend
// keeps only model files in memory; it does not change browser security settings.
function memoryModelStorage() {
  const files = new Map<string, Blob>();
  return { isSupported: () => true,
    read: async (key: string) => files.get(key) ?? null,
    write: async (key: string, stream: ReadableStream) => { files.set(key, await new Response(stream).blob()); },
    getSize: async (key: string) => files.get(key)?.size ?? -1,
    list: async () => [...files].map(([key, blob]) => ({ key, size: blob.size })),
    delete: async (key: string) => { files.delete(key); },
  };
}
function persistentModelStorage() {
  const cacheName = "unbound-meta-model-v1";
  const request = (key: string) => new Request(`${location.origin}/__local_model_cache/${encodeURIComponent(key)}`);
  return { isSupported: () => typeof caches !== "undefined",
    read: async (key: string) => { const response = await (await caches.open(cacheName)).match(request(key)); return response ? response.blob() : null; },
    write: async (key: string, stream: ReadableStream) => { await (await caches.open(cacheName)).put(request(key), new Response(stream)); },
    getSize: async (key: string) => { const response = await (await caches.open(cacheName)).match(request(key)); return response ? (await response.blob()).size : -1; },
    list: async () => { const cache = await caches.open(cacheName); return Promise.all((await cache.keys()).map(async req => ({ key: decodeURIComponent(new URL(req.url).pathname.split("/").pop()!), size: (await (await cache.match(req))!.blob()).size }))); },
    delete: async (key: string) => { await (await caches.open(cacheName)).delete(request(key)); },
  };
}
export function clearLocalMetaReceipts() { update({ receipts: [] }); }
export function downloadLocalMetaReceipts() {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ scope: "On-device development checks, not a user study", receipts: state.receipts }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "unbound-local-meta-receipts.json";
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function cancelLocalMeta() { controller?.abort(); update({ message: "Stopping on-device AI. Your confirmed answers are unchanged." }); }
export async function unloadLocalMeta(removeDownload = false) {
  controller?.abort();
  if (engine) { await engine.exit(); if (removeDownload) for(const model of Object.values(LOCAL_META_MODELS))await engine.cacheManager.delete(model.url); }
  if(removeDownload && typeof caches !== "undefined")await caches.delete("unbound-meta-model-v1");
  engine = null; controller = null;
  update({ phase: "idle", progress: 0, ...(removeDownload?{modelKey:undefined}:{}), message: removeDownload ? "Downloaded model files were removed from this browser. Your form and answers are preserved." : "On-device AI is off. Your form and answers are preserved." });
}

export async function loadLocalMeta(consent: boolean, preferGpu = true, modelKey: LocalModelKey = "small") {
  const model = LOCAL_META_MODELS[modelKey];
  if (!consent) throw new Error("Confirm the optional model download first.");
  if (typeof crypto?.subtle?.digest !== "function") throw new Error("On-device AI needs a secure HTTPS page. Open the published app to use it; practice forms still work here.");
  if (["downloading", "loading", "running"].includes(state.phase)) throw new Error("Wait for the current AI task or cancel it first.");
  if (engine?.isModelLoaded()) { if(state.modelKey!==modelKey)throw new Error("Turn off the current model before choosing another one."); update({ phase: "ready" }); return; }
  controller = new AbortController(); const signal = controller.signal;
  update({ phase: "downloading", progress: 0, modelKey, message: `Preparing ${model.name} (${model.downloadLabel})…` });
  try {
    const { Wllama, CacheManager } = await import("@wllama/wllama/esm/index.js");
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const quiet = { debug() {}, log() {}, warn() {}, error() {} };
    const persistent = persistentModelStorage(), temporaryStorage = !persistent.isSupported();
    const cacheManager = new CacheManager([persistent, memoryModelStorage()]);
    update({ temporaryStorage });
    const next = new Wllama({ default: "/wasm/wllama.wasm" }, { logger: quiet, suppressNativeLog: true, allowOffline: true, cacheManager });
    engine = next;
    next.setCompat({ wasm: "/wasm/compat/wllama.wasm", worker: "/wasm/compat/wllama.js" }, "firefox_safari");
    const gpu = (navigator as Navigator & {gpu?: {requestAdapter: () => Promise<unknown>}}).gpu;
    let useGpu = false;
    try { useGpu = preferGpu && !!(await gpu?.requestAdapter()); } catch { /* The CPU path remains optional. */ }
    update({backend: useGpu ? "WebGPU" : "CPU / WebAssembly"});
    await next.loadModelFromUrl(model.url, {
      n_ctx: modelKey==="large" ? 2048 : 4096, n_batch: 128, n_ubatch: 128, n_threads: crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1, n_gpu_layers: useGpu ? 99 : 0, seed: 42, signal,
      progressCallback: ({ loaded, total }) => {
        const progress = Math.min(100, Math.round(100 * loaded / (total || model.bytes)));
        if (state.progress !== progress) update({ phase: progress === 100 ? "loading" : "downloading", progress, message: progress === 100 ? "Loading the model into memory…" : `Downloading the model: ${progress}%. Your answers stay here.` });
      },
    });
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const meta = next.getLoadedContextInfo().metadata;
    assertLocalModelMetadata(modelKey, meta);
    update({ phase: "ready", progress: 100, message: `${model.name} is ready on this device. AI requests stay in this browser. Acceleration requested: ${state.backend}.` + (temporaryStorage ? " Model storage is temporary here; closing or unloading will require a new download." : "") });
  } catch (error) {
    try { await engine?.exit(); } catch { /* Keep the original, useful failure. */ }
    engine = null;
    const message = signal.aborted ? "Model loading cancelled. Your form is unchanged." : "On-device AI could not start in this browser. Your practice forms are still available. " + (error instanceof Error ? error.message : "");
    update({ phase: signal.aborted ? "idle" : "error", message, progress: 0 });
    if (!signal.aborted) throw new Error(message);
  } finally { controller = null; }
}

export function runLocalMeta(args: { task: "extract"; text: string }): Promise<{ data: FormDefinition; model: string }>;
export function runLocalMeta(args: { task: "answer"; text: string; field: LocalField }): Promise<{ data: ReturnType<typeof parseLocalAnswer>; model: string }>;
export async function runLocalMeta(args: { task: "extract"; text: string } | { task: "answer"; text: string; field: LocalField }) {
  if (!engine?.isModelLoaded() || state.phase !== "ready") throw new Error("Load the optional on-device Meta model first.");
  const model = LOCAL_META_MODELS[state.modelKey??"small"];
  const request = args.task === "extract" ? localExtractionRequest(args.text) : localAnswerRequest(args.field, args.text);
  const started = performance.now(), at = new Date().toISOString();
  const taskController = new AbortController(); controller = taskController; const signal = taskController.signal;
  const timer = window.setTimeout(() => taskController.abort(), 180000);
  update({ phase: "running", message: args.task === "extract" ? "Meta is proposing question types on this device. Your current form is unchanged." : "Meta is proposing an answer on this device. Nothing is confirmed yet." });
  let raw = "", tokens: LocalReceipt["tokens"], assembledFields: unknown;
  const calls: LocalCall[] = [];
  const receipt = (accepted: boolean, error?: string): LocalReceipt => ({ at, model: model.name, revision: model.revision, contract: args.task === "extract" ? "source-line-types-v3" : "grounded-answer-v2", task: args.task, input: args.task === "extract" ? { source: args.text } : { field: args.field, utterance: args.text }, request, raw, ...(args.task === "extract" ? {rawFormat: "Newline-joined model responses. Each exact original response is preserved separately in calls; assembledFields is application-derived.", calls, assembledFields} : {}), elapsedMs: Math.round(performance.now() - started), tokens, accepted, ...(error ? { error } : {}) });
  try {
    let data: FormDefinition | ReturnType<typeof parseLocalAnswer>;
    if ("requests" in request) {
      const result = await executeLocalExtraction(request, async (step, sourceId) => {
        const callStarted = performance.now();
        const result = await engine!.createChatCompletion({ messages: step.messages, response_format: { type: "json_schema", json_schema: { name: "question_type", schema: step.schema, strict: true } }, temperature: 0, seed: 42, max_tokens: 24, abortSignal: signal });
        const callRaw = result.choices[0]?.message.content ?? "";
        const usage = result.usage ? {prompt: result.usage.prompt_tokens, completion: result.usage.completion_tokens} : undefined;
        calls.push({sourceId,raw:callRaw,elapsedMs:Math.round(performance.now()-callStarted),tokens:usage});
        raw = calls.map(call => call.raw).join("\n");
        if (usage) tokens = {prompt:(tokens?.prompt??0)+usage.prompt,completion:(tokens?.completion??0)+usage.completion};
        if (signal.aborted || result.choices[0]?.finish_reason === "length") throw new Error(signal.aborted ? "AI task cancelled. Your answers are unchanged." : "The model response reached its limit. Your form is unchanged.");
        return callRaw;
      }, {signal,onProgress:(current,total)=>update({message:`Meta is reading question ${current} of ${total} on this device. Your current form is unchanged.`})});
      data=result.data; assembledFields=result.fields;
    } else {
      const result = await engine.createChatCompletion({ messages: request.messages, response_format: { type: "json_schema", json_schema: { name: "proposed_answer", schema: request.schema, strict: true } }, temperature: 0, seed: 42, max_tokens: 220, abortSignal: signal });
      raw = result.choices[0]?.message.content ?? "";
      tokens = result.usage ? { prompt: result.usage.prompt_tokens, completion: result.usage.completion_tokens } : undefined;
      if (signal.aborted || result.choices[0]?.finish_reason === "length") throw new Error(signal.aborted ? "AI task cancelled. Your answers are unchanged." : "The model response reached its limit. Your answer is unchanged.");
      data = parseLocalAnswer(raw, (args as {field:LocalField}).field, args.text);
    }
    update({ receipts: [...state.receipts.slice(-7), receipt(true)], message: "AI proposal checked. Review it before confirming." });
    return { data, model: `${model.name} · on this device` };
  } catch (error) {
    const message = signal.aborted ? "AI task cancelled. Your confirmed answers are unchanged." : error instanceof Error ? error.message : "The AI proposal could not be checked. Your answers are unchanged.";
    update({ receipts: [...state.receipts.slice(-7), receipt(false, message)], message });
    throw new Error(message);
  } finally { clearTimeout(timer); if(controller === taskController)controller = null; update({ phase: engine?.isModelLoaded() ? "ready" : "idle" }); }
}
