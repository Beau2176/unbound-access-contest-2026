# Public Muse Glimmer development attempts

These are NVIDIA public-playground observations, not authenticated API or app-server inference tests. Only the fictional reserved workshop form was used. The account remains signed out and no API key has been configured. The owner approved NVIDIA's API Trial Terms before these attempts. No payment details were entered.

## Attempt 1

The original extraction prompt and the DOM-rendered output are preserved unchanged beside this file. They are not raw API response bytes. The NVIDIA page identified the model as `meta/muse-glimmer-30b`. Its UI reported 112.17 seconds, 29.04 tokens/second and 4.61 seconds to first token; these are provider UI figures, not a phone usability measurement.

Nine source questions appeared. Seven factKey strings were empty; only the explicitly repeated home-address pair shared a nonempty key. The app requires a nonempty key for every field and would reject those blank keys. The page also rendered boolean values as custom HTML elements, so copying DOM text did not yield parseable JSON. That rendered text was rejected in a browser test, preserving all nine prior confirmed answers. The help for the name added a legal-name qualifier that the source did not request. This attempt is not a passing extraction or an accuracy result.

## Prompt development

The application prompt now explicitly requires a unique nonempty key for every unrelated field. The manual-copy prompt asks for fenced JSON so the web playground can display it literally. A second request in the same conversation asks for those corrections with reasoning turned off. It is a development iteration on the known fixture, not a new held-out accuracy test. At the last check NVIDIA displayed 522 requests in the queue; no second output was yet captured.

## App workflow

The new manual route copies a prompt locally, lets the tester run it in NVIDIA's public playground, and validates the pasted proposal against the original source. It preserves manual provenance and does not verify a pasted response's actual model/provider. A separate browser smoke check used the authored expected-fields fixture to test import/review controls; that fixture is not a model response. Automated tests cover valid import/recovery and rejection of malformed JSON, blank keys and invented source pages/quotes.

## Separate reviewed derivative

`attempt-1-dom-reconstruction.json` replaces only the visible custom `<true></true>` and `<false></false>` DOM elements with JSON boolean values and decodes HTML entities. It is a reconstruction from the page, not raw API bytes. It still fails the app validator because seven fact keys are empty.

`attempt-1-reviewed.json` is a separate human-reviewed derivative: seven blank keys now use each field’s own ID, and the unsupported legal-name wording is removed. Every change is listed in `attempt-1-review-changes.json`. The existing repeated-home key, exact source quotes, pages, conditional support rule and 0–4 companion bound remain intact. The app’s validator accepts this corrected proposal. `reviewed-workflow-check.json` records a deterministic app-state check: a home correction updates both linked questions while leaving the venue address separate. These are reviewed-pipeline checks, not an unchanged model pass or a new held-out evaluation.

The app offers this clearly labelled captured example for judge review. No new inference happens when loading it. Automatic server inference and answer mapping remain untested; no API key is configured. Final submission status is recorded separately in the submission draft.
