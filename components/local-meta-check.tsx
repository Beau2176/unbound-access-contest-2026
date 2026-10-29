"use client";
import { useState } from "react";
import LocalMetaPanel from "./local-meta-panel";
import { useLocalMeta } from "../hooks/use-local-meta";
import { runLocalMeta, downloadLocalMetaReceipts } from "../lib/local-meta-client";
import type { LocalField } from "../lib/local-meta-policy";
export const CHECK_FORM = "Fictional seed exchange registration\nFull name (required)\nEmail address (optional)\nHow many seed packets? (required)\nWould you like a reminder? Yes or No (optional)";
const cases: { field: LocalField; utterance: string; expected: string; clarify: boolean }[] = [
  { field: { id: "people", label: "How many people are in your household?", kind: "number" }, utterance: "There are three of us in our household.", expected: "3", clarify: false },
  { field: { id: "amount", label: "Amount paid", kind: "money" }, utterance: "zero dollars", expected: "0", clarify: false },
  { field: { id: "support", label: "Do you need access support?", kind: "yesno" }, utterance: "No, I do not need access support.", expected: "No", clarify: false },
  { field: { id: "companions", label: "How many companions will attend?", kind: "number" }, utterance: "I am not sure how many people will come.", expected: "", clarify: true },
];
export default function LocalMetaCheck() {
  const state = useLocalMeta(), [running, setRunning] = useState(false), [results, setResults] = useState<string[]>([]), [source, setSource] = useState(CHECK_FORM), [output, setOutput] = useState("");
  const ready = state.phase === "ready" && !running;
  const canExtract = ready && state.modelKey === "large";
  async function checks() {
    setRunning(true); setResults([]);
    try {
      for (const test of cases) {
        try {
          const result = await runLocalMeta({ task: "answer", field: test.field, text: test.utterance });
          const pass = result.data.value === test.expected && result.data.needsClarification === test.clarify;
          setResults(old => [...old, `${pass ? "PASS" : "FAIL"}: ${test.field.label} — ${JSON.stringify(result.data)}`]);
        } catch (e) { const message=(e as Error).message; setResults(old => [...old, `${test.clarify && /uncertainty/.test(message) ? "GUARDED (raw model answer rejected)" : "ERROR"}: ${message}`]); if (/cancel/i.test(message)) break; }
      }
    } finally { setRunning(false); }
  }
  async function extract() {
    setRunning(true); setOutput("");
    try { const result = await runLocalMeta({ task: "extract", text: source }); setOutput(JSON.stringify(result.data, null, 2)); }
    catch (e) { setOutput((e as Error).message); }
    finally { setRunning(false); }
  }
  return <main className="local-meta-check">
    <a href="/">← Back to paperwork</a><h1>Inspect a real on-device AI run</h1>
    <p>These controls run the downloaded Meta model now. The expected results are used for scoring after inference; they are not sent in its prompt. This is a small development check, not an accuracy benchmark or a phone usability study.</p>
    <p>The paperwork app now asks for clarification before calling AI when it detects uncertainty. These raw model checks deliberately still send the uncertain example to Meta, then validate its response. Application clarification is not counted as a correct model answer.</p>
    <LocalMetaPanel />
    <section><h2>Interpret four fictional answers</h2><p>Checks: a household count, zero dollars, a No answer, and an uncertain count that needs clarification.</p><button className="primary" disabled={!ready} onClick={() => void checks()}>Run four live answer checks</button><ul aria-live="polite">{results.map((r, i) => <li key={i}>{r}</li>)}</ul></section>
    <section><h2>Propose source-linked questions</h2><p>Question proposals use the experimental 3B model. The smaller 1B model remains available for answer experiments; its question-type tests were unreliable. Proposals can take several minutes on a CPU.</p><label htmlFor="local-check-source">Short fictional form, one question per line</label><textarea id="local-check-source" rows={7} maxLength={4000} value={source} disabled={running} onChange={e => setSource(e.target.value)} /><button className="primary" disabled={!canExtract} onClick={() => void extract()}>Run live question proposal</button>{output && <pre data-testid="local-extraction-result">{output}</pre>}</section>
    <section><h2>Actual run receipts</h2><p>Elapsed time, input, unchanged raw model output and validation result. Stored only in this page’s memory. No automatic upload.</p><button className="secondary" disabled={!state.receipts.length || running} onClick={downloadLocalMetaReceipts}>Download run receipts</button><pre data-testid="local-meta-receipts">{JSON.stringify(state.receipts, null, 2)}</pre></section>
  </main>;
}
