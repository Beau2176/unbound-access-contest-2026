# Actual on-device development evidence - October 28, 2026

The JSON files contain unchanged raw outputs downloaded from the live app. `accepted` records parser/contract acceptance, not semantic correctness. It must never be used as the model's accuracy score.

| Run | Contract | Clear answer results | Uncertain count | Extraction |
| --- | --- | --- | --- | --- |
| attempt-1-v8.json | Full answer/schema object | One of three clear cases correct | Wrong clarification flags | Selected only the title; quality failure despite structural acceptance |
| attempt-2-v9.json | Compact value/question; source-line tuples | Three clear cases correct | Guessed 3; model failure | All text/required, including title; rejected by required-flag validator |
| attempt-3-v10-guarded.json | Same model/prompt, current input-grounding guard | Three clear cases correct | Raw guess 3 rejected; guard success, model failure | Not rerun |

Version 9 answer times: 34,014 / 7,664 / 10,198 / 10,636 ms. Extraction: 86,497 ms. The cloud browser reported CPU/WebAssembly; GPU acceleration was not verified. These development cases informed the prompt and guards and are not a held-out benchmark.

Current source adds conservative input grounding: uncertain numeric/YesNo/date values are rejected; numbers must appear numerically or as supported words in the utterance; text cannot add unseen wording; Yes/No must match clear cues; dates must occur literally. Explicitly marked source questions cannot be omitted. Direct controls remain available when a proposal is rejected. These are bounded prototype guards, not guarantees against every hallucination.

Model: Meta Llama 3.2 1B Instruct, Q4_K_M; hugging-quants revision 7d1f70022fcab2038000074bd0342e03e1d8b755. Download 807,690,656 bytes. SHA256 verified against the upstream LFS content metadata: 1d0e9419ec4e12aef73ccf4ffd122703e94c48344a96bc7c5f0f2772c2152ce3. Runtime wllama 3.8.1. No weights are included here.

## Actual typed browser workflow

`browser-reviewed-answer-record.pdf` is the actual downloaded file, not a reconstructed fixture. It contains ten source rows across two pages (nine grouped answers because the home address is linked twice). Text extraction and both rendered pages were inspected. Confirmed values: Alex Example; both home rows 41 Practice Street; household 2; income 0; landlord 90 Venue Lane; practice-paperwork request; support Yes; Questions read aloud; alex@example.invalid.

The UI run cancelled an unconfirmed Wrong Example draft, rejected 13 against the 1-12 household constraint, confirmed zero dollars, revealed the required support detail after Yes, corrected both home fields with before/after review, preserved the landlord address and acknowledged final review before download. It was typed in the cloud browser, not dictated on Boyd's phone. Earlier basic phone checks do not establish a complete voice journey.

## Published guard verification

The third live run on version 10 returned the same three clear values and the same unsupported uncertain-count guess. The published app accepted the clear proposals and rejected the guess with `accepted: false`. Times: 35,388 / 7,943 / 10,412 / 11,122 ms. Receipts were downloaded from the live page unchanged. The apparent reload stall resolved; the model reached ready on the CPU path. No GPU or phone performance inference is made.

## Source-line classification development

`attempt-4-v11-extraction.json` is the unchanged two-run download, including prompts and schemas. The seed-exchange form's four question types were correct (73,032 ms). The bicycle form's date, budget and description were incorrectly typed as number, Yes/No and text (54,978 ms). Structural acceptance did not establish semantic correctness. Version 12 adds source-cue type guards so these mistakes cannot pass, and a position-independent prompt. The following v12 attempt was rejected for a title-as-question error, as recorded separately. Source-derived required flags, exact labels/pages and narrowly matched repeated labels are deterministic application work, not model-extraction successes.

`attempt-6-v13-sequential.json` preserves all eight exact 1B per-question responses. The run was rejected for field-type conflicts after 56,818 ms. Two of eight question types matched the authored expectation; no partial form was approved. The first explicit fictional title was derived as metadata, not classified by the model.

A separately selected Meta Llama 3.2 3B Q4_K_M checkpoint is being evaluated. Its upstream LFS pointer reports 2,019,373,920 bytes and SHA256 c55a83bfb6396799337853ca69918a0b9bbb2917621078c34570bc17d20fd7a1 at revision eb72f2a08dd2b9edd07ffacfe5aa56938b7939b0. This pointer metadata is not a browser-time full-file checksum. That paragraph records the state before the verified 3B run below.

## Verified 3B extraction and complete browser workflow

- `attempt-7-v14-3b-extraction.json`: the unchanged eight-call receipt. All eight expected question types matched; 162,825 ms total CPU time. `attempt-7-v14-3b-extraction-score.json` records the comparison and receipt hash.
- `attempt-8-v14-3b-workflow.json`: the unchanged download containing that extraction plus a separate real zero-dollar answer proposal (95,032 ms). The value was explicitly confirmed in the app.
- `browser-3b-reviewed-answer-record.pdf`: actual one-page browser download after seven distinct confirmed facts and eight source rows. Both corrected home copies show 101 Practice Street, the workshop remains 900 Separate Venue Road, date 2026-11-02 and budget 0. All values were checked with pypdf and the rendered page inspected. `browser-3b-pdf-qa.json` records the hash and checks.

The completed flow was typed browser QA, not phone dictation. No measured usability improvement or GPU claim is made. These authored examples informed development; they are not a held-out benchmark. Current question proposals use 3B; 1B remains for answer experiments. Model download, validation and full source review remain explicit.
