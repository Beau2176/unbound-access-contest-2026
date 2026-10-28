# Free Meta access findings - October 28, 2026

Budget: zero dollars out of pocket. No payment method, subscription, top-up, paid inference request, partner claim or new agreement was entered during this work.

## Current candidate and blocker

NVIDIA lists `meta/muse-glimmer-30b` with Free Endpoint Available at https://build.nvidia.com/meta/muse-glimmer-30b/build. Its documented API is https://integrate.api.nvidia.com/v1/chat/completions. An actual unauthenticated catalog fetch returned HTTP 200; the implemented availability check passed on the returned HTML. This verifies the free listing, not account access or inference quality.

The NVIDIA adapter is implemented and tested with stubs. It permits only that exact model and hosted endpoint, checks the free listing before each inference, refuses redirects, uses the documented sampling/reasoning parameters, validates quotes/pages and same-field answers, and has no automatic fallback. It rejects incomplete, pending, malformed, wrong-model and wrong-field responses. Runtime secrets are absent, so the automatic server connection has not made an authenticated inference request.

The owner explicitly approved the NVIDIA API Trial Terms and the Acknowledge & Continue button was clicked. The next sign-in page requires Developer Program enrollment and Technology Access Terms. This remains unfinished: the user's cloud-browser control repeatedly reported that the computer session had ended, including after a fresh tab was created. Do not treat the agent's ability to view the sign-in page as a successful user handoff or completed enrollment. No key was created or configured. Do not request a key in ordinary chat.

## Manual path available

NVIDIA's public Muse Glimmer playground accepted a fictional extraction request without sign-in. That first result displayed nine questions but had empty fact keys and could not be imported from its rendered text. The unedited prompt and DOM-rendered output are retained under docs/evidence/public-playground. A revised development request was queued at the last check. No successful extraction score or API integration is inferred from this attempt.

The app now provides Copy Meta prompt, a public playground link, and Review imported questions. The local import parser checks complete JSON, exact quotes/pages, constraints and shared-fact compatibility before showing an approval screen. It does not verify the response's model/provider; imported forms retain a manual origin label after reload. New forms need a manual copy-and-paste round trip. Prepared forms and guided answers continue working without a key.

The previous OpenRouter route `meta-llama/llama-3.3-70b-instruct:free` remains absent. Its zero-price adapter is retained as an explicit configuration option, with no automatic cross-provider fallback.

Groq's primary deprecation notice says free/developer access to Llama 3.1 8B and Llama 3.3 70B ended August 16, 2026; those models are now enterprise-only there. Do not reuse older free-Llama recommendations without checking current availability.

## Organizer options, not activated

The signed-in participant guide permits Meta Model API and/or Meta open-weight models. It lists these conditional credits:

| Route | Guide offer | Constraint still requiring resolution |
|---|---|---|
| Meta Model API | One hundred fifty dollars per eligible participant | Participants must claim personally. A payment method and temporary preauthorization are required. A spend notification is not a hard cap. This does not meet the current no-card setup constraint. |
| Baseten | One hundred dollars, reviewed for up to two thousand participants | No award, account access, card requirement or enforceable no-charge limit has been verified for this owner. The guide specifies `meta-models/muse-spark-open-1026` for hackathon requests. |
| Modal | One hundred dollars for the first one thousand eligible claimants | Credits are conditional. No owner account, card requirement or no-charge cap has been verified. |
| Fireworks | One hundred dollars per shortlisted team | Selection is conditional. Published Muse inference rates are paid; a free-training promotion is not free inference. |

A grant is not proof of free, unbounded inference. Before replacing the adapter, verify the awarded balance, exact eligible model, account terms, no-payment setup and an enforceable limit preventing charges. Keep credentials server-only. If these cannot be met, preserve practice mode rather than spending money.

## Prepared next engineering step

For automatic server inference, complete NVIDIA account/key actions through a working secure user flow without adding payment information. Configure NVIDIA_API_KEY with META_PROVIDER=nvidia and make bounded fictional API checks. The manual path now includes a separately documented reviewed derivative of the captured public-playground response. It passes the existing source validator after eight disclosed corrections; the original response remains a failed import. Preserve both and do not claim an unchanged model pass. The three basic phone checks were reported passed by Boyd; full-form dictation, permission failures and measured completion time remain unverified.

## Primary sources

- [NVIDIA Muse Glimmer free prototype endpoint](https://build.nvidia.com/meta/muse-glimmer-30b/build).
- [NVIDIA Muse Glimmer API parameters](https://docs.api.nvidia.com/nim/reference/meta-muse-glimmer-30b-infer).
- [NVIDIA model terms and license references](https://docs.api.nvidia.com/nim/reference/meta-muse-glimmer-30b).
- [NVIDIA API Trial Terms](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf).

- [OpenRouter catalogue](https://openrouter.ai/api/v1/models), inspected October 28.
- [OpenRouter provider routing and price controls](https://openrouter.ai/docs/guides/routing/provider-selection).
- [Groq model deprecations](https://console.groq.com/docs/deprecations).
- [Participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details), re-read in the accepted account October 28; partner grants are discretionary.
- [Meta event](https://dev.meta.ai/events/global-hackathon).
- [Meta Muse Spark Open documentation](https://dev.meta.ai/docs/muse-spark-open).
- [Fireworks Muse Spark Open](https://fireworks.ai/models/fireworks/muse-spark-open).
