import test from "node:test";
import assert from "node:assert/strict";
import { SpeechController } from "../lib/speech-controller.ts";
import type { Recognition, SpeechState, Utterance } from "../lib/speech-controller.ts";

function harness(options: { microphone?: boolean; audio?: boolean; startFails?: boolean; recognitionFails?: boolean; utteranceFails?: boolean; cancelFails?: boolean } = {}) {
  const recognitions: Recognition[] = [], utterances: (Utterance & { text: string })[] = [], messages: string[] = [], transcripts: string[] = [];
  const timers = new Map<number, () => void>(); let nextTimer = 0;
  let state: SpeechState = { available: false, canRead: false, listening: false, speaking: false, guided: false };
  const speech = new SpeechController({
    createRecognition: options.microphone === false ? undefined : () => {
      if(options.recognitionFails)throw new Error("Speech constructor unavailable");
      const recognition: Recognition = { lang: "", continuous: false, interimResults: false, onresult: null, onerror: null, onend: null,
        start() { if (options.startFails) throw new Error("Unavailable"); }, abort() {} };
      recognitions.push(recognition); return recognition;
    },
    createUtterance: options.audio === false ? undefined : text => { if(options.utteranceFails)throw new Error("Audio constructor unavailable");const u = { text, onend: null, onerror: null }; utterances.push(u); return u; },
    speak: options.audio === false ? undefined : () => {}, cancelSpeech() {if(options.cancelFails)throw new Error("Speech cancellation unavailable");},
    schedule(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    cancelTimer(id) { timers.delete(id as number); },
  }, text => transcripts.push(text), text => messages.push(text), value => { state = value; });
  return { speech, recognitions, utterances, messages, transcripts, state: () => state,
    tick() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); },
    finish() { utterances.at(-1)?.onend?.(); },
    say(text: string) { recognitions.at(-1)?.onresult?.({ results: [[{ transcript: text }]] }); } };
}
test("guided speech reads first and then listens, without hearing its own prompt", () => {
  const h = harness(); h.speech.startGuide("Your full name"); h.tick(); assert.equal(h.recognitions.length, 0);
  h.finish(); h.tick(); assert.equal(h.state().listening, true); assert.equal(h.recognitions.length, 1);
});
test("one spoken result is delivered exactly once and the next listen is scheduled", () => {
  const h = harness(); h.speech.startGuide("Question"); h.finish(); h.tick();
  const late = h.recognitions[0].onresult!; h.say("Alex Example"); late({ results: [[{ transcript: "duplicate" }]] });
  assert.deepEqual(h.transcripts, ["Alex Example"]); h.tick(); assert.equal(h.recognitions.length, 2);
});
test("pausing cancels queued listening and ignores delayed speech events", () => {
  const h = harness(); h.speech.startGuide("Question"); const late = h.utterances[0].onend!;
  h.speech.stop(); late(); h.tick(); assert.equal(h.recognitions.length, 0); assert.equal(h.state().guided, false);
});
test("a cancelled older prompt cannot end or interrupt the replacement prompt", () => {
  const h = harness(); h.speech.startGuide("Old prompt"); const oldEnd = h.utterances[0].onend!;
  h.speech.say("Replacement"); oldEnd(); h.tick(); assert.equal(h.state().speaking, true); assert.equal(h.recognitions.length, 0);
  h.finish(); h.tick(); assert.equal(h.state().listening, true);
});
test("guided listening resumes after an asynchronous failure releases busy state", () => {
  const h = harness(); h.speech.startGuide("Question"); h.finish(); h.tick(); h.speech.setBusy(true);
  h.tick(); assert.equal(h.state().listening, false); h.speech.setBusy(false); h.tick(); assert.equal(h.state().listening, true);
});
test("finishing a spoken error while still busy waits for the request to finish", () => {
  const h = harness(); h.speech.startGuide("Question"); h.speech.setBusy(true); h.speech.say("The service is unavailable");
  h.finish(); h.tick(); assert.equal(h.recognitions.length, 0); h.speech.setBusy(false); h.tick(); assert.equal(h.recognitions.length, 1);
});
test("a denied microphone pauses safely instead of repeatedly asking for access", () => {
  const h = harness(); h.speech.startGuide("Question"); h.finish(); h.tick(); h.recognitions[0].onerror!({ error: "not-allowed" });
  h.tick(); assert.equal(h.state().guided, false); assert.equal(h.recognitions.length, 1); assert.match(h.messages.at(-1)!, /permission.*preserved/i);
});
test("silence is retried a bounded number of times without treating it as an answer", () => {
  const h = harness(); h.speech.startGuide("Question"); h.finish(); h.tick();
  for (let i = 0; i < 3; i++) { h.recognitions.at(-1)!.onerror!({ error: "no-speech" }); h.tick(); }
  assert.equal(h.state().guided, false); assert.equal(h.recognitions.length, 3); assert.deepEqual(h.transcripts, []);
});
test("a new answer resets the silence counter", () => {
  const h = harness(); h.speech.startGuide("Question"); h.finish(); h.tick();
  h.recognitions.at(-1)!.onerror!({ error: "no-speech" }); h.tick(); h.say("An answer"); h.tick();
  h.recognitions.at(-1)!.onerror!({ error: "no-speech" }); h.tick(); assert.equal(h.state().guided, true);
});
test("speech output errors resume the guided input path", () => {
  const h = harness(); h.speech.startGuide("Question"); h.utterances[0].onerror!(); h.tick(); assert.equal(h.state().listening, true);
});
test("unsupported speech leaves a usable typed and visible-text path", () => {
  const h = harness({ microphone: false, audio: false }); h.speech.startGuide("Question"); h.tick();
  assert.equal(h.state().available, false); assert.equal(h.state().guided, false); assert.match(h.messages.at(-1)!, /shown on screen/);
});
test("a microphone start exception produces a recoverable message", () => {
  const h = harness({ startFails: true }); h.speech.listen(); assert.equal(h.state().listening, false); assert.match(h.messages.at(-1)!, /preserved/);
});
test("unmounting prevents delayed browser callbacks restarting the microphone", () => {
  const h = harness(); h.speech.startGuide("Question"); const late = h.utterances[0].onend!; h.speech.dispose(); late(); h.tick();
  h.speech.listen(); assert.equal(h.recognitions.length, 0);
});
test("a microphone constructor failure pauses safely without throwing or retrying",()=>{
 const h=harness({recognitionFails:true});h.speech.startGuide("Question");h.finish();
 assert.doesNotThrow(()=>h.tick());assert.equal(h.state().listening,false);assert.equal(h.state().guided,false);
 assert.match(h.messages.at(-1)!,/preserved/);h.tick();assert.equal(h.recognitions.length,0);
});
test("an audio constructor failure releases speaking and leaves an explicit manual recovery",()=>{
 const h=harness({utteranceFails:true});assert.doesNotThrow(()=>h.speech.startGuide("Question"));
 assert.equal(h.state().speaking,false);assert.equal(h.state().guided,false);assert.match(h.messages.at(-1)!,/shown on screen/);
 h.tick();assert.equal(h.recognitions.length,0);assert.doesNotThrow(()=>h.speech.listen());assert.equal(h.state().listening,true);
});
test("a failing browser speech cancellation cannot trap the pause or dispose controls",()=>{
 const h=harness({cancelFails:true});assert.doesNotThrow(()=>h.speech.startGuide("Question"));
 assert.doesNotThrow(()=>h.speech.stop());assert.equal(h.state().guided,false);assert.equal(h.state().speaking,false);
 assert.doesNotThrow(()=>h.speech.dispose());h.tick();assert.equal(h.recognitions.length,0);
});
