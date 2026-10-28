export default function ContestPage() {
  return <main style={{maxWidth:960,margin:"0 auto",padding:"48px 24px",color:"#203b3f",lineHeight:1.6}}>
    <p style={{letterSpacing:2,fontSize:13}}>UNBOUND ACCESS · CONTEST PROTOTYPE</p>
    <h1 style={{fontSize:40,lineHeight:1.15}}>Paperwork at your pace.</h1>
    <p style={{fontSize:20}}>One question at a time. Speak or type, confirm each answer, correct shared facts, and keep a readable PDF answer record.</p>
    <p><a href="/">Open the app →</a> · <a href="/phone-check">Check voice and PDF on this phone</a></p>
    <video controls preload="metadata" style={{width:"100%",borderRadius:12,background:"#112c30"}} src="/artifacts/unbound-access-demo.mp4" aria-label="UNBOUND Access narrated demonstration" />
    <p><a href="/artifacts/unbound-access-demo.mp4" download>Download the demo video</a> · <a href="https://github.com/Beau2176/unbound-access-contest-2026" target="_blank" rel="noopener">Browse the public GitHub source</a> · <a href="/artifacts/unbound-access-source.zip" download>Download the complete source code</a></p>
    <h2>Try it in two minutes</h2>
    <ol><li>Open the app and choose <b>Try a different form</b>.</li><li>Choose <b>Try the reviewed Meta workshop example</b>. Read its warning and check the source quotes and repeated-home link before approving.</li><li>Enter fictional answers. Each answer needs confirmation. Use separate home and venue addresses.</li><li>Correct the home address. Both home questions update together; the venue stays separate.</li><li>Open <b>Review &amp; download</b>. Complete required answers, check the review box, then download the PDF.</li></ol>
    <h2>What the Meta demonstration establishes</h2>
    <p>NVIDIA’s public playground identified the model as Meta Muse Glimmer 30B and returned nine proposed questions. Its original proposal failed validation. The captured example includes seven documented identifier corrections and one wording correction, followed by source validation and explicit user review. Loading it makes no new AI request. Manual imports retain their provenance; the app cannot verify a pasted response’s model.</p>
    <p>The automatic server adapter has no API key configured. No live server extraction or AI answer mapping is claimed. Prepared forms and the reviewed example work without that connection. The source package contains the preserved page output, reconstruction, exact edit log, evaluation notes and 79 automated checks.</p>
    <h2>Testing and scope</h2>
    <p>One tester reported working phone audio, microphone, and opening the PDF saved to Downloads. This is a basic device check, not a timed usability study. The edited video uses actual app screens and synthetic narration; typed interaction is shown.</p>
    <p>Fictional data only. Answers stay in this browser tab; the app does not store them on its server. Browser speech may use a remote service. This exports an answer record and does not sign or submit an agency form.</p>
    <p>Product direction: Boyd Koehler, UNBOUND FORGEWORKS LLC. AI-assisted implementation. MIT-licensed project code; included dependencies retain their licenses. The public contest repository is linked above. Final event submission remains pending.</p>
  </main>;
}
