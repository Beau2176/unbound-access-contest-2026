import type { ModelLoaded, ModelProgress } from "./local-model-runtime.ts";
export type LoadEvent = { elapsedMs: number } & ModelProgress;
export type LocalLoadReport = { at: string; model: string; revision: string; quantization?: string; outcome: "ready" | "cancelled" | "error" | "interrupted"; elapsedMs: number; events: LoadEvent[]; storage?: string; params?: ModelLoaded["params"]; error?: string };
const MAX_EVENTS = 160, FIRST_EVENTS = 20;
export function boundLoadEvents(events: LoadEvent[]): LoadEvent[] {
  return events.length <= MAX_EVENTS ? [...events] : [...events.slice(0,FIRST_EVENTS),...events.slice(-(MAX_EVENTS-FIRST_EVENTS))];
}
export function recoverLoadReports(raw: string | null): LocalLoadReport[] {
  if (!raw || raw.length > 1000000) return [];
  try {
    const reports:unknown=JSON.parse(raw);
    if (!Array.isArray(reports)) return [];
    return reports.slice(-8).filter((item):item is LocalLoadReport => {
      if (!item || typeof item.at !== "string" || typeof item.model !== "string" || typeof item.revision !== "string" || !Number.isFinite(item.elapsedMs) || !["ready","cancelled","error","interrupted"].includes(item.outcome) || !Array.isArray(item.events) || item.events.length > 10000) return false;
      return item.events.every((event:LoadEvent)=>event && Number.isFinite(event.elapsedMs) && ["checking","downloading","loading"].includes(event.stage) && (event.detail===undefined||typeof event.detail==="string") && (event.progress===undefined||Number.isFinite(event.progress)));
    }).map(item=>({...item,events:boundLoadEvents(item.events)}));
  } catch { return []; }
}
