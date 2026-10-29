# Smaller-model accuracy and larger-model workaround

## Final focused check - October 29, 2026

The final `source-line-types-v9-explicit-email` contract adds a general email-format instruction. The source fixtures and expected types were not changed to make a pass. On the published version-45 HTTPS app, the default 1B model passed all final types in three authored cases:

| Case | Final types | Actual calls | Inference time |
|---|---:|---:|---:|
| Original repair visit | 10 / 10 | 12 | 25.052 seconds |
| Previously failing garden | 9 / 9 | 11 | 42.153 seconds |
| New library form, frozen before its first live call | 9 / 9 | 11 | 20.096 seconds |

Exact receipts, independent scores and the original full export are in `docs/evidence/model-repair/v45-*`. Only the library case was new in this pass; none is a held-out benchmark or phone study. Source labels, pages, required flags and repeated-label links remain application-derived and excluded from model credit. Every numeric candidate still receives its own actual count-or-dollars decision. All earlier failures and the v8 garden rejection remain preserved. The model was turned off after the three runs. No unchanged loading loop, additional phone test or paid inference was used.

All 152 engineering checks and TypeScript passed before publication. The previously verified actual main-app Meta-to-PDF workflow and phone observations remain separate evidence; these new diagnostics do not repeat or replace them. The existing 2:50 edited demo preserves earlier results and a labelled saved-schema replay; it predates these final v9 results.

---

## Earlier development record (preserved)

October 29, 2026 (America/Denver). These are authored development cases, not a held-out accuracy benchmark or phone study. Source PDFs and original expectations were not changed. The first-stage model requests in v8 exactly match those of v5; only independent numeric-unit verification was added.

## Measured smaller-model results

| Run | Final question types | Actual model calls | Inference time | App validation |
| --- | --- | --- | --- | --- |
| Original v3 repair visit | 2 / 10 | 10 | 67.668 s | Rejected |
| v4 generic examples | 8 / 10 | 10 | 24.273 s | Rejected |
| v5 explicit formats | 9 / 10 | 10 | 27.289 s | Rejected |
| v6 currency wire label | 9 / 10 | 10 | 14.696 s | Rejected |
| v7 simplified first stage plus units | 9 / 10 | 12 | 35.841 s | Rejected: email regression |
| v8 preserved v5 first stage plus units | 10 / 10 | 12 | 37.766 s | Accepted |
| v8 compact 3B repair visit | 10 / 10 | 12 | 419.606 s | Accepted |
| v8 additional garden form | 8 / 9 | 11 | 16.246 s | Rejected: Preferred email |

These times have different warm/cold prompt-cache states and are not a controlled speed comparison. v6's export also contains a separate four-question built-in seed check; it is not part of the ten-question score. All exact original responses remain in the raw JSON exports.

The successful twelve-call result has ten first-stage classifications. Both numeric candidates receive a second real model call with the same unit prompt: count or dollars (other measurements are rejected). In the original successful case, the first stage still called the dollar amount number; the separate model unit response was dollars. No application rule or oracle repaired that decision. The fixed protocol maps the actual unit response to the canonical app type money. The score reconstructs this directly from raw calls, independently of assembledFields, and records every call and request. Ten out of ten refers to final source-question types, not ten individually perfect first-stage calls.

The additional case was authored and frozen in additional-case-frozen.json before its first live attempt. Its email error remains a failed observation. The source-rule alternative does not turn that failed model result into a success.

## Runtime changes and limits

The modern runtime now uses native JSPI instead of forcing CPU 3B through the slower compatibility path. Compatibility remains available through library detection. Same-origin page isolation enables CPU threads. The host did not apply page headers to separately served static worker files: v36 and v37 failed before runtime import. Vite's inline bundled worker inherits document isolation and fixed that boundary. The actual 1B load report records native runtime, isolation true and four CPU threads.

Compact 3B returned the actual short health response {"ready":true} in 36,530 ms. The following full-source first response still hit the old warm ninety-second budget with zero completed calls. The runtime now grants a different task's first system prompt the longer bounded budget, rather than spending it on a health check. The original Q4 native retry still interrupted loading; reload recovered controls. Its last checkpoint is not a measured failure duration and its cause is unestablished. The later v42 compact native attempt completed the unchanged source and passed all ten final types. Its actual load took 7,251 ms with n_ctx 1024, batch/ubatch 256, native runtime, isolation true and four CPU threads. The actual twelve-call extraction took 419,606 ms. First response: 179,218 ms, close to the three-minute bound. Numeric-unit first response: 93,741 ms, demonstrating why a new task prefix needs its own cold budget. No further timeout increase was used for that success. See v42-compact-v8-raw.json and its independently reconstructed score. This is one slow completed development run, not universal loading/inference reliability; 1B remains the default. Earlier failures, model quantizations and short health checks remain separately reported.

The import flow defaults to 1B. Q4 remains on the diagnostics page; compact 3B is experimental. Failed tasks never replace the active form. Prepared forms and a separate explicit-source-wording proposal remain available without loading a model. Source-wording proposals have origin source, carry no-model warnings, require human review and are not credited as model outputs. Unknown source types, conditions and numeric limits stop that route.

PDF worker creation now keeps PDF.js's own ready handshake while using a same-origin blob wrapper. Exact original PDF text was recovered in actual v41 UI checks. The failed custom-port attempt and earlier fake-worker fallback are disclosed in pdf-worker-observations.json.

## Reproduce scores

```sh
python scripts/score-fresh-source-retry.py docs/evidence/model-repair/v42-small-v8-raw.json /tmp/repair-score.json
python scripts/score-fresh-source-retry.py docs/evidence/model-repair/v42-small-additional-raw.json /tmp/garden-score.json --fixture docs/evidence/model-repair/additional-case-frozen.json
```

The original v3 score still recomputes exactly, byte-for-JSON-value. Five injected integrity checks reject a missing unit, a wrong unit, duplicate unit calls, a forged assembled map and changed source; no real export is modified for those checks. See scorer-integrity-checks.json.

152 automated implementation checks, TypeScript and production packaging are separate from model accuracy. No new phone, voice, whole-browser recovery, arbitrary-form or GPU claim follows. Earlier phone/PDF checks and the contest entry/video remain unchanged. Zero dollars spent; no account, agreement, card, paid inference or hosted key was added.

## Actual main-app and fallback verification

In the actual version-43 interface, source-wording review correctly presented all nine garden questions, including Preferred email, with the No AI call label. Closing that proposal preserved the old form. This is a rule-path result, not a repaired model score.

A fresh 1B run on the uploaded original PDF independently matched all ten types (v43-main-small-v8-raw.json). The resulting Meta schema was approved through the app; nine fictional facts populated ten rows. The real typed controls rejected 2.5 for a count and 2026-02-30 for a date, preserved zero dollars and No, corrected both pickup addresses while preserving the separate venue, and retained the form and every fact after a real refresh. Final review reset and was explicitly acknowledged again. The actual downloaded reviewed PDF is v43-live-meta-reviewed.pdf, SHA256 305de29e77c54f06fa1c1eaf2ec834653c4780749b02451f4fc988f4910d60e0, 63,267 bytes, two pages. pypdf checks and complete Poppler-rendered visual review passed. Exact observations and the cancelled rapid-transition proposal are disclosed in v43-live-workflow-observations.json. No voice or phone result follows.
