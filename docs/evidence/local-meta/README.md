# Actual on-device development evidence - October 28, 2026

The JSON files contain unchanged raw outputs downloaded from the live app. `accepted` records parser/contract acceptance, not semantic correctness. It must never be used as the model's accuracy score.

| Run | Contract | Clear answer results | Uncertain count | Extraction |
| --- | --- | --- | --- | --- |
| attempt-1-v8.json | Full answer/schema object | One of three clear cases correct | Wrong clarification flags | Selected only the title; quality failure despite structural acceptance |
| attempt-2-v9.json | Compact value/question; source-line tuples | Three clear cases correct | Guessed 3; model failure | All text/required, including title; rejected by required-flag validator |

Version 9 answer times: 34,014 / 7,664 / 10,198 / 10,636 ms. Extraction: 86,497 ms. The cloud browser reported CPU/WebAssembly; GPU acceleration was not verified. These development cases informed the prompt and guards and are not a held-out benchmark.

Current source adds conservative input grounding: uncertain numeric/YesNo/date values are rejected; numbers must appear numerically or as supported words in the utterance; text cannot add unseen wording; Yes/No must match clear cues; dates must occur literally. Explicitly marked source questions cannot be omitted. Direct controls remain available when a proposal is rejected. These are bounded prototype guards, not guarantees against every hallucination.

Model: Meta Llama 3.2 1B Instruct, Q4_K_M; hugging-quants revision 7d1f70022fcab2038000074bd0342e03e1d8b755. Download 807,690,656 bytes. SHA256 verified against the upstream LFS content metadata: 1d0e9419ec4e12aef73ccf4ffd122703e94c48344a96bc7c5f0f2772c2152ce3. Runtime wllama 3.8.1. No weights are included here.

## Actual typed browser workflow

`browser-reviewed-answer-record.pdf` is the actual downloaded file, not a reconstructed fixture. It contains ten source rows across two pages (nine grouped answers because the home address is linked twice). Text extraction and both rendered pages were inspected. Confirmed values: Alex Example; both home rows 41 Practice Street; household 2; income 0; landlord 90 Venue Lane; practice-paperwork request; support Yes; Questions read aloud; alex@example.invalid.

The UI run cancelled an unconfirmed Wrong Example draft, rejected 13 against the 1-12 household constraint, confirmed zero dollars, revealed the required support detail after Yes, corrected both home fields with before/after review, preserved the landlord address and acknowledged final review before download. It was typed in the cloud browser, not dictated on Boyd's phone. Earlier basic phone checks do not establish a complete voice journey.
