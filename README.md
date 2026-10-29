# UNBOUND Access - Paperwork by Voice

One question at a time: spoken or typed answers, explicit confirmation, isolated shared-fact corrections and a readable PDF answer record.

[Open the app](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site) · [Judge walkthrough](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/contest) · [Live Meta checks](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/local-meta)

## Current result - October 29, 2026

The existing Indie Developer / Build for Your World entry was confirmed submitted October 28. This is the same project, with subsequent improvements. The five revised narrative fields in docs/SUBMISSION_DRAFT.md were saved to that same entry and verified after a fresh page load. Track, theme, participant and the previously checked permission were retained; no duplicate was created. The commercial Founders Beta is separate. No card, subscription, API key, top-up or paid inference was used.

**The smaller model now matches all ten question types on the unchanged repair-visit development case.** The revised pipeline uses ten classification calls plus two independent count-or-dollars model decisions. Final types are reconstructed from those twelve raw responses, not repaired with expected answers. The actual run took 37,766 ms and passed source validation. A separately frozen nine-question garden case matched eight types; its email error was rejected. This is development evidence, not general accuracy or a held-out benchmark. See [all repairs, raw attempts and independent scores](docs/evidence/model-repair/README.md).

The app now defaults to 1B for question proposals. A separate **Review source wording without AI** option builds a reviewable proposal only when every answer type is explicit. It retains a distinct source-rule provenance and is never counted as model accuracy. Unknown types, conditions and numeric limits stop that route. The original 3B Q4 option is retained on the diagnostic page; normal model choices are 1B and experimental compact 3B. The compact 3B workaround also matched all ten final types after twelve calls, taking 419,606 ms on this CPU. Its first answer took 179,218 ms, close to its bounded three-minute limit, so 1B remains the default. These measured successes do not establish reliability on every device.

**Real Meta extraction now has a working browser example.** Meta Llama 3.2 3B Instruct correctly proposed all eight expected question types for the authored bicycle-repair development form in 162,825 ms on CPU. The same per-question contract with 1B matched two of eight and was rejected. This is one development case, not a held-out accuracy benchmark or phone-performance result. Exact source wording, required flags, pages and narrowly matched repeated labels are application-derived; they are not credited as model outputs.

A real typed browser journey approved the 3B-proposed form, confirmed seven distinct facts across eight source rows, used a separate real 3B call to interpret “zero dollars” as 0 (95,032 ms), corrected both home-address rows from 100 to 101 Practice Street while preserving 900 Separate Venue Road, and downloaded the reviewed one-page PDF. The actual downloaded bytes were reopened, checked against all expected values, rendered and visually inspected. See [raw receipts, failed attempts and PDF evidence](docs/evidence/local-meta/README.md).

## Working features

- Two original fictional prepared forms, large controls, browser read-aloud and speech input, with typed alternatives.
- [Community Equipment Loan](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/equipment-loan) opens the second prepared form directly. Its answers use a separate tab-storage key, so starting or clearing this workspace preserves answers in the main workspace. Refresh restores the current equipment workspace; Clear session starts it again with a blank equipment form.
- Read-aloud defaults to normal speed and favors voices named Natural, Neural, Enhanced or Premium, then Google English when offered. Reading voice & speed provides a voice picker, four speeds and a microphone-free preview shared by questions, reviews and the phone check. Choices are remembered separately from answers; availability and subjective sound quality depend on the device.
- Every proposed answer or correction requires confirmation. Ambiguous correction targets ask for clarification. Applicant and another person's addresses remain separate.
- Detected uncertain answers such as “I am not sure” now ask a field-specific clarification before any optional AI request. Saved answers stay unchanged, and the person can give a definite answer or skip. Standalone unknown answers are caught for text fields without discarding descriptive text such as “I do not know how to apply and need help.” Raw Meta diagnostics still expose model failures separately.
- Required and conditional questions, numeric/date/email checks, contradiction detection, stale-change protection, source quotes/pages and answer history.
- Email dictation converts explicit spoken separators such as “alex at example dot com” and “alex A-T example dot com” to alex@example.com for confirmation. It also handles phone keyboard dictation. Email conversion uses application rules without a model request; ambiguous addresses still need correction.
- In-tab recovery, explicit clear session, final review and reviewed/incomplete PDF records with persistent Save/Open links. PDFs are answer records, not filled agency originals.
- Optional local Meta answer interpretation. Experimental question proposals default to 1B, with bounded per-line classification and independent numeric-unit decisions, with visible progress, source/type checks and source review before form replacement.
- Exportable receipts preserve each exact model response and request separately from the application's assembled field map. Structural acceptance is not an accuracy score.
- An isolated phone-check page and a preserved Muse Glimmer playground attempt with a separately reviewed eight-edit derivative. Loading the captured example makes no new model call; arbitrary manual imports retain unverified provider provenance.

## Model choices and costs

Built with Llama. Optional models use pinned GGUF artifacts and wllama 3.8.1. No weights are committed or included in the source ZIP.

- 1B Q4_K_M: 808 MB; default for experimental question proposals and optional answer interpretation. The original v3 repair-visit run matched two of ten. The revised v8 pipeline matched ten of ten final question types after twelve live calls. A second authored case matched eight of nine and was rejected. Earlier uncertain-answer guesses remain preserved and guarded.
- 3B Q4_K_M: 2.02 GB; retained for loading diagnostics. It succeeded on the earlier bicycle case but still interrupted loading in this repair pass. Its root cause is not established.
- 3B IQ3_M: 1.60 GB; separately selected compact artifact and consent. Native CPU inference returned a short health response in 36.5 seconds; that is not source-extraction success. The revised native, four-thread, batch-256 path completed the original ten-question source in 419.6 seconds, matching all ten final types after twelve calls. Its first answer was close to the deadline; it remains optional and slow. Earlier failures are preserved. No claim of equal quantization quality or verified GPU operation is made.

Changing size resets consent. Preferred storage streams to origin-private files. Modern browsers use native JSPI; compatibility is selected by the library when needed. Cross-origin isolation and a bundled outer worker enabled four actual CPU threads in this browser. Cancel, deadlines, reload-surviving diagnostics and the origin-wide model guard remain in place. A new task's system prompt receives its own bounded first-response budget, so a short health check does not consume it. Prepared forms and explicit source-wording review need no model download. See [repair evidence](docs/evidence/model-repair/README.md) and [historical loading failures](docs/evidence/model-loading/README.md).

Hosted NVIDIA/OpenRouter adapters remain optional, server-only and unconfigured. The old OpenRouter free route is absent. No paid fallback exists. Do not revisit blocked NVIDIA key/clipboard controls or paste credentials into chat/source.

## Run and verify

The two-page repair-visit PDF, its original extracted text and frozen expectations remain unchanged. Earlier manual-import/PDF evidence is preserved. The revised 1B pipeline now matches its ten expected final types, with exact raw kind and numeric-unit responses retained. Source labels, pages, required flags and repeated-label links are application-derived, not model outputs. A second source exposed an email error and was rejected; the source-wording alternative correctly presented its nine types in actual UI with a No AI call label. A fresh main-app 1B run was approved, filled with nine fictional facts across ten rows, corrected, restored after refresh and exported to a real reviewed two-page PDF. Both rendered pages were visually checked. This was typed browser QA, not a phone or voice result. See [original source and manual workflow](docs/evidence/fresh-repair-visit/README.md) and [current model repair results](docs/evidence/model-repair/README.md).

Node 24 recommended, pnpm pinned in packageManager:

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm build
pnpm dev
```

The build copies WASM assets from pinned npm packages. In the managed environment use `sites-preview start <checkout>`; actual inference requires HTTPS. There are **152 passing automated checks**, using deterministic fixtures/stubs for model and speech behavior. Real inference evidence is recorded separately. TypeScript and production packaging are checked separately.

## Data, boundaries and remaining work

Fictional data only. Answers/history use sessionStorage in this tab. Receipts remain in page memory until explicitly downloaded. Local model tasks process text in this browser; browser speech may use a remote service. Hosted AI, if separately configured and chosen, sends selected fictional text to its named provider. See [data disclosures](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/privacy).

Text PDFs: up to 5 MB, 10 pages and 16,000 characters. Experimental local AI: short sources up to 4,000 characters and 30 nonempty lines, one question per line. Detected conditions/numeric limits and explicit source/type conflicts are rejected. Use prepared forms or a fully reviewed manual proposal for those features. Human review remains essential. No OCR, signatures, payments, eligibility decisions, agency integrations or automatic submissions.

One tester earlier reported basic Android audio, microphone and opening a saved sample PDF. The tester subsequently reported completing the phone review; screenshots showed confirmed answers, linked-address consistency, final acknowledgement and prepared PDF links. Email dictation required a manual @ correction. That reported defect now has deterministic regression coverage and browser UI checks with fictional transcripts; a phone retest of the fix remains pending. This does not establish a fully hands-free session, timed usability improvement, GPU performance or arbitrary-form generalization. Personal screenshots and their values are excluded from public materials.

The tester subsequently reported that the first test was perfect but criticized the read-aloud voice. The voice-selection update replaces the previous first-US-voice selection and forced 0.86 speed with the controls above. Eight new deterministic checks and browser UI checks cover selection rules, saved preferences, preview isolation and retained answers. This browser exposed no English voice choices and playback returned a recoverable error; no new natural-sounding phone playback is claimed. A brief phone listening retest remains pending. See [reading-voice checks](docs/evidence/reading-voice-check.json).

A later phone screenshot showed PDF generation failing to fetch the dynamically imported PDF engine. The engine now loads with the app instead of waiting until export; recoverable errors use plain-language guidance and a guarded reload keeps confirmed answers in the same tab. The tester subsequently reported a successful phone download retry. No new agent-captured phone file or separate reopening verification is claimed. See [PDF recovery check](docs/evidence/pdf-download-recovery-check.json).

The reliability pass preserves current answers while bounding recent correction history, restores legacy sessions within a one-million-character input limit, flags contradictory imported follow-ups and rejects cyclic/unreachable conditions. A real UI session survived sixty long confirmed corrections and reload. Reviewed export stayed blocked until a conflicting follow-up was explicitly cleared. Browser speech-constructor failures have recoverable paths; voice pauses when the tab is hidden. These checks do not establish recovery after tab closure, cleared storage or actual phone speech failure. See [hardening evidence](docs/evidence/reliability-hardening-check.json).

The updated 2:50 edited demo shows the preserved 3B result, earlier 1B failure, a labelled saved-schema replay through current app controls, and the actual one-page PDF downloaded in the earlier 3B workflow. It uses generic offline synthetic narration at native speed, with no new model call or paid generation. It is not continuous voice capture. Caption intervals follow measured synthesized phrases; independent listening and speech-recognition review were unavailable. See [video project](demo/README.md) and [encode checks](docs/evidence/video-v2-qa.json). Source ZIP excludes weights, secrets, dependencies and generated build output. Original code is MIT; Llama/dependencies retain their licenses in THIRD_PARTY_NOTICES.md.

The original event entry remains the only entry. Deadline last verified: November 4, 2026, 7 p.m. America/Denver. Meta open-weight use does not imply organizer eligibility approval; the named Muse-only bonus is not claimed.

Product direction and acceptance testing: Boyd Koehler, UNBOUND FORGEWORKS LLC. AI-assisted implementation: OpenAI coding assistant. Project-specific work began during the event window.
