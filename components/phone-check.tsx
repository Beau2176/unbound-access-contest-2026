"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download, Mic, Pause, Volume2 } from "lucide-react";
import { useSpeech } from "../hooks/use-speech";
import { heardPhoneTestPhrase, phoneCheckSession } from "../lib/phone-check";
import { prepareReviewDownload } from "../lib/pdf";
type Result = "Not checked" | "Passed" | "Needs attention";
export default function PhoneCheck() {
  const [audio, setAudio] = useState<Result>("Not checked"), [microphone, setMicrophone] = useState<Result>("Not checked"), [savedPdf, setSavedPdf] = useState<Result>("Not checked");
  const [heard, setHeard] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [played, setPlayed] = useState(false), [saveChosen, setSaveChosen] = useState(false);
  const [file, setFile] = useState<{ url: string; name: string } | null>(null);
  const voice = useSpeech(text => { setHeard(text); setMicrophone(heardPhoneTestPhrase(text) ? "Passed" : "Needs attention"); }, setMessage);
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);
  async function preparePdf() {
    voice.stop(); setBusy(true); setMessage(""); setSavedPdf("Not checked"); setSaveChosen(false);
    try { const result = await prepareReviewDownload(phoneCheckSession(), true); setFile({ url: URL.createObjectURL(result.blob), name: "UNBOUND_Access_Phone_Check.pdf" }); setMessage("Your sample PDF is ready. Tap Save test PDF, then open that saved file from your phone's Downloads."); }
    catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  const passed = audio === "Passed" && microphone === "Passed" && savedPdf === "Passed";
  const report = `UNBOUND Access phone check\nRead-aloud: ${audio} (confirmed by the person testing)\nMicrophone phrase: ${microphone}\nSaved PDF: ${savedPdf} (confirmed by the person testing)\nLive Meta AI is a separate check. No real paperwork answers were used.`;
  return <div className="app-shell"><header className="topbar"><a className="brand" href="/">UNBOUND Access</a><a className="text-button" href="/"><ArrowLeft size={17}/> Back to paperwork</a></header>
    <main className="workspace phone-check"><p className="eyebrow">THREE SMALL CHECKS</p><h1>Try it on your phone.</h1><p className="lead">Check sound, say two words, and save one sample PDF. Your current paperwork answers stay untouched.</p><p className="microcopy">Use Chrome on your phone for this check. Microphone audio may be processed by your browser's speech service. The test uses fictional words and answers; no AI model is called.</p>
      <section className="phone-check-card" aria-labelledby="audio-heading"><span className="sample-tag">1 of 3 · {audio}</span><h2 id="audio-heading">Hear the words.</h2><p>Turn up your media volume. Tap Play, then confirm whether you heard “Your phone can read this question aloud.”</p>
        <div className="proposal-actions"><button className="primary" disabled={!voice.canRead || busy} onClick={() => { setPlayed(true); setAudio("Not checked"); voice.say("Your phone can read this question aloud."); }}><Volume2 size={19}/> Play test words</button><button className="secondary" disabled={!played} onClick={() => { voice.stop(); setAudio("Passed"); }}><Check size={19}/> I heard it</button><button className="text-button" disabled={!played} onClick={() => { voice.stop(); setAudio("Needs attention"); }}>I could not hear it</button></div>{!voice.canRead && <p>Read-aloud is unavailable in this browser.</p>}
      </section>
      <section className="phone-check-card" aria-labelledby="mic-heading"><span className="sample-tag">2 of 3 · {microphone}</span><h2 id="mic-heading">Say “blue bicycle.”</h2><p>Tap Test microphone, allow microphone access if your phone asks, then say <b>blue bicycle</b>. The words it recognizes appear here.</p>
        <button className="primary" disabled={!voice.available || voice.speaking || busy} onClick={() => { voice.stop(); setHeard(""); setMicrophone("Not checked"); voice.listen(); }}><Mic size={19}/> {voice.listening ? "Listening…" : "Test microphone"}</button>
        {heard && <p role="status">Heard: <b>{heard}</b>. {microphone === "Passed" ? "The phrase matched." : "Try the two test words again."}</p>}{!voice.available && <p>Voice recognition is unavailable here. Open this page in Chrome rather than an embedded app browser.</p>}
      </section>
      <section className="phone-check-card" aria-labelledby="pdf-heading"><span className="sample-tag">3 of 3 · {savedPdf}</span><h2 id="pdf-heading">Save and open the sample.</h2><p>Make the sample, save it, then open the saved file from Downloads. It should say <b>REVIEWED ANSWER RECORD</b>, show <b>Alex Example</b>, repeat <b>10 Example Road</b> for the applicant, and keep <b>90 Venue Lane</b> for the landlord.</p>
        <button className="primary" disabled={busy} onClick={() => void preparePdf()}><Download size={19}/> {busy ? "Preparing sample…" : "Make sample PDF"}</button>
        {file && <><div className="proposal-actions"><a className="primary" href={file.url} download={file.name} onClick={() => { setSaveChosen(true); setSavedPdf("Not checked"); }}>Save test PDF</a><a className="secondary" href={file.url} target="_blank" rel="noopener">Open test PDF</a></div><div className="proposal-actions"><button className="secondary" disabled={!saveChosen} onClick={() => setSavedPdf("Passed")}><Check size={19}/> I opened the saved file; the values match</button><button className="text-button" onClick={() => setSavedPdf("Needs attention")}>The saved file did not open or match</button></div></>}
      </section>
      {(voice.listening || voice.speaking) && <button className="secondary" onClick={voice.stop}><Pause size={18}/> Stop audio or microphone</button>}
      <p role="status" aria-live="polite">{message}</p><section className="phone-check-card"><h2>{passed ? "Your three checks passed." : "Your results so far"}</h2><pre className="phone-check-report">{report}</pre><p>{passed ? "You can return to our chat and say: phone check passed." : "Tell me which check needs attention, and I can help with that step."}</p><button className="secondary" onClick={async () => { try { await navigator.clipboard.writeText(report); setMessage("Results copied. You can paste them into our chat."); } catch { setMessage("Copying was unavailable. You can tell me the three results shown above."); } }}>Copy results</button></section>
    </main></div>;
}
