# UNBOUND Access - Paperwork by Voice

One form question at a time, spoken or typed answers, explicit confirmation, shared-fact corrections and a readable PDF answer record.

[Open the app](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site) · [Demo and judge walkthrough](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/contest) · [Real Meta run checks](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/local-meta)

**Current status, October 28, 2026:** the existing Indie Developer / Build for Your World entry was submitted and confirmed earlier today. This source contains subsequent improvements to that same project. Prepared-form workflows work without AI. Genuine on-device Meta Llama 3.2 1B inference has run in the public HTTPS app, with preserved raw receipts and disclosed failures. Hosted NVIDIA/OpenRouter inference remains unconfigured. No paid inference, card, subscription or top-up was used.

## What works

- Two original fictional forms; large controls, read-aloud, browser speech input and a typed alternative.
- Every answer/correction requires confirmation. Explicitly linked applicant facts update together; another person's address remains separate. Ambiguous voice correction targets ask for clarification.
- Required/conditional questions, numeric/date/email checks, contradiction and stale-change protection, source quotes/pages and answer history.
- In-tab recovery, clear session, final review and complete/incomplete PDF exports with persistent Save PDF / Open PDF controls. PDFs are answer records, not filled agency originals.
- Optional on-device Meta proposals for an answer or a short source-question schema. A compact JSON contract, input grounding checks, source validation and human confirmation stand between inference and saved state.
- A separate phone-check page tests sample speech and sample PDF handling without reading the current paperwork session.
- A preserved Muse Glimmer public-playground attempt and separately reviewed eight-edit derivative. Loading that example makes no new model call; arbitrary manual imports cannot verify provider identity.

## Genuine local Meta use and limits

Built with Llama. The optional model is Meta Llama 3.2 1B Instruct, GGUF Q4_K_M, using wllama 3.8.1. It downloads about 808 MB after explicit opt-in, from a pinned hugging-quants revision. No weights are committed. HTTPS, sufficient memory and download bandwidth are required. CPU is slow; WebGPU is requested only when opted in and available, with no claim that GPU offload was verified.

The revised development run handled three clear answers correctly: household three, zero dollars and No. The uncertain-count case guessed three. The current source guard rejects such an unsupported answer; this is a guard success, not a model-quality success. Its question extraction also failed required-flag validation. See [unchanged receipts and evaluation](docs/evidence/local-meta/README.md). These few development cases are not an accuracy benchmark. Arbitrary form extraction remains experimental and unreliable; prepared forms and direct controls remain available.

## Run and check

Node 24 recommended, pnpm as pinned by packageManager:

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm build
pnpm dev
```

The build copies WASM runtime assets from the pinned npm packages. For the managed environment, use `sites-preview start <checkout>` and its returned URL; local Meta inference must be tested over HTTPS. The full suite currently has 86 passing automated checks; those use deterministic fixtures/stubs, not model-quality benchmarks.

Hosted adapters remain server-only and optional: `META_PROVIDER=nvidia` with `NVIDIA_API_KEY`, or explicitly configured `META_PROVIDER=openrouter` with `OPENROUTER_API_KEY`. Neither credential is configured in the contest deployment. The NVIDIA adapter checks the fixed free listing/model before inference; the old OpenRouter candidate is absent from the current catalog. No paid fallback exists. Do not revisit blocked key/clipboard controls or paste credentials in chat.

## Data and scope

Fictional data only. Confirmed answers/history use sessionStorage in this browser tab; model receipts stay in page memory until exported. The optional model download uses a dedicated browser cache with an explicit removal control. In local mode source text/utterances are processed in the browser. Browser speech can use a remote service; offline speech is not claimed. Hosted AI, if separately configured and consented, sends selected fictional text to its named provider. Hosting logs may contain normal request metadata. See [data disclosures](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/privacy).

Text-based PDFs only: up to 5 MB, 10 pages and 16,000 characters. Local AI accepts a smaller short-form subset, up to 4,000 characters and 30 nonempty lines; it does not encode conditional requirements or numeric ranges. No OCR, signatures, raw payment processing, agency integrations, eligibility decisions, legal/medical advice or automatic submissions.

## Evidence and contest scope

A real typed cloud-browser run completed the Community Help Intake, cancelled an unconfirmed draft, rejected household size 13 against the source's 1-12 bound, accepted zero income, revealed a conditional follow-up, corrected both home fields while preserving the landlord address, and downloaded a reviewed two-page PDF. The actual PDF is preserved in docs/evidence/local-meta. This is not a phone dictation test. One earlier tester reported phone audio, microphone and opening the saved sample PDF; full phone dictation and measured usability remain unverified.

The edited demo uses actual app screenshots, the actual downloaded PDF, source-derived evidence cards and generic offline synthetic narration. It is not continuous voice capture. The public source archive includes all project code, evidence, model license and demo reproduction scripts, excluding model weights, secrets, dependencies and generated downloads.

The participant guide rubric is impact 30%, Meta tooling 25%, engineering 20%, demo 25%. Deadline: November 4, 2026, 7 p.m. America/Denver. Llama is a Meta open-weight model, but no eligibility ruling is implied. The named Muse-only open-weight bonus is not claimed. See [current entry text](docs/SUBMISSION_DRAFT.md) and [evaluation](docs/EVALUATION.md).

Product direction and acceptance testing: Boyd Koehler, UNBOUND FORGEWORKS LLC. AI-assisted implementation: OpenAI coding assistant. Project-specific code/forms began in the event build window. The commercial Founders Beta is separate. Original code is MIT; upstream dependencies and Llama retain their licenses. See [third-party notices](THIRD_PARTY_NOTICES.md).
