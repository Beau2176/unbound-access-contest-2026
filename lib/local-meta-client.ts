"use client";
import { LocalModelRuntime } from "./local-model-runtime";
import type { ModelLoaded, ModelProgress } from "./local-model-runtime";
import { removeModelDownloads } from "./local-model-storage";
import ModelWorker from "../workers/local-meta-worker?worker";
import { LOCAL_META_MODELS, assertLocalModelMetadata, localAnswerRequest, localExtractionRequest, parseLocalAnswer, executeLocalExtraction } from "./local-meta-policy";
import type { LocalField, LocalModelKey } from "./local-meta-policy";
import type { FormDefinition } from "./access";

type LocalCall = { sourceId: string; raw: string; elapsedMs: number; tokens?: { prompt: number; completion: number } };
export type LocalReceipt = { at: string; model: string; revision: string; quantization?: string; contract: string; task: "extract" | "answer"; input: unknown; request: unknown; raw: string; rawFormat?: string; calls?: LocalCall[]; assembledFields?: unknown; elapsedMs: number; tokens?: { prompt: number; completion: number }; accepted: boolean; error?: string };
export type LocalLoadReport = { at: string; model: string; revision: string; quantization?: string; outcome: "ready" | "cancelled" | "error" | "interrupted"; elapsedMs: number; events: ({elapsedMs:number}&ModelProgress)[]; storage?: string; params?: ModelLoaded["params"]; error?: string };
type LocalState = { loads: LocalLoadReport[]; phase: "idle" | "downloading" | "loading" | "ready" | "running" | "error"; progress: number; message: string; receipts: LocalReceipt[]; modelKey?: LocalModelKey; temporaryStorage?: boolean; backend?: "WebGPU" | "CPU / WebAssembly" };
const initial: LocalState = { phase: "idle", progress: 0, message: "On-device AI is off. Practice forms are ready to use.", receipts: [], loads: [] };
const LOAD_REPORT_KEY = "unbound-meta-loads-v1";
function recoveredLoadReports(): LocalLoadReport[] {
  if (typeof window === "undefined") return [];
  try { const value = JSON.parse(sessionStorage.getItem(LOAD_REPORT_KEY) ?? "[]");
    return Array.isArray(value) ? value.slice(-8).filter((item: LocalLoadReport) => typeof item?.at === "string" && typeof item.model === "string" && typeof item.revision === "string" && Array.isArray(item.events) && item.events.length <= 160 && ["ready","cancelled","error","interrupted"].includes(item.outcome)) : [];
  } catch { return []; }
}
let state: LocalState = {...initial,loads:recoveredLoadReports()}, engine: LocalModelRuntime | null = null, controller: AbortController | null = null;
const listeners = new Set<() => void>();
export const getLocalMetaState = () => state;
export const getLocalMetaServerState = () => initial;
export function subscribeLocalMeta(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function update(patch: Partial<LocalState>) { state = { ...state, ...patch }; listeners.forEach(f => f()); }
export function clearLocalMetaReceipts() { update({ receipts: [], loads: [] }); try { sessionStorage.removeItem(LOAD_REPORT_KEY); } catch {} }
export function downloadLocalMetaReceipts() {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ scope: "On-device development checks, not a user study", loads: state.loads, receipts: state.receipts }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "unbound-local-meta-receipts.json";
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function cancelLocalMeta() { update({ message: "Stopping on-device AI. Your confirmed answers are unchanged." }); controller?.abort(); }
export async function unloadLocalMeta(removeDownload = false) {
  const previous = engine, current = controller;
  engine = null; controller = null; current?.abort(); previous?.destroy();
  let removed = false;
  try { if (removeDownload) { await removeModelDownloads(); removed = true; } }
  finally {
    update({ phase: "idle", progress: 0, ...(removed ? {modelKey:undefined} : {}), message: removed ? "Downloaded model files were removed from this browser. Your form and answers are preserved." : removeDownload ? "On-device AI is off. Its files could not be removed. Turn off AI in other UNBOUND Access tabs before retrying. Your form and answers are preserved." : "On-device AI is off. Your form and answers are preserved." });
  }
}

export async function loadLocalMeta(consent: boolean, preferGpu = true, modelKey: LocalModelKey = "small") {
  const model = LOCAL_META_MODELS[modelKey];
  if (!consent) throw new Error("Confirm the optional model download first.");
  if (typeof crypto?.subtle?.digest !== "function") throw new Error("On-device AI needs a secure HTTPS page. Open the published app to use it; practice forms still work here.");
  if (["downloading", "loading", "running"].includes(state.phase)) throw new Error("Wait for the current AI task or cancel it first.");
  if (engine?.isModelLoaded()) { if (state.modelKey !== modelKey) throw new Error("Turn off the current model before choosing another one."); update({phase:"ready"}); return; }
  const taskController = new AbortController(), signal = taskController.signal;
  controller = taskController;
  const started = performance.now(), at = new Date().toISOString();
  const events: LocalLoadReport["events"] = [{stage:"checking",detail:"worker-start",elapsedMs:0}];
  let runtime: LocalModelRuntime | null = null;
  let loaded: ModelLoaded | undefined;
  const record = (outcome: LocalLoadReport["outcome"], error?: string) => {
    const report: LocalLoadReport = {at,model:model.name,revision:model.revision,quantization:model.quantization,outcome,elapsedMs:Math.round(performance.now()-started),events,...(loaded?{storage:loaded.storage,params:loaded.params}:{}),...(error?{error}:{})};
    update({loads:[...state.loads.slice(-7),report]});
    try { sessionStorage.setItem(LOAD_REPORT_KEY,JSON.stringify(state.loads)); } catch {}
  };
  update({phase:"downloading",progress:0,modelKey,message:`Preparing ${model.name} (${model.downloadLabel})…`});
  function checkpoint() {
    const report: LocalLoadReport = {at,model:model.name,revision:model.revision,quantization:model.quantization,outcome:"interrupted",elapsedMs:Math.round(performance.now()-started),events:[...events],error:"The page was reloaded before a completed load was recorded."};
    try { sessionStorage.setItem(LOAD_REPORT_KEY,JSON.stringify([...state.loads.slice(-7),report])); } catch {}
  }
  checkpoint();
  try {
    try { runtime = new LocalModelRuntime(new ModelWorker()); }
    catch { throw new Error("The on-device AI worker could not start. Reload this page to try again. Your confirmed answers are unchanged."); }
    engine = runtime;
    loaded = await runtime.load({modelKey,preferGpu,origin:location.origin},signal,progress => {
      if (controller !== taskController || signal.aborted) return;
      const last = events.at(-1);
      if (last?.stage !== progress.stage || last?.progress !== progress.progress || last?.detail !== progress.detail) events.push({...progress,elapsedMs:Math.round(performance.now()-started)});
      checkpoint();
      const value = progress.progress ?? 0;
      update({phase:progress.stage==="loading"?"loading":"downloading",progress:value,message:progress.stage==="loading"?"Loading the model into memory… You can cancel and continue without AI.":progress.stage==="checking"?"Checking saved model files… Your form stays available after cancellation.":`Downloading the model: ${value}%. Your answers stay here.`});
    });
    if (signal.aborted || engine !== runtime) throw new Error("Model loading cancelled. Your form is unchanged.");
    assertLocalModelMetadata(modelKey,loaded.metadata);
    record("ready");
    update({phase:"ready",progress:100,temporaryStorage:loaded.temporaryStorage,backend:loaded.backend,message:`${model.name} is ready on this device. AI requests stay in this browser. Acceleration requested: ${loaded.backend}.`+(loaded.temporaryStorage?" Model storage is temporary here; closing or unloading will require a new download.":"")});
  } catch(error) {
    runtime?.destroy();
    const message = signal.aborted ? "Model loading cancelled. Your form is unchanged." : error instanceof Error ? error.message : "On-device AI could not start. Your confirmed answers are unchanged.";
    record(signal.aborted?"cancelled":"error",message);
    if (engine === runtime) engine = null;
    if (controller === taskController) update({phase:signal.aborted?"idle":"error",progress:0,message});
    if (!signal.aborted) throw new Error(message);
  } finally { if (controller === taskController) controller = null; }
}

export function runLocalMeta(args: { task: "extract"; text: string }): Promise<{ data: FormDefinition; model: string }>;
export function runLocalMeta(args: { task: "answer"; text: string; field: LocalField }): Promise<{ data: ReturnType<typeof parseLocalAnswer>; model: string }>;
export async function runLocalMeta(args: { task: "extract"; text: string } | { task: "answer"; text: string; field: LocalField }) {
  if (!engine?.isModelLoaded() || state.phase !== "ready") throw new Error("Load the optional on-device Meta model first.");
  const model = LOCAL_META_MODELS[state.modelKey??"small"];
  const request = args.task === "extract" ? localExtractionRequest(args.text) : localAnswerRequest(args.field, args.text);
  const started = performance.now(), at = new Date().toISOString();
  const taskController = new AbortController(); controller = taskController; const signal = taskController.signal;
  const timer = window.setTimeout(() => taskController.abort(), args.task === "extract" && "requests" in request ? Math.min(600000, 15000 + request.requests.length * 45000) : 180000);
  const runtime = engine;
  update({ phase: "running", message: args.task === "extract" ? "Meta is proposing question types on this device. Your current form is unchanged." : "Meta is proposing an answer on this device. Nothing is confirmed yet." });
  let raw = "", tokens: LocalReceipt["tokens"], assembledFields: unknown;
  const calls: LocalCall[] = [];
  const receipt = (accepted: boolean, error?: string): LocalReceipt => ({ at, model: model.name, revision: model.revision, quantization:model.quantization, contract: args.task === "extract" ? "source-line-types-v3" : "grounded-answer-v2", task: args.task, input: args.task === "extract" ? { source: args.text } : { field: args.field, utterance: args.text }, request, raw, ...(args.task === "extract" ? {rawFormat: "Newline-joined model responses. Each exact original response is preserved separately in calls; assembledFields is application-derived.", calls, assembledFields} : {}), elapsedMs: Math.round(performance.now() - started), tokens, accepted, ...(error ? { error } : {}) });
  try {
    let data: FormDefinition | ReturnType<typeof parseLocalAnswer>;
    if ("requests" in request) {
      const result = await executeLocalExtraction(request, async (step, sourceId) => {
        const callStarted = performance.now();
        const result = await runtime.complete({ messages: step.messages, response_format: { type: "json_schema", json_schema: { name: "question_type", schema: step.schema, strict: true } }, temperature: 0, seed: 42, max_tokens: 24 }, signal);
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
      const result = await runtime.complete({ messages: request.messages, response_format: { type: "json_schema", json_schema: { name: "proposed_answer", schema: request.schema, strict: true } }, temperature: 0, seed: 42, max_tokens: 220 }, signal);
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
  } finally { clearTimeout(timer); if(controller === taskController) { controller = null; update({ phase: engine?.isModelLoaded() ? "ready" : "idle" }); } }
}
