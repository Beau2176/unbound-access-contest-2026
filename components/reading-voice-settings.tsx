"use client";
import { useId } from "react";
import { Pause, Volume2 } from "lucide-react";
import type { useSpeech } from "../hooks/use-speech";
import { readingVoiceId } from "../lib/reading-voice";

export default function ReadingVoiceSettings({ voice, disabled = false, expanded = false }: { voice: ReturnType<typeof useSpeech>; disabled?: boolean; expanded?: boolean }) {
  const id = useId();
  const missingChoice = !!voice.preferences.voiceId && !voice.voices.some(option => readingVoiceId(option) === voice.preferences.voiceId);
  return <details className="reading-settings" open={expanded || undefined}>
    <summary><Volume2 size={18}/> Reading voice &amp; speed</summary>
    <div className="reading-settings-body">
      <p>Automatic favors voices labeled Natural, Neural or Enhanced, then Google English when available. Preview a voice to hear which you prefer.</p>
      <div className="reading-controls">
        <label htmlFor={`${id}-voice`}>Reading voice
          <select id={`${id}-voice`} value={voice.preferences.voiceId} disabled={disabled || !voice.canRead} onChange={event => voice.setReadingVoice(event.target.value)}>
            <option value="">Automatic (recommended)</option>
            {missingChoice && <option value={voice.preferences.voiceId} disabled>Saved voice unavailable — using Automatic</option>}
            {voice.voices.map(option => <option key={readingVoiceId(option)} value={readingVoiceId(option)}>{option.name} · {option.lang}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-rate`}>Reading speed
          <select id={`${id}-rate`} value={voice.preferences.rate} disabled={disabled || !voice.canRead} onChange={event => voice.setReadingRate(Number(event.target.value))}>
            <option value={0.8}>Slower</option><option value={0.9}>A little slower</option><option value={1}>Normal</option><option value={1.1}>A little faster</option>
          </select>
        </label>
      </div>
      <p className="reading-current" role="status">{voice.selectedVoice ? `Current voice: ${voice.selectedVoice.name}` : "Using your browser’s default English voice. More choices may appear when your phone loads them."}</p>
      <div className="proposal-actions"><button className="secondary" disabled={disabled || !voice.canRead} onClick={voice.previewReadingVoice}><Volume2 size={18}/> Preview reading voice</button>{(voice.speaking || voice.listening || voice.guided) && <button className="secondary" disabled={disabled} onClick={voice.stop}><Pause size={18}/> Stop voice</button>}</div>
      <p className="microcopy">Available voices depend on your phone and browser. Some voices use your browser’s online speech service. Only your voice and speed choices are remembered here.</p>
    </div>
  </details>;
}
