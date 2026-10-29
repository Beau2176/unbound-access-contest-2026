# Fresh source-form development check

October 28, 2026 (America/Denver), public version 23. The new two-page **Fictional Neighborhood Repair Visit** source has ten question rows, nine distinct facts and all seven supported answer types. It was created for this run and is absent from the app's prepared forms. The source, expected types and planned fictional answers were recorded before the first model-load attempt. This is a development case, not a held-out benchmark or independent user study.

**Result: the manual question-proposal workflow passed; live Meta extraction was blocked before inference.** No app question template, prompt, model contract or answer-validation rule was changed to fit this case.

| Check | Observed result |
| --- | --- |
| Load a new text-based PDF | All ten labels and both page numbers were retained. |
| Incorrect source page in a proposal | Rejected; the current form remained unchanged. |
| Review an authored manual proposal | All ten types, labels, required flags, pages and the shared pickup-address link were checked before approval. The app visibly labelled the import's model/provider unverified. |
| Required answers | Missing required values prevented reviewed status. |
| Fractional count / impossible date | `2.5` and `2026-02-30` were rejected. |
| Uncertain count | Requested clarification without an answer proposal. |
| Email separator | Typed `riley A-T example dot invalid` proposed `riley@example.invalid` for confirmation. This was not a microphone test. |
| Zero / No | The zero-dollar budget and No reminder answer were preserved. |
| Shared correction | Cancellation retained both originals; confirmation changed both pickup copies and preserved the separate venue. |
| Reload | The imported form and all nine confirmed facts restored. Review acknowledgement reset and was checked again. |
| Actual reviewed PDF | The downloaded two-page file reopened; all ten rows, zero, No, the email, valid date and exact corrected addresses were verified. Both rendered pages were visually inspected without visible clipping or overlap. |
| New live Meta extraction | **Blocked at model loading.** Two 3B CPU-loading attempts made browser inspection time out; reload recovered the app. No extraction call or unchanged model response exists for this case. The cause was not established. |

The manual JSON was authored for workflow QA, not produced by a successful Meta run. Its successful import must not be counted as a model accuracy result. The earlier successful 3B bicycle-repair evidence remains separate and unchanged. No new hands-free, phone, GPU, timed-usability or PDF-accessibility result is claimed. Zero dollars spent.

## Files

- `Fresh_Repair_Visit_Source.pdf`: unchanged source PDF.
- `frozen-expectations.json` and `expected-source.txt`: expectations saved before loading the model; no claim of external preregistration.
- `authored-manual-proposal.json`: separately labelled manual proposal.
- `browser-observations.json`: actual PDF-extracted text and observed UI states, plus loading/automation limits.
- `Fresh_Repair_Visit_Reviewed.pdf`: unchanged actual browser download.
- `pdf-qa.json` and `result.json`: content, visual and scope checks.

An initial shared-file selection error was resolved by selecting the same source from the documented shared root. A rapid automated field transition required one repeat fill after the next field settled. These are recorded without treating them as established PDF or user-input defects.
