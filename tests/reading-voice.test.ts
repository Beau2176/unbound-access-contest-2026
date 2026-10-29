import test from "node:test";
import assert from "node:assert/strict";
import { chooseReadingVoice, englishReadingVoices, loadReadingPreferences, parseReadingPreferences, readingVoiceId, saveReadingPreferences } from "../lib/reading-voice.ts";
import type { ReadingVoice } from "../lib/reading-voice.ts";

const voice = (name: string, lang = "en-US", extra: Partial<ReadingVoice> = {}): ReadingVoice => ({ name, lang, voiceURI: name, default: false, localService: true, ...extra });

test("automatic selection avoids the first basic US voice when a named natural voice is available", () => {
  const basic = voice("eSpeak English US", "en-US", { default: true });
  const natural = voice("Microsoft Aria Online (Natural)");
  assert.equal(chooseReadingVoice([basic, natural]), natural);
  assert.equal(chooseReadingVoice([natural, basic]), natural);
});

test("Google US English and Android network names are preferred to unnamed US options without treating all remote voices as higher quality", () => {
  const basic = voice("English United States", "en-US", { default: true, localService: false });
  const google = voice("Google US English");
  const android = voice("en-us-x-tpf-network");
  assert.equal(chooseReadingVoice([basic, google]), google);
  assert.equal(chooseReadingVoice([basic, android]), android);
  assert.equal(chooseReadingVoice([voice("English A", "en-US", {localService:false}), voice("English B", "en-US", {default:true})])?.name, "English B");
});

test("a person's explicit voice choice wins, survives a refreshed voice object and falls back safely if removed", () => {
  const chosen = voice("English United States"), natural = voice("Aria Natural");
  const preference = readingVoiceId(chosen);
  assert.equal(chooseReadingVoice([chosen, natural], preference), chosen);
  const refreshed = {...chosen};
  assert.equal(chooseReadingVoice([natural, refreshed], preference), refreshed);
  assert.equal(chooseReadingVoice([natural], preference), natural);
});

test("delayed voices can replace an empty default list without a stale first-voice selection", () => {
  assert.equal(chooseReadingVoice([]), undefined);
  const voices = [voice("English basic"), voice("Samantha (Enhanced)")];
  assert.equal(chooseReadingVoice(voices), voices[1]);
  assert.equal(chooseReadingVoice([...voices, voice("Ava Natural")])?.name, "Ava Natural");
});

test("English language variants are allowed, foreign voices excluded and repeated entries deduplicated", () => {
  const english = voice("English Neural", "en_GB");
  assert.deepEqual(englishReadingVoices([voice("French Natural", "fr-FR"), english, {...english}]), [english]);
  assert.equal(chooseReadingVoice([voice("French Natural", "fr-FR")]), undefined);
});

test("saved speed and voice restore without accepting malformed or excessive preferences", () => {
  const saved = {voiceId: readingVoiceId(voice("Samantha Enhanced")), rate: 0.9};
  let raw = "";
  assert.equal(saveReadingPreferences({setItem(_key, value) {raw = value;}}, saved), true);
  assert.deepEqual(loadReadingPreferences({getItem() {return raw;}}), saved);
  for (const raw of [null, "null", "[]", "broken", "x".repeat(4097)]) assert.deepEqual(parseReadingPreferences(raw), {voiceId:"", rate:1});
  assert.deepEqual(parseReadingPreferences(JSON.stringify({voiceId:42, rate:10, answers:"not a preference"})), {voiceId:"", rate:1});
});

test("unavailable browser storage leaves normal-speed reading usable and reports that persistence failed", () => {
  const storage = {getItem(): string | null {throw new Error("Denied");}, setItem() {throw new Error("Quota");}};
  assert.deepEqual(loadReadingPreferences(storage), {voiceId:"", rate:1});
  assert.equal(saveReadingPreferences(storage, {voiceId:"", rate:1}), false);
});
