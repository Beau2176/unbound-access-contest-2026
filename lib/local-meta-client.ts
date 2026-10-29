"use client";
import type { Wllama } from "@wllama/wllama/esm/index.js";
import { LOCAL_META, localAnswerRequest, localExtractionRequest, parseLocalAnswer, parseLocalExtraction } from "./local-meta-policy";
import type { LocalField } from "./local-meta-policy";
import type { FormDefinition } from "./access";

export type LocalReceipt = { at: string; model: string; revision: string; task: "extract" | "answer"; input: unknown; raw: string; elapsedMs: number; tokens?: { prompt: number; completion: number }; accepted: boolean; error?: string };
type LocalState = { phase: "idle" | "downloading" | "loading" | "ready" | "running" | "error"; progress: number; message: string; receipts: LocalReceipt[]; temporaryStorage?: boolean; backend?: "WebGPU" | "CPU / WebAssembly" };
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
export function cancelLocalMeta() { controller?.abort(); update({ message: "Stopping on-device AI. Your confirmed answers are unchanged." }); }
export async function unloadLocalMeta(removeDownload = false) {
  controller?.abort();
  if (engine) { await engine.exit(); if (removeDownload) await engine.cacheManager.delete(LOCAL_META.url); }
  engine = null; controller = null;
  update({ phase: "idle", progress: 0, message: removeDownload ? "The downloaded model was removed from this browser." : "On-device AI is off. Your form and answers are preserved." });
}

export async function loadLocalMeta(consent: boolean, preferGpu = true) {
  if (!consent) throw new Error("Confirm the optional model download first.");
  if (typeof crypto?.subtle?.digest !== "function") throw new Error("On-device AI needs a secure HTTPS page. Open the published app to use it; practice forms still work here.");
  if (["downloading", "loading", "running"].includes(state.phase)) throw new Error("Wait for the current AI task or cancel it first.");
  if (engine?.isModelLoaded()) { update({ phase: "ready" }); return; }
  controller = new AbortController(); const signal = controller.signal;
  update({ phase: "downloading", progress: 0, message: "Preparing the optional model download…" });
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
    await next.loadModelFromUrl(LOCAL_META.url, {
      n_ctx: 4096, n_batch: 128, n_ubatch: 128, n_threads: crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1, n_gpu_layers: useGpu ? 99 : 0, seed: 42, signal,
      progressCallback: ({ loaded, total }) => {
        const progress = Math.min(100, Math.round(100 * loaded / (total || LOCAL_META.bytes)));
        if (state.progress !== progress) update({ phase: progress === 100 ? "loading" : "downloading", progress, message: progress === 100 ? "Loading the model into memory…" : `Downloading the model: ${progress}%. Your answers stay here.` });
      },
    });
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const meta = next.getLoadedContextInfo().metadata;
    if (meta["general.architecture"] !== "llama" || !/llama.?3[._-]?2.?1b/i.test(meta["general.name"] ?? "")) throw new Error("The downloaded model did not identify itself as the expected Llama model.");
    update({ phase: "ready", progress: 100, message: `Meta Llama is ready on this device. AI requests stay in this browser. Acceleration requested: ${state.backend}.` + (temporaryStorage ? " Model storage is temporary here; closing or unloading will require a new download." : "") });
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
  const request = args.task === "extract" ? localExtractionRequest(args.text) : localAnswerRequest(args.field, args.text);
  const started = performance.now(), at = new Date().toISOString();
  controller = new AbortController(); const signal = controller.signal;
  const timer = window.setTimeout(() => controller?.abort(), 180000);
  update({ phase: "running", message: "Meta is proposing an answer on this device. Nothing is confirmed yet." });
  let raw = "", tokens: LocalReceipt["tokens"];
  const receipt = (accepted: boolean, error?: string): LocalReceipt => ({ at, model: LOCAL_META.name, revision: LOCAL_META.revision, task: args.task, input: args.task === "extract" ? { source: args.text } : { field: args.field, utterance: args.text }, raw, elapsedMs: Math.round(performance.now() - started), tokens, accepted, ...(error ? { error } : {}) });
  try {
    const result = await engine.createChatCompletion({ messages: request.messages, response_format: { type: "json_schema", json_schema: { name: args.task === "extract" ? "source_questions" : "proposed_answer", schema: request.schema, strict: true } }, temperature: 0, seed: 42, max_tokens: args.task === "extract" ? 1500 : 220, abortSignal: signal });
    raw = result.choices[0]?.message.content ?? "";
    tokens = result.usage ? { prompt: result.usage.prompt_tokens, completion: result.usage.completion_tokens } : undefined;
    if (signal.aborted || result.choices[0]?.finish_reason === "length") throw new Error(signal.aborted ? "AI task cancelled. Your answers are unchanged." : "The model response reached its limit. Try a shorter form; your answers are unchanged.");
    const data = args.task === "extract" ? parseLocalExtraction(raw, args.text) : parseLocalAnswer(raw, args.field, args.text);
    update({ receipts: [...state.receipts.slice(-7), receipt(true)], message: "AI proposal checked. Review it before confirming." });
    return { data, model: `${LOCAL_META.name} · on this device` };
  } catch (error) {
    const message = signal.aborted ? "AI task cancelled. Your confirmed answers are unchanged." : error instanceof Error ? error.message : "The AI proposal could not be checked. Your answers are unchanged.";
    update({ receipts: [...state.receipts.slice(-7), receipt(false, message)], message });
    throw new Error(message);
  } finally { clearTimeout(timer); controller = null; update({ phase: engine?.isModelLoaded() ? "ready" : "idle" }); }
}
