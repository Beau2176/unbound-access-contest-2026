export type RecognitionResult = { results: { transcript: string }[][] };
export type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; abort(): void;
  onresult: ((event: RecognitionResult) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
export type Utterance = { onend: (() => void) | null; onerror: (() => void) | null };
export type SpeechState = { available: boolean; canRead: boolean; listening: boolean; speaking: boolean; guided: boolean };
export type SpeechRuntime = {
  createRecognition?: () => Recognition;
  createUtterance?: (text: string) => Utterance;
  speak?: (utterance: Utterance) => void;
  cancelSpeech?: () => void;
  schedule: (callback: () => void, delay: number) => unknown;
  cancelTimer: (timer: unknown) => void;
};

// Isolated speech lifecycles prevent delayed events restarting a paused mic.
export class SpeechController {
  private state: SpeechState;
  private recognition: Recognition | null = null;
  private speechRevision = 0;
  private timer: unknown;
  private busy = false;
  private disposed = false;
  private silenceCount = 0;
  private runtime: SpeechRuntime;
  private transcript: (text: string) => void;
  private message: (text: string) => void;
  private changed: (state: SpeechState) => void;
  constructor(runtime: SpeechRuntime, transcript: (text: string) => void,
    message: (text: string) => void, changed: (state: SpeechState) => void) {
    this.runtime = runtime; this.transcript = transcript; this.message = message; this.changed = changed;
    this.state = { available: !!runtime.createRecognition, canRead: !!runtime.speak && !!runtime.createUtterance,
      listening: false, speaking: false, guided: false };
    this.emit();
  }
  private emit() { this.changed({ ...this.state }); }
  private cancelSpeech() { try { this.runtime.cancelSpeech?.(); } catch { /* Local pause and teardown must still finish. */ } }
  private cancelTimer() { if (this.timer !== undefined) this.runtime.cancelTimer(this.timer); this.timer = undefined; }
  private abortRecognition() {
    const previous = this.recognition; this.recognition = null;
    if (previous) { previous.onresult = null; previous.onerror = null; previous.onend = null; try { previous.abort(); } catch {} }
    this.state.listening = false;
  }
  private queueListen(delay = 250) {
    this.cancelTimer();
    if (this.disposed || !this.state.guided || this.busy || this.state.speaking || this.recognition) return;
    this.timer = this.runtime.schedule(() => { this.timer = undefined; if (this.state.guided) this.listen(); }, delay);
  }
  listen() {
    if (this.disposed || !this.runtime.createRecognition || this.recognition || this.state.speaking || this.busy) return;
    this.cancelTimer();
    let recognition: Recognition;
    try { recognition = this.runtime.createRecognition(); }
    catch { this.stop();this.message("Voice input is not ready. Try Listen again, or use the answer box. Your answers are preserved.");return; }
    this.recognition = recognition;
    recognition.lang = "en-US"; recognition.continuous = false; recognition.interimResults = false;
    recognition.onresult = event => {
      if (this.recognition !== recognition || this.disposed) return;
      const text = event.results[0]?.[0]?.transcript?.trim();
      this.abortRecognition(); this.emit();
      if (text) { this.silenceCount = 0; this.transcript(text); }
      this.queueListen();
    };
    recognition.onerror = event => {
      if (this.recognition !== recognition || this.disposed) return;
      this.abortRecognition();
      if (event.error === "no-speech" && this.state.guided && ++this.silenceCount < 3) {
        this.message("I did not catch an answer. I will listen again. Your saved answers are unchanged.");
        this.emit(); this.queueListen(700); return;
      }
      this.stop();
      this.message(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone permission was not granted. Allow it in your browser, or use the answer box. Your answers are preserved."
        : event.error === "no-speech" ? "Voice mode paused after silence. Your answers are preserved. Use Start by voice when ready."
        : "Voice input stopped. Your answers are preserved. Try Listen again or use the answer box.");
    };
    recognition.onend = () => {
      if (this.recognition !== recognition || this.disposed) return;
      this.recognition = null; this.state.listening = false; this.emit(); this.queueListen(450);
    };
    try { recognition.start(); this.state.listening = true; this.emit();
      this.message("Listening. Say your answer, or say repeat, back, skip, change, review or stop.");
    } catch { this.stop(); this.message("Voice input is not ready. Try Listen again, or use the answer box. Your answers are preserved."); }
  }
  say(text: string) {
    if (this.disposed) return;
    this.cancelTimer(); this.abortRecognition();
    const revision = ++this.speechRevision;
    this.cancelSpeech();
    if (!this.state.canRead || !this.runtime.createUtterance || !this.runtime.speak) {
      this.state.speaking = false; this.emit();
      this.message("Read-aloud is unavailable here. The same text is shown on screen."); this.queueListen(); return;
    }
    this.state.speaking = true; this.emit();
    let utterance: Utterance;
    try { utterance = this.runtime.createUtterance(text); }
    catch { this.stop();this.message("Read-aloud could not start. The same text is shown on screen. Your answers are preserved; use Listen or the answer box when ready.");return; }
    const finished = () => {
      if (this.disposed || revision !== this.speechRevision) return;
      this.state.speaking = false; this.emit(); this.queueListen();
    };
    utterance.onend = finished;
    utterance.onerror = () => {
      if (revision === this.speechRevision && !this.disposed) this.message("Read-aloud stopped. Your answers are preserved; the text is shown on screen.");
      finished();
    };
    try { this.runtime.speak(utterance); } catch { utterance.onerror(); }
  }
  startGuide(text: string) {
    if (this.disposed) return;
    this.silenceCount = 0; this.state.guided = this.state.available; this.emit(); this.say(text);
  }
  setBusy(value: boolean) {
    if (this.disposed) return;
    this.busy = value;
    if (value) { this.cancelTimer(); this.abortRecognition(); this.emit(); }
    else this.queueListen();
  }
  stop() {
    this.cancelTimer(); ++this.speechRevision;
    this.state.guided = false; this.state.speaking = false;
    this.abortRecognition(); this.cancelSpeech(); this.emit();
  }
  dispose() { this.stop(); this.disposed = true; }
}
