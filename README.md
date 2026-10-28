# UNBOUND Access - Paperwork by Voice

A focused accessibility prototype: one form question at a time, spoken or typed answers, source-linked corrections, a human review, and a readable PDF answer record.

[Open the app](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site) · [Watch the 2:15 demo and judge walkthrough](https://unbound-access-paperwork-by-voice.savorydove14.chatgpt.site/contest) · [Public repository](https://github.com/Beau2176/unbound-access-contest-2026)

**Current status:** prepared-form and manual-question import workflows work. The automatic Meta API connection has no server key. A real Muse Glimmer public-playground development attempt returned nine proposed fields with format problems. A separate reviewed derivative documents seven identifier corrections and one wording correction, and passes source validation. The app offers that captured example for explicit review; it makes no new model call. See the preserved evidence below. The final contest entry has not been submitted.

## What is built

- Two original fictional practice forms with separate roles and explicitly repeated facts.
- Large controls, high contrast, browser read-aloud, speech input and guided voice commands, with a typed path when voice is unavailable. Guided listening recovers after asynchronous failures, ignores stale speech events and pauses safely after microphone denial or repeated silence.
- Proposed answers and corrections require confirmation. Linked applicant facts change together; a landlord or venue address stays separate. Ambiguous targets accept a spoken question label or option number. Voice commands also cover clearing an answer, confirming the final review and starting the PDF download.
- Required/conditional fields, numeric/date/email checks, contradiction detection, stale-change protection and a source-linked answer history.
- Confirmed answers restore within the browser tab. Clear session removes the prior answers/history.
- Review and labelled complete/incomplete PDF exports using embedded fonts, with wrapped long answers and page numbers. A persistent Save PDF / Open PDF choice allows retries; changing answers or review status clears the old file link. This is an answer record, not an original agency form or automatic submission.
- Server-only Meta adapters for extracting a proposed field schema and mapping an utterance to one proposed answer. NVIDIA's free Muse Glimmer endpoint is the selected prototype route; the old OpenRouter route remains an explicit option. Every extracted source quote/page is checked; users approve questions and shared facts before starting an imported form.
- A separate `/phone-check` page uses fictional sample data to check read-aloud, recognition of “blue bicycle”, and saving/opening a sample PDF. Read-aloud and saved-file results require the tester's own confirmation. This page does not read or alter the paperwork session.
- A manual Meta route under Try a different form copies a source-bound prompt, links to the free Muse Glimmer playground, and accepts its pasted JSON for source/constraint checks and explicit review. No server key is required for this round trip. Imported forms keep their manual provenance after a reload; the app does not verify their actual model/provider. This route adds a copy-and-paste step for new forms.

## Zero-dollar constraint

No payment method, new subscription, top-up or paid model fallback was used. Browser speech uses the browser's available service; it is not represented as offline speech.

The preferred automatic route is `meta/muse-glimmer-30b` at NVIDIA's hosted prototype API. The server checks the NVIDIA model page for an available Free Endpoint before inference, uses only the fixed endpoint/model, disables tools, and never falls back to a paid partner or another provider. A real public catalog fetch passed this check. No inference key is configured and no authenticated server inference was tested. The owner approved the API trial agreement; Developer Program enrollment and credentials remain unfinished because the user-facing cloud handoff repeatedly expired. A public-playground test succeeded in returning output without enrollment, but that first proposal was not importable. A separately documented reviewed derivative is now usable; the original result remains a failed extraction attempt. See [access findings](docs/FREE_META_ACCESS.md) and [playground evidence](docs/evidence/public-playground/README.md). Use fictional data only.

The previous OpenRouter candidate is `meta-llama/llama-3.3-70b-instruct:free`; that route is absent from the current catalog. Its adapter remains selectable only through explicit server configuration and retains its zero-price guard. Unknown providers stay disabled. Unit tests use fake test keys and stub responses; they are not evidence of model quality. The event permits Meta open-weight models, but contest or bonus eligibility is not established by this adapter alone.

## Run and check

Use Node 24 or newer. The supplied project is configured for pnpm; dependencies are pinned in the lockfile.

```sh
pnpm install
pnpm dev
pnpm run typecheck
pnpm test
pnpm build
```

`META_PROVIDER=nvidia` selects `NVIDIA_API_KEY`; `META_PROVIDER=openrouter` selects `OPENROUTER_API_KEY`. The default provider is NVIDIA. Both keys are server-only runtime secrets. Never place them in browser/public environment variables, source, screenshots or logs. The contest deployment is intended for public judge access; no server-side answer storage is used. The assist endpoint requires the hosted authenticated user, a same-origin request, explicit fictional-data consent, valid JSON and a bounded request body. No end-user account system or database is added.

On the managed preview runtime, use `sites-preview start <checkout>` and the exact URL printed by that tool. The supplied Sites build and source helpers handle hosting and repository synchronization.

## Data boundary and scope

Use fictional data only in this prototype. Source text is treated as untrusted task data. The model cannot execute tools, submit forms or alter confirmed state. Speech may be processed by the browser's remote speech service. Selected AI tasks transmit fictional source text/utterances to the provider named in the consent UI. NVIDIA discloses trial input/output recording and product/model improvement; no local-only or no-retention guarantee is made. The app does not persist documents or answers on its server.

PDF input is limited to text-based documents of at most 5 MB, 10 pages and 16,000 characters. No handwriting or image OCR. English workflow, limited field kinds, no signatures, payments, agency integrations, eligibility decisions, legal/medical advice, or automatic form submissions.

## Evidence and remaining work

See [evaluation](docs/EVALUATION.md) for 79 automated checks and browser observations. Boyd confirmed that sound, microphone and opening the PDF saved to Downloads worked on his phone, and provided a screenshot of the matching sample record. This is one tester's basic device check, not a measured usability study or a complete dictated-form test. The captured Meta proposal is usable only after eight documented review edits. Automatic extraction, live AI answer mapping and measured completion time remain untested. The `/contest` page provides the edited demonstration, source download and judge instructions. The separate public contest repository is linked above. The final event entry is not submitted. Do not present prepared sample questions or the expected-fields fixture as model extraction. The [submission draft](docs/SUBMISSION_DRAFT.md) retains these limits.

The current guide was re-read from the accepted participant account on October 28. Its rubric is Impact 30%, Meta tooling 25%, technical execution 20%, demo 25%. Build window: October 27-November 4. Deadline: November 4, 7 p.m. America/Denver. See [demo plan](docs/DEMO_PLAN.md). No final submission or new agreement has been accepted on the owner's behalf.

## Attribution and primary references

Product direction and acceptance testing: Boyd Koehler, UNBOUND FORGEWORKS LLC. AI-assisted implementation: OpenAI coding assistant. Project-specific code/forms began during the permitted event window; reused starter/libraries are disclosed in [third-party notices](THIRD_PARTY_NOTICES.md). Original code is MIT licensed; upstream components retain their licenses.

- [Participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details)
- [Meta event overview](https://dev.meta.ai/events/global-hackathon)
- [Meta Muse Spark Open documentation](https://dev.meta.ai/docs/muse-spark-open)
- [NVIDIA free Muse Glimmer prototype endpoint](https://build.nvidia.com/meta/muse-glimmer-30b/build)
- [NVIDIA Muse Glimmer request reference](https://docs.api.nvidia.com/nim/reference/meta-muse-glimmer-30b-infer)
- [OpenRouter free Meta Llama model](https://openrouter.ai/meta-llama/llama-3.3-70b-instruct:free/performance)
- [OpenRouter price-ceiling documentation](https://openrouter.ai/blog/tutorials/how-to-get-the-lowest-cost-llm-inference-on-openrouter/)
- [Browser speech recognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
