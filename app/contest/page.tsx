export default function ContestPage() {
  return <main style={{maxWidth:960,margin:"0 auto",padding:"48px 24px",color:"#203b3f",lineHeight:1.6}}>
    <p style={{letterSpacing:2,fontSize:13}}>UNBOUND ACCESS · CONTEST PROTOTYPE</p>
    <h1 style={{fontSize:40,lineHeight:1.15}}>Paperwork at your pace.</h1>
    <p style={{fontSize:20}}>One question at a time. Speak or type, confirm each answer, correct shared facts, and keep a readable PDF answer record.</p>
    <p><a href="/">Open the app →</a> · <a href="/phone-check">Check this phone</a> · <a href="/local-meta">Inspect real Meta inference</a> · <a href="/privacy">Data &amp; privacy</a></p>
    <video controls preload="metadata" style={{width:"100%",borderRadius:12,background:"#112c30"}} src="/artifacts/unbound-access-demo.mp4" aria-label="UNBOUND Access narrated demonstration" />
    <p><a href="/artifacts/unbound-access-demo.mp4" download>Download the demo</a> · <a href="https://github.com/Beau2176/unbound-access-contest-2026" target="_blank" rel="noopener">Public GitHub source</a> · <a href="/artifacts/unbound-access-source.zip" download>Complete source ZIP</a></p>
    <h2>Try the working form path</h2>
    <ol><li>Open the app. The prepared Community Help Intake needs no model download.</li><li>Enter fictional answers and confirm each proposal. Try household size 13, then a valid count; zero income is allowed.</li><li>Answer Yes to access support to reveal its required follow-up.</li><li>Correct the home address. Review both linked changes; the landlord address stays separate.</li><li>Choose Review &amp; download, check your answers and confirm the review, then save the PDF.</li></ol>
    <h2>Built with Llama: real inference, disclosed failures</h2>
    <p>Optional Meta Llama 3.2 1B Instruct runs in your browser through wllama. Its roughly 808 MB download needs opt-in, HTTPS, memory and bandwidth. CPU inference is slow. No API key, card or paid fallback is needed.</p>
    <p>The revised development run correctly interpreted three clear answers: three people, zero dollars and No. It guessed three for an uncertain count; the current input-grounding guard rejects that guess. The source-question attempt failed required-flag validation. General extraction remains experimental and unreliable. Raw receipts and earlier failures are preserved in the source. These few development cases are not an accuracy benchmark or phone performance study.</p>
    <p>The older Muse Glimmer public-playground proposal and a separately reviewed eight-edit derivative are also preserved. Loading the example makes no new AI call. Manual imports cannot verify their actual model/provider. Hosted AI remains unconfigured.</p>
    <h2>Evidence and scope</h2>
    <p>86 automated checks passed. A real typed browser journey completed the form, checked linked corrections and downloaded the reviewed two-page PDF. The edited demo combines actual app screenshots, that downloaded PDF, source-derived evidence cards and generic synthetic narration; it is not continuous voice capture.</p>
    <p>One tester reported phone audio, microphone and saved sample-PDF opening. Full phone dictation, timed usability and GPU offload remain unverified. Fictional data only. This exports an answer record; it does not sign or submit an agency form.</p>
    <p>Product direction: Boyd Koehler, UNBOUND FORGEWORKS LLC. AI-assisted implementation. MIT project code; Llama and dependencies retain their licenses. The original event entry was confirmed submitted October 28, 2026; this is the same evolving project. No organizer eligibility ruling or prize claim is implied.</p>
  </main>;
}
