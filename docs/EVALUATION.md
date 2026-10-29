# Current evaluation - October 28, 2026 (America/Denver)

115 automated checks passed. TypeScript passes. These deterministic model/speech fixtures are engineering checks, not model-quality or phone tests. Real browser/model work is separate below.

## Reading voice update

The tester reported that the first test was perfect but the read-aloud voice sounded poor. The old hook selected the first en-US voice and set rate to 0.86. The new automatic selection favors English voices whose names identify Natural/Neural/Enhanced/Premium qualities and Google English voices, deprioritizing names of older basic engines. This is a name heuristic, not an audio-quality measurement. Normal speed is now 1.0. Available voices update on voiceschanged and are queried again at playback. An explicit selection overrides automatic ranking; a removed voice falls back safely.

A shared Reading voice & speed control appears in questions/reviews and expanded on the phone check. Voice identifiers and one of four bounded rates are stored separately from form answers; denied storage keeps an in-memory choice. Changing preferences and previewing stop guided input. A preview never automatically starts the microphone. Online browser voices may send the text being read to the browser provider; privacy disclosures were updated. No new service, paid generation, API key or model download was added.

Eight new deterministic checks cover first-voice replacement, ranking variants, explicit selection/removal, late lists, English filtering, saved settings, storage failures and preview microphone isolation. In the actual preview UI, changing speed preserved a fictional confirmed answer; reload restored both the answer and the chosen slower speed. The phone-check page used the same preferences. This cloud browser offered no English voice choices; preview playback returned a recoverable read-aloud error and remained paused. It could not establish audible quality or actual phone voice availability. See evidence/reading-voice-check.json. A phone listening retest is pending; earlier phone PDF success does not need repetition.

## Updated competition video

The new 170.2-second edit presents the preserved 3B eight-question result and zero-dollar answer, the earlier 1B failure, explicit application-derived metadata, and the actual earlier one-page 3B workflow PDF. Fresh app images replay the saved schema through manual import with fictional typed answers; every such shot is labelled as a replay, not new live inference. The underlying model receipts and downloaded PDF were not changed. No private phone image or actual personal answer is used.

The 1920×1080 H.264/AAC export has 22 measured speech-led scenes at native speed, with no forced three-minute padding. All encoded visual states and 42 cut-boundary frames were checked against the expected scenes, and the full audio/video streams decode successfully. Captions fit their layout and have no reading-speed flags above 20 characters per second. The encoded mix is about -16 LUFS, with headroom. Independent listening and speech-recognition alignment were unavailable; those are not recorded as passed. The reproducible Python project, synthesis input transcript, measured phrase intervals, SRT and source manifest are in demo/. See evidence/video-v2-qa.json. The old stable contest-video URL serves the same new bytes; the judge page also uses a versioned URL.

## Session, condition and voice reliability pass

Two failures were reproduced in the previous implementation: sixty near-limit text corrections produced a 370,358-character session that could not restore, and a Yes-to-No correction in an imported form did not flag its answered follow-up. Three injected browser speech failures also escaped the controller: microphone creation, utterance creation and cancellation. Six new tests were observed failing before those fixes; all now pass.

Current answers are retained while correction history is bounded to the latest hundred entries and 120,000 serialized characters. An offset preserves the total revision. The same sixty-correction reproduction now occupies 123,048 characters, retains nineteen recent history entries and restores its exact current answers. Legacy sessions below the new one-million-character input limit can migrate from the former size/count limits. This does not provide recovery after tab closure, cleared browser storage or a storage quota failure.

Conditional conflicts now use the actual imported condition IDs. A conflicting detail is preserved for explicit correction and prevents reviewed-PDF status. Cyclic and unreachable conditions are rejected before import/recovery. The question-list review explains conditional requirements. Speech-constructor failures pause with recovery guidance; a failed browser cancellation cannot prevent local teardown. Leaving the tab pauses voice mode and does not automatically restart it. Speech failures are deterministic injected checks, not actual phone failures or a new microphone study.

Visible browser controls rejected a cyclic manual proposal while retaining a pre-existing fictional answer. The corrected proposal showed its conditional requirement and was approved as a manually labelled form. Sixty long detail corrections were entered and confirmed through the actual UI; after reload the manual form, fictional name and final 2,972-character detail were intact. Changing the parent to No disabled review acknowledgement while preserving the detail and offering only draft status. Explicitly clearing that detail removed the conflict and allowed PDF preparation. Keyboard Shift-Tab wrapped within the proposal dialog. No model call or paid service was used; the arbitrary JSON is an authored fixture, not new model evidence.

Nine new automated checks cover these regressions and legacy migration, including actual reviewed-versus-draft PDF output. All 107 checks pass. See evidence/reliability-hardening-check.json. No new downloaded browser bytes or measured usability result is claimed.

## PDF download recovery

A later private Android screenshot showed a dynamic-module fetch error at PDF generation. A missing or unreachable lazy PDF-engine chunk is established by the message; deployment/cache skew is a possible cause, not a confirmed phone-network diagnosis. The PDF engine now imports with the app rather than at export time. PDF errors omit internal asset URLs, and a reload recovery control saves the current confirmed session before reloading, refusing to reload if storage fails. Final-review acknowledgement still resets after reload.

Two new automated checks cover actionable errors without leaking asset URLs and a genuine reviewed PDF with the optional contact email unanswered. Existing real-export and failed-font retry checks still pass. Visible preview controls completed the required fictional answers, produced the reviewed PDF Save/Open links with optional fields blank and restored the confirmed answers on reload. The browser's download event and persistent-link capture both timed out; no newly downloaded bytes or actual phone retest are claimed. A typed “alex A-T example dot com” transcript still proposed alex@example.com for confirmation.

After the focused same-tab refresh and download instructions, the tester reported that the repaired PDF worked on the phone. This is a tester-reported phone download pass; no new agent-captured phone file or separate reopening confirmation was supplied. The private phone image and its values remain excluded from public source and evidence. Fully hands-free completion remains unverified.

## Reported phone review and email dictation correction

The tester reported that the phone review worked. Private Android screenshots showed confirmed answers, matching linked home-address rows, a separate landlord address, final-review acknowledgement and prepared PDF Save/Open links. The tester reported one manual intervention: email dictation spelled “at” instead of inserting @. These screenshots contain personal information and are not included in public evidence. This report does not establish a fully hands-free session or that this particular phone PDF was saved and reopened.

Email fields now convert standalone “at,” “AT,” “A-T,” “A T,” “at sign” and “dot” separators, including mixed actual symbols and spoken words. This applies equally to application speech and phone keyboard dictation. It preserves valid addresses and case, does not rewrite other field types or join arbitrary words, and rejects ambiguous/incomplete addresses. Email preparation bypasses optional model interpretation. The visible/spoken proposal uses the converted address and still requires confirmation.

Five new regression tests cover the reported variants, typed-address preservation, field isolation, rejection without modifying saved answers, and confirmation/restoration/export. Browser UI checks with fictional transcripts verified the converted proposal, cancellation and confirmation; no actual microphone recognition is claimed for that browser check. A phone retest of the email fix, a fully hands-free session and quantitative usability testing remain pending.

## Actual source-type development cases

| Version / model | Case | Matched question types | Validator | CPU elapsed |
| --- | --- | --- | --- | --- |
| v11 / 1B | Seed exchange | 4 / 4 | Accepted | 73,032 ms |
| v11 / 1B | Bicycle repair | 5 / 8 | Structurally accepted; semantic failure | 54,978 ms |
| v13 / 1B, per question | Bicycle repair | 2 / 8 | Rejected | 56,818 ms |
| v14 / 3B, per question | Bicycle repair | 8 / 8 | Accepted | 162,825 ms |

The v12 main-app attempt was rejected for treating a title as a question; only its visible UI outcome was preserved. No raw response or latency is claimed for that attempt. Other exact responses, prompts and scoring records are in evidence/local-meta. The cases were used during development; this table is not a held-out benchmark, overall accuracy estimate or generalization claim. Source-derived wording, flags/pages and exact-label links are application work, not model outputs.

The successful 3B contract asks for one question type per model call. The first explicit fictional title is source metadata. Each response is retained unchanged in `calls`; the assembled field map is separately labelled. Current UI question proposals use 3B. The smaller model remains available for earlier answer experiments and is not offered for question extraction.

## Actual complete 3B-to-PDF browser journey

The checked eight-row schema was approved before replacing the current form. Morgan Example, morgan@example.invalid and 2026-11-02 were confirmed. A separate real 3B answer request interpreted “zero dollars” as 0 in 95,032 ms; it remained a proposal until confirmed. The description and distinct home/workshop addresses were confirmed using direct controls. A later 100-to-101 Practice Street correction showed both old/new linked values and changed only those two home rows. The workshop remained 900 Separate Venue Road.

All seven distinct facts were reviewed and acknowledged before the actual PDF download. `browser-3b-reviewed-answer-record.pdf` is that unchanged one-page download. pypdf checks found all expected values, exactly two corrected home addresses, the unchanged workshop address, zero budget and no old home address. Its rendered page was visually inspected: no clipping, overlap or footer collision. Raw extraction/answer receipts and PDF QA metadata are preserved alongside it.

This was typed browser QA. It does not establish a completed phone voice journey, a measured accessibility benefit or GPU performance. 3B is a separately consented 2.02 GB download and CPU inference is slow. General extraction remains experimental; detected unsupported constraints and explicit type conflicts fail closed. Earlier failures are retained rather than counted as successes.

The existing entry was updated with the five revised narrative fields and verified after a fresh reload: every field matched the prepared text, the update control was disabled with no unsaved changes, and the original permission remained checked. Track/theme/participant were retained. No duplicate or new permission grant was submitted. No money was spent.

---

# Historical evaluation before the 3B browser run


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
