export default function PrivacyPage() {
  return <main className="local-meta-check">
    <a href="/">← Back to paperwork</a><h1>Your data in this prototype</h1>
    <p>UNBOUND Access is a fictional-data demonstration by UNBOUND FORGEWORKS LLC. Use made-up examples. Do not enter protected health information, payment-card details, identity documents or other sensitive records.</p>
    <h2>Answers and documents</h2>
    <p>The app reads selected text-based PDFs in your browser. Confirmed answers, the current form and correction history are saved in this tab’s session storage so a refresh can restore your place. Clear session removes that app session. Downloaded PDFs remain wherever you saved them; delete those files separately if needed. The app does not sign or send forms.</p>
    <h2>Optional on-device Meta AI</h2>
    <p>Loading this option downloads model files from Hugging Face and the AI runtime from this site. Those services receive the ordinary network information involved in downloading files. The model processes the fictional source text and answers in your browser. The app does not send that text to an inference server in this mode.</p>
    <p>Downloaded model files can remain in this browser’s cache. Remove downloaded model deletes this app’s cached model. Turning the model off frees its running instance; your form answers are separate. Where persistent storage is unavailable, the model is held temporarily in memory instead. Browser storage settings can also remove cached files.</p>
    <p>AI run receipts contain the fictional input, model output, timing and validation result. They stay in the current page’s memory unless you choose to download them. Clear session in the paperwork app also clears that page’s receipts. Another open tab has its own memory.</p>
    <h2>Voice and hosted AI</h2>
    <p>Your browser’s speech recognition may send microphone audio to its own speech provider. Browser voice is not represented as offline processing. Pause stops this app’s listening session. You can use typed controls instead and manage microphone permission in your browser.</p>
    <p>The separate hosted Meta adapters require a configured server key and explicit fictional-data consent. When available and chosen, they send the selected source or answer to the named provider. They have no key configured in this release. A manual playground link opens a separate provider website with its own terms and data handling.</p>
    <h2>Hosting and control</h2>
    <p>OpenAI hosts this site. Hosting, access checks, operational logs and any platform sign-in are governed by OpenAI’s applicable terms and privacy information. This app does not add an advertising tracker, payment form or server-side answer database. This page describes the prototype’s implementation; it is not a claim that the prototype is approved for handling real sensitive records.</p>
    <p><a href="https://openai.com/policies/chatgpt-sites-terms/">ChatGPT Sites Terms</a> · <a href="https://openai.com/policies/privacy-policy/">OpenAI Privacy Policy</a></p>
  </main>;
}
