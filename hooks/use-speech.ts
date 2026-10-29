"use client";
import { useEffect, useRef, useState } from "react";
import { SpeechController } from "../lib/speech-controller";
import type { Recognition, SpeechState, Utterance } from "../lib/speech-controller";
import { chooseReadingVoice, DEFAULT_READING_PREFERENCES, englishReadingVoices, loadReadingPreferences, readingVoiceId, READING_RATES, saveReadingPreferences } from "../lib/reading-voice";
import type { ReadingPreferences, ReadingVoice } from "../lib/reading-voice";
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
export function useSpeech(onTranscript: (text: string) => void, onMessage: (text: string) => void) {
  const [state, setState] = useState<SpeechState>({ available: false, canRead: false, listening: false, speaking: false, guided: false });
  const controller = useRef<SpeechController | null>(null), handler = useRef(onTranscript), message = useRef(onMessage);
  const [voices, setVoices] = useState<ReadingVoice[]>([]);
  const [preferences, setPreferences] = useState<ReadingPreferences>({ ...DEFAULT_READING_PREFERENCES });
  const reading = useRef<ReadingPreferences>({ ...DEFAULT_READING_PREFERENCES });
  const browserVoices = useRef<SpeechSynthesisVoice[]>([]);
  handler.current = onTranscript; message.current = onMessage;
  useEffect(() => {
    const Speech = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
    const canRead = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    try { reading.current = loadReadingPreferences(window.localStorage); } catch { /* Storage access itself may be denied. */ }
    setPreferences(reading.current);
    const refreshVoices = () => {
      try { browserVoices.current = window.speechSynthesis.getVoices(); }
      catch { browserVoices.current = []; }
      setVoices(englishReadingVoices(browserVoices.current).map(({name, lang, voiceURI, default: isDefault, localService}) => ({ name, lang, voiceURI, default: isDefault, localService })));
    };
    if (canRead) { refreshVoices(); window.speechSynthesis.addEventListener("voiceschanged", refreshVoices); }
    const speech = new SpeechController({
      createRecognition: Speech ? () => new Speech() : undefined,
      createUtterance: canRead ? text => {
        const utterance = new SpeechSynthesisUtterance(text);
        // Query again at playback: some phones populate their voices after mount.
        try { browserVoices.current = window.speechSynthesis.getVoices(); } catch { /* Keep the last usable list. */ }
        const voice = chooseReadingVoice(browserVoices.current, reading.current.voiceId);
        utterance.rate = reading.current.rate; utterance.pitch = 1; utterance.volume = 1;
        utterance.lang = voice?.lang.replaceAll("_", "-") ?? "en-US";
        if (voice) utterance.voice = voice;
        return utterance as unknown as Utterance;
      } : undefined,
      speak: canRead ? utterance => window.speechSynthesis.speak(utterance as unknown as SpeechSynthesisUtterance) : undefined,
      cancelSpeech: canRead ? () => window.speechSynthesis.cancel() : undefined,
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancelTimer: timer => window.clearTimeout(timer as number),
    }, text => handler.current(text), text => message.current(text), setState);
    controller.current = speech;
    const pauseWhenHidden=()=>{if(document.hidden)speech.stop();};
    document.addEventListener("visibilitychange",pauseWhenHidden);
    return () => { document.removeEventListener("visibilitychange",pauseWhenHidden);if(canRead)window.speechSynthesis.removeEventListener("voiceschanged",refreshVoices);speech.dispose(); controller.current = null; };
  }, []);
  function updateReading(next: ReadingPreferences) {
    controller.current?.stop(); reading.current = next; setPreferences(next);
    let saved = false;
    try { saved = saveReadingPreferences(window.localStorage, next); } catch { /* In-memory choice still works. */ }
    message.current(saved ? "Reading voice updated. Preview it below, then resume when ready. Your answers are unchanged." : "Reading voice updated for this page. This browser could not remember it. Your answers are unchanged.");
  }
  const selectedVoice = chooseReadingVoice(voices, preferences.voiceId);
  return { ...state, listen: () => controller.current?.listen(), say: (text: string) => controller.current?.say(text),
    stop: () => controller.current?.stop(), startGuide: (text: string) => controller.current?.startGuide(text),
    setBusy: (value: boolean) => controller.current?.setBusy(value),
    voices, preferences, selectedVoice,
    setReadingVoice: (voiceId: string) => { if (!voiceId || voices.some(voice => readingVoiceId(voice) === voiceId)) updateReading({ ...reading.current, voiceId }); },
    setReadingRate: (rate: number) => { if (READING_RATES.some(option => option === rate)) updateReading({ ...reading.current, rate }); },
    previewReadingVoice: () => { controller.current?.stop(); controller.current?.say("Hi. Let’s take this one question at a time. You can change my voice or reading speed whenever you like."); },
  };
}
