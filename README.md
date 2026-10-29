# UNBOUND Access - Paperwork by Voice

One question at a time: spoken or typed answers, explicit confirmation, isolated shared-fact corrections and a readable PDF answer record.

[Open the app](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site) · [Judge walkthrough](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/contest) · [Live Meta checks](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/local-meta)

## Current result - October 29, 2026

The existing Indie Developer / Build for Your World entry was confirmed submitted October 28. This is the same project, with subsequent improvements. The five revised narrative fields in docs/SUBMISSION_DRAFT.md were saved to that same entry and verified after a fresh page load. Track, theme, participant and the previously checked permission were retained; no duplicate was created. The commercial Founders Beta is separate. No card, subscription, API key, top-up or paid inference was used.

**Real Meta extraction now has a working browser example.** Meta Llama 3.2 3B Instruct correctly proposed all eight expected question types for the authored bicycle-repair development form in 162,825 ms on CPU. The same per-question contract with 1B matched two of eight and was rejected. This is one development case, not a held-out accuracy benchmark or phone-performance result. Exact source wording, required flags, pages and narrowly matched repeated labels are application-derived; they are not credited as model outputs.

A real typed browser journey approved the 3B-proposed form, confirmed seven distinct facts across eight source rows, used a separate real 3B call to interpret “zero dollars” as 0 (95,032 ms), corrected both home-address rows from 100 to 101 Practice Street while preserving 900 Separate Venue Road, and downloaded the reviewed one-page PDF. The actual downloaded bytes were reopened, checked against all expected values, rendered and visually inspected. See [raw receipts, failed attempts and PDF evidence](docs/evidence/local-meta/README.md).

## Working features

- Two original fictional prepared forms, large controls, browser read-aloud and speech input, with typed alternatives.
- Read-aloud defaults to normal speed and favors voices named Natural, Neural, Enhanced or Premium, then Google English when offered. Reading voice & speed provides a voice picker, four speeds and a microphone-free preview shared by questions, reviews and the phone check. Choices are remembered separately from answers; availability and subjective sound quality depend on the device.
- Every proposed answer or correction requires confirmation. Ambiguous correction targets ask for clarification. Applicant and another person's addresses remain separate.
- Detected uncertain answers such as “I am not sure” now ask a field-specific clarification before any optional AI request. Saved answers stay unchanged, and the person can give a definite answer or skip. Standalone unknown answers are caught for text fields without discarding descriptive text such as “I do not know how to apply and need help.” Raw Meta diagnostics still expose model failures separately.
- Required and conditional questions, numeric/date/email checks, contradiction detection, stale-change protection, source quotes/pages and answer history.
- Email dictation converts explicit spoken separators such as “alex at example dot com” and “alex A-T example dot com” to alex@example.com for confirmation. It also handles phone keyboard dictation. Email conversion uses application rules without a model request; ambiguous addresses still need correction.
- In-tab recovery, explicit clear session, final review and reviewed/incomplete PDF records with persistent Save/Open links. PDFs are answer records, not filled agency originals.
- Optional local Meta answer interpretation. Experimental question proposals use 3B, one bounded inference per source line, with visible progress, source/type checks and source review before form replacement.
- Exportable receipts preserve each exact model response and request separately from the application's assembled field map. Structural acceptance is not an accuracy score.
- An isolated phone-check page and a preserved Muse Glimmer playground attempt with a separately reviewed eight-edit derivative. Loading the captured example makes no new model call; arbitrary manual imports retain unverified provider provenance.

## Model choices and costs

Built with Llama. Both optional models use GGUF Q4_K_M and wllama 3.8.1 from pinned hugging-quants revisions. No weights are committed or included in the source ZIP.

- 1B: 808 MB; retained for answer experiments. Earlier clear answer checks succeeded, but uncertain input produced a guess which the source guard rejects. Its source-question classification was unreliable, so the UI does not use it for question proposals.
- 3B: 2.02 GB, separately selected and consented. Used for the successful eight-question case above. It needs more device memory and CPU inference is slow. A successful browser development case does not establish that it works on every phone or arbitrary form.

The import flow initially selects 3B and clearly shows its download size. Changing size resets consent. Model files use a dedicated browser cache; removal clears this app's model files, including after turning AI off. Prepared forms work without model downloads. Device graphics can be requested, but GPU offload has not been verified.

Hosted NVIDIA/OpenRouter adapters remain optional, server-only and unconfigured. The old OpenRouter free route is absent. No paid fallback exists. Do not revisit blocked NVIDIA key/clipboard controls or paste credentials into chat/source.

## Run and verify

Node 24 recommended, pnpm pinned in packageManager:

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm build
pnpm dev
```

The build copies WASM assets from pinned npm packages. In the managed environment use `sites-preview start <checkout>`; actual inference requires HTTPS. There are **122 passing automated checks**, using deterministic fixtures/stubs for model and speech behavior. Real inference evidence is recorded separately. TypeScript and production packaging are checked separately.

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
