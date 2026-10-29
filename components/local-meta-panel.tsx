"use client";
import { useState } from "react";
import { useLocalMeta } from "../hooks/use-local-meta";
import { loadLocalMeta, cancelLocalMeta, unloadLocalMeta, downloadLocalMetaReceipts } from "../lib/local-meta-client";
import { LOCAL_META_MODELS } from "../lib/local-meta-policy";
import type { LocalModelKey } from "../lib/local-meta-policy";
export default function LocalMetaPanel({ onBusy, defaultModel = "small" }: { onBusy?: (busy: boolean) => void; defaultModel?: LocalModelKey }) {
  const state = useLocalMeta(), [consent, setConsent] = useState(false), [error, setError] = useState(""), [preferGpu,setPreferGpu] = useState(true);
  const [modelKey,setModelKey]=useState<LocalModelKey>(defaultModel), selected=LOCAL_META_MODELS[state.phase==="ready"||state.phase==="running" ? state.modelKey??modelKey : modelKey];
  const working = ["downloading", "loading", "running"].includes(state.phase);
  async function load() { setError(""); onBusy?.(true); try { await loadLocalMeta(consent, preferGpu, modelKey); } catch (e) { setError((e as Error).message); } finally { onBusy?.(false); } }
  async function off(remove = false) { setError(""); onBusy?.(true); try { await unloadLocalMeta(remove); } catch { setError("The saved model files could not be removed. Your confirmed answers are unchanged."); } finally { onBusy?.(false); } }
  return <section className="local-meta-panel" aria-label="Optional on-device Meta AI">
    <h3>Experimental AI, on this device</h3>
    <p>Meta Llama 3.2 proposes questions and interprets fictional answers in your browser. Your form text is processed on this device. Browser voice may still use its own online speech service.</p>
    <p><b>Selected model: {selected.name}. First download: {selected.downloadLabel}, plus the AI runtime.</b> Use Wi-Fi if you have limited mobile data. It needs free storage and memory, can be slow on phones, and may not work on every device. No API account or payment is required. Practice forms work without downloading it.</p>
    {!["ready","running"].includes(state.phase)&&<label className="source-input-label">Model size <select aria-label="Model size" value={modelKey} disabled={working} onChange={e=>{setModelKey(e.target.value as LocalModelKey);setConsent(false);}}><option value="small">1B · 808 MB · answer experiments</option><option value="large">3B Q4 · 2.02 GB · needs more memory</option><option value="compact">3B compact IQ3 · 1.60 GB · experimental question proposals</option></select></label>}
    {!["ready", "running"].includes(state.phase) && <label className="consent"><input type="checkbox" checked={consent} disabled={working} onChange={e => setConsent(e.target.checked)} /><span>I want the optional model download from Hugging Face. Its files can remain cached in this browser until I remove them.</span></label>}
    {!["ready","running"].includes(state.phase)&&<label className="consent"><input type="checkbox" checked={preferGpu} disabled={working} onChange={e=>setPreferGpu(e.target.checked)}/><span>Use device graphics for AI acceleration when available. If loading fails, turn this off to try the slower CPU path.</span></label>}
    <p role="status">{state.message}</p>
    {working && (state.phase==="running" ? <progress aria-label="AI is working"/> : <progress aria-label="Model download" value={state.progress} max={100} />)}
    {error && <p role="alert">{error}</p>}
    <div className="proposal-actions">
      {!["ready", "running"].includes(state.phase) && <button className="primary" disabled={!consent || working} onClick={() => void load()}>Download and load Meta model</button>}
      {working && <button className="secondary" onClick={cancelLocalMeta}>Cancel AI task</button>}
      {state.phase === "ready" && <button className="secondary" onClick={() => void off()}>Turn off on-device AI</button>}
      {!working&&state.modelKey&&<button className="text-button" onClick={() => void off(true)}>Remove downloaded model files</button>}
      {(state.receipts.length > 0 || state.loads.length > 0) && <button className="secondary" disabled={working} onClick={downloadLocalMetaReceipts}>{state.receipts.length > 0 ? "Download AI run receipts" : "Download loading report"}</button>}
    </div>
    {state.receipts.length > 0 && <p className="microcopy">Receipts include the exact fictional input, model request, raw response, timing and validation result. Save them before reloading or leaving this page.</p>}
    <p className="microcopy"><a href="/privacy">Data &amp; privacy</a> · Built with Llama · <a href="/artifacts/LLAMA-3.2-LICENSE.txt" target="_blank" rel="noopener">Model license</a> · <a href="/local-meta">Try a live AI check and inspect its receipt</a></p>
  </section>;
}
