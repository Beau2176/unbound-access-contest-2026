export type ReadingVoice = {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
  localService: boolean;
};
export type ReadingPreferences = { voiceId: string; rate: number };
export const READING_PREFERENCES_KEY = "unbound-access-reading-voice-v1";
export const READING_RATES = [0.8, 0.9, 1, 1.1] as const;
export const DEFAULT_READING_PREFERENCES: ReadingPreferences = { voiceId: "", rate: 1 };

const language = (voice: ReadingVoice) => voice.lang.replaceAll("_", "-").toLowerCase();
export const readingVoiceId = (voice: ReadingVoice) => JSON.stringify([voice.voiceURI, voice.name, voice.lang]);

// These are name-based preferences, not a measurement of sound quality.
// Do not infer quality from localService: a remote voice is not necessarily better.
function preference(voice: ReadingVoice) {
  let score = language(voice) === "en-us" ? 20 : 0;
  if (voice.default) score += 1;
  if (/natural|neural/i.test(voice.name)) score += 100;
  else if (/enhanced|premium/i.test(voice.name)) score += 80;
  else if (/google.*(?:us english|english.*united states)|en[-_]us[-_]x.*network/i.test(voice.name)) score += 60;
  else if (/google.*english/i.test(voice.name)) score += 40;
  if (/espeak|mbrola|flite|festival|compact/i.test(voice.name)) score -= 200;
  return score;
}

export function englishReadingVoices<T extends ReadingVoice>(voices: readonly T[]): T[] {
  const seen = new Set<string>();
  return voices.filter(voice => {
    const id = readingVoiceId(voice);
    if (!/^en(?:-|$)/.test(language(voice)) || seen.has(id)) return false;
    seen.add(id); return true;
  }).sort((a, b) => preference(b) - preference(a) || a.name.localeCompare(b.name) || readingVoiceId(a).localeCompare(readingVoiceId(b)));
}

export function chooseReadingVoice<T extends ReadingVoice>(voices: readonly T[], voiceId = ""): T | undefined {
  const english = englishReadingVoices(voices);
  return english.find(voice => readingVoiceId(voice) === voiceId) ?? english[0];
}

export function parseReadingPreferences(raw: string | null): ReadingPreferences {
  try {
    if (!raw || raw.length > 4096) return { ...DEFAULT_READING_PREFERENCES };
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ...DEFAULT_READING_PREFERENCES };
    return {
      voiceId: typeof value.voiceId === "string" && value.voiceId.length <= 2000 ? value.voiceId : "",
      rate: READING_RATES.some(rate => rate === value.rate) ? value.rate : 1,
    };
  } catch { return { ...DEFAULT_READING_PREFERENCES }; }
}

export function loadReadingPreferences(storage: Pick<Storage, "getItem">): ReadingPreferences {
  try { return parseReadingPreferences(storage.getItem(READING_PREFERENCES_KEY)); }
  catch { return { ...DEFAULT_READING_PREFERENCES }; }
}

export function saveReadingPreferences(storage: Pick<Storage, "setItem">, preferences: ReadingPreferences): boolean {
  try { storage.setItem(READING_PREFERENCES_KEY, JSON.stringify(preferences)); return true; }
  catch { return false; }
}
