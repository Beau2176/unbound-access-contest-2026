# UNBOUND Access - Paperwork by Voice

One question at a time: spoken or typed answers, explicit confirmation, isolated shared-fact corrections and a readable PDF answer record.

[Open the app](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site) · [Judge walkthrough](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/contest) · [Live Meta checks](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/local-meta)

## Current result - October 28, 2026

The existing Indie Developer / Build for Your World entry was confirmed submitted earlier today. This is the same project, with subsequent improvements. Updated portal text is prepared in docs/SUBMISSION_DRAFT.md; it has not been applied in the currently signed-out contest session. The commercial Founders Beta is separate. No card, subscription, API key, top-up or paid inference was used.

**Real Meta extraction now has a working browser example.** Meta Llama 3.2 3B Instruct correctly proposed all eight expected question types for the authored bicycle-repair development form in 162,825 ms on CPU. The same per-question contract with 1B matched two of eight and was rejected. This is one development case, not a held-out accuracy benchmark or phone-performance result. Exact source wording, required flags, pages and narrowly matched repeated labels are application-derived; they are not credited as model outputs.

A real typed browser journey approved the 3B-proposed form, confirmed seven distinct facts across eight source rows, used a separate real 3B call to interpret “zero dollars” as 0 (95,032 ms), corrected both home-address rows from 100 to 101 Practice Street while preserving 900 Separate Venue Road, and downloaded the reviewed one-page PDF. The actual downloaded bytes were reopened, checked against all expected values, rendered and visually inspected. See [raw receipts, failed attempts and PDF evidence](docs/evidence/local-meta/README.md).

## Working features

- Two original fictional prepared forms, large controls, browser read-aloud and speech input, with typed alternatives.
- Every proposed answer or correction requires confirmation. Ambiguous correction targets ask for clarification. Applicant and another person's addresses remain separate.
- Required and conditional questions, numeric/date/email checks, contradiction detection, stale-change protection, source quotes/pages and answer history.
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

The build copies WASM assets from pinned npm packages. In the managed environment use `sites-preview start <checkout>`; actual inference requires HTTPS. There are **91 passing automated checks**, using deterministic fixtures/stubs for model and speech behavior. Real inference evidence is recorded separately. TypeScript and production packaging are checked separately.

## Data, boundaries and remaining work

Fictional data only. Answers/history use sessionStorage in this tab. Receipts remain in page memory until explicitly downloaded. Local model tasks process text in this browser; browser speech may use a remote service. Hosted AI, if separately configured and chosen, sends selected fictional text to its named provider. See [data disclosures](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/privacy).

Text PDFs: up to 5 MB, 10 pages and 16,000 characters. Experimental local AI: short sources up to 4,000 characters and 30 nonempty lines, one question per line. Detected conditions/numeric limits and explicit source/type conflicts are rejected. Use prepared forms or a fully reviewed manual proposal for those features. Human review remains essential. No OCR, signatures, payments, eligibility decisions, agency integrations or automatic submissions.

One tester earlier reported basic Android audio, microphone and opening a saved sample PDF. A full phone dictation session, timed usability comparison, GPU performance and arbitrary-form generalization remain unverified. Current browser journeys used typed controls; no speed-improvement percentage or clinical benefit is claimed.

The 2:59 edited demo uses earlier actual app screenshots, a browser-downloaded PDF and generic offline synthetic narration. It predates the new 3B result; the current judge page and preserved receipts provide that update. Source ZIP excludes weights, secrets, dependencies and generated build output. Original code is MIT; Llama/dependencies retain their licenses in THIRD_PARTY_NOTICES.md.

The original event entry remains the only entry. Deadline last verified: November 4, 2026, 7 p.m. America/Denver. Meta open-weight use does not imply organizer eligibility approval; the named Muse-only bonus is not claimed.

Product direction and acceptance testing: Boyd Koehler, UNBOUND FORGEWORKS LLC. AI-assisted implementation: OpenAI coding assistant. Project-specific work began during the event window.
