"use client";
import { useEffect, useRef, useState } from "react";
import { SpeechController } from "../lib/speech-controller";
import type { Recognition, SpeechState, Utterance } from "../lib/speech-controller";
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
export function useSpeech(onTranscript: (text: string) => void, onMessage: (text: string) => void) {
  const [state, setState] = useState<SpeechState>({ available: false, canRead: false, listening: false, speaking: false, guided: false });
  const controller = useRef<SpeechController | null>(null), handler = useRef(onTranscript), message = useRef(onMessage);
  handler.current = onTranscript; message.current = onMessage;
  useEffect(() => {
    const Speech = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
    const canRead = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    const speech = new SpeechController({
      createRecognition: Speech ? () => new Speech() : undefined,
      createUtterance: canRead ? text => {
        const utterance = new SpeechSynthesisUtterance(text); utterance.rate = .86; utterance.lang = "en-US";
        const voice = window.speechSynthesis.getVoices().find(v => v.lang === "en-US"); if (voice) utterance.voice = voice;
        return utterance as unknown as Utterance;
      } : undefined,
      speak: canRead ? utterance => window.speechSynthesis.speak(utterance as unknown as SpeechSynthesisUtterance) : undefined,
      cancelSpeech: canRead ? () => window.speechSynthesis.cancel() : undefined,
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancelTimer: timer => window.clearTimeout(timer as number),
    }, text => handler.current(text), text => message.current(text), setState);
    controller.current = speech;
    return () => { speech.dispose(); controller.current = null; };
  }, []);
  return { ...state, listen: () => controller.current?.listen(), say: (text: string) => controller.current?.say(text),
    stop: () => controller.current?.stop(), startGuide: (text: string) => controller.current?.startGuide(text),
    setBusy: (value: boolean) => controller.current?.setBusy(value) };
}
