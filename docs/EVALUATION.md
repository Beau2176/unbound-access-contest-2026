# Evaluation record - October 28, 2026

This is engineering verification of a fictional-data prototype, not a user study or evidence of clinical benefit. The baseline release had 29 tests; this revision has 79 passing tests. Automated speech and provider-response tests use injected stubs. Separate user-reported phone checks and a public model development attempt are described below.

## Automated checks completed

- 21 core-state checks cover two separately arranged forms, actual source labels, required omissions, reversible proposals, shared-fact isolation, ambiguous corrections, export values, number/date limits, conditional fields, contradictions, stale confirmations and damaged storage.
- 14 model-policy checks cover exact free-model selection, missing credentials, removed models, unavailable catalogues, every published price component, no paid fallback, quote/page validation, incompatible linked fields, malformed output and wrong-field answers. No provider account is contacted by these tests.
- 8 Request/Response checks cover authentication, origin, explicit consent, strict schemas, missing credentials, actual body-size limits with and without Content-Length, JSON content types, malformed JSON and a validated same-field stub response. The production route delegates to this handler. This is not an authenticated production HTTP penetration test.
- 8 correction/recovery checks cover spoken disambiguation, review/download/clear commands, linked clearing, spoken zero and counts, malformed number grouping, invalid imported form metadata and corrupted histories. The final check runs 100 corrections on each of two forms (200 iterations), preserving the other role's address and restoring confirmed state each time.
- 13 speech-controller checks cover read-then-listen sequencing, duplicate/stale events, pause/cancellation, asynchronous error recovery, microphone denial, bounded silence retries, reset after an answer, speech-output failure, unsupported speech, start exceptions and unmount cleanup. These automated checks do not establish device audio; see the tester report below.
- 2 PDF checks cover the real jsPDF exporter and recovery from a failed font request. The layout case covers three pages, an accented fictional name, two matching applicant addresses, a distinct landlord address and 18 repetitions of a long answer. Reviewed and incomplete-draft labels are checked separately. Both PDFs were reopened with pypdf and normalized text compared, removing only page footers. All three reviewed pages were rendered with Poppler and visually inspected: readable text, intact accents and addresses, no clipping or footer collisions. A simulated font network failure produces a useful retry message without altering confirmed state; a subsequent retry returns a real PDF blob with an incomplete-draft filename.

TypeScript checks pass. The release build is recorded in the saved project checkpoint.

- 9 NVIDIA checks cover public catalog parsing, missing keys, unapproved models, changed/failed free listings, key isolation, exact endpoint/request parameters, invalid/truncated/wrong-model/wrong-field replies, rate limits, pending/network failures, provider selection and authenticated same-origin API delegation. These inference replies are stubs. A separate real public catalog fetch returned HTTP 200 and confirmed the available free Muse Glimmer listing; no inference request was made.
- 2 phone-check logic tests verify a complete isolated fictional sample with distinct applicant/landlord addresses and exact recognition of the test phrase without passing on silence or other words. Read-aloud and saved-file completion remain explicit human confirmations on the phone-check page. These tests do not establish an actual Android pass.
- 2 manual-import tests check valid fenced JSON, persistent manual provenance, source-linked field recovery and isolated address corrections; malformed JSON, empty keys and wrong source pages/quotes are rejected without changing a confirmed session.

## Browser checks completed

The actual interface was tested through visible controls with fictional information:

- An answer proposal was cancelled without becoming confirmed, then a new proposal was confirmed.
- Invalid household count, quantity, impossible date and email were rejected. Spoken-style input "three people" and "zero dollars" normalized without an AI call.
- Conditional support details appeared after Yes. Skipping a required detail blocked final-review acknowledgement; filling it allowed review.
- Applicant-address changes showed old/new values for both shared fields. Confirmation changed both while preserving the landlord address.
- Confirmed values survived a reload. Final-review acknowledgement reset, requiring a fresh check.
- The command dialog shows spoken clarification, clear-answer, confirm-review and download-PDF guidance. Escape closes it and restores focus to its opener.
- Cancelling a form switch retained confirmed answers. Starting the second form reset its answers. After a focus fix, dialog transitions focus an enabled control and Tab/Shift+Tab wrap inside the dialog.
- The separate phone-check page starts all three results as Not checked, generates a fictional sample PDF with direct save/open links, and disables saved-file confirmation before Save is chosen. Returning to paperwork preserved the pre-existing fictional name and all nine confirmed answers. No read-aloud, microphone or saved-file pass was asserted by the cloud-browser checks.
- The manual-import modal rejected the first model's malformed DOM-rendered text while retaining the existing nine confirmed answers. A separate test with the authored expected-fields fixture reached the source/linked-field review, started a clean manually labelled session and confirmed a typed answer. Reloading restored Alex Example and retained the manual origin/provenance notice. That fixture check is not a successful model extraction.

The cloud browser displayed the reviewed-download-started message, but download-event/file capture timed out. A persistent Save PDF link and Open PDF link were added after generation so users can retry directly. Browser checks confirm these appear after export and disappear when review acknowledgement changes. The review controls are disabled during generation; changing answers or review status invalidates the prepared file link. Direct-link download capture also timed out, and the cloud browser URL policy prevented observing the blob PDF viewer. The agent did not directly observe Android file saving; the tester subsequently reported it passed, as recorded below. Generator bytes and all three rendered pages were checked separately with Poppler. A CLI-to-preview HTTP smoke attempt failed at the preview transport boundary before any assertions; it is excluded from the passing count. No network controls were bypassed.

## Free Meta access observation

The old OpenRouter free Llama route is absent. NVIDIA's Muse Glimmer page lists a free prototype endpoint. The API trial agreement was accepted with the owner's permission; Developer Program enrollment and a server key remain unfinished. The public playground returned nine proposed questions for the reserved fixture without sign-in. That first response had seven empty fact keys and its DOM text was not parseable JSON; it is not a passing extraction. A corrected request is a development iteration, not an independent accuracy test. See the preserved [playground evidence](evidence/public-playground/README.md).

## User-reported device checks

Boyd confirmed in this conversation that sound worked, the microphone worked, and the PDF was downloaded and then opened from its download location. His Android screenshot shows the reviewed sample record, matching copies of 10 Example Road and a separate landlord address at 90 Venue Lane. Basic read-aloud, microphone and saved-file checks are therefore recorded as passed by the tester. The agent did not observe the phone audio or transcript. No measured completion time, end-to-end dictated-form session, or phone permission/network failure test was supplied. The new manual-import controls have not been tested on his phone.

## Still unverified or incomplete

- A usable live Meta extraction, authenticated API request, natural-answer mapping and an independent reserved-form evaluation. A public-playground development request was made; it did not establish these results.
- A full dictated-form session on Boyd's phone, permission/network failures, completion time and manual-interaction counts. The three basic device checks were reported passed by Boyd.
- Final event submission. Public judge access, the 2:15 edited video and the separate contest repository are now prepared; these do not establish eligibility or a submitted entry.

Do not convert these checks into an invented extraction score, speed improvement, user-study result or fully functioning AI claim.

## Final reviewed-example workflow

The unchanged DOM-derived proposal is rejected for seven empty fact keys. A separate reviewed derivative corrects those keys and removes one unsupported qualifier, with an exact edit log. Source quotes/pages, conditional support and companion bound validate. In the browser, the corrected nine-field form was approved, eight distinct answers confirmed, five companions rejected, zero accepted, conditional support completed and a 40→41 Practice Street correction applied to both home questions. The venue remained 900 Separate Venue Road. The reviewed PDF Save/Open links appeared; the cloud-browser download-event wait timed out. A matching PDF was independently generated with the same application exporter for visual QA and the video. This is a reviewed workflow demonstration, not an unchanged model pass or server inference result.

## Public release materials

The judge deployment uses public access. The finished edited video is 135.181333 seconds, H.264/AAC, 1920×1080 with 48 kHz audio. All streams fully decoded without errors; encoded scene frames and caption coverage were visually checked. Narration is generic offline synthesis, and listening review was not performed. The reproducible project and the preserved model evidence are in the public contest repository: https://github.com/Beau2176/unbound-access-contest-2026. No additional model inference or paid service was used for repository publication. Final event submission remains pending.
