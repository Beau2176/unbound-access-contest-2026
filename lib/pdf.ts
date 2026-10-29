import type { FormDefinition, Session } from "./access.ts";
import { exportRows, issues } from "./access.ts";
// Load the PDF engine with the app. A tab kept open across a deployment must
// not discover an obsolete, lazy-loaded JS chunk only when saving its answers.
import { jsPDF } from "jspdf";

export function pdfFailure(error: unknown): { message: string; reload: boolean } {
  const detail = error instanceof Error ? error.message : "";
  if (/dynamically imported module|Importing a module script failed|Failed to load module script|Loading chunk .+ failed|ChunkLoadError/i.test(detail)) {
    return { message: "The PDF tools could not load. Reload this tab to get the latest app, then review and download again. Your confirmed answers will be kept in this tab.", reload: true };
  }
  if (detail.startsWith("The PDF font could not load.")) return { message: detail, reload: false };
  return { message: "The PDF could not be created. Your confirmed answers are unchanged. Check your connection and try the download again.", reload: false };
}
export async function makeDocument(fontBytes: Uint8Array) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let binary = ""; for (let i = 0; i < fontBytes.length; i += 8192) binary += String.fromCharCode(...fontBytes.subarray(i, i + 8192));
  doc.addFileToVFS("DejaVuSans.ttf", btoa(binary)); doc.addFont("DejaVuSans.ttf", "Access", "normal"); doc.setFont("Access", "normal");
  doc.setProperties({ title: "UNBOUND Access answer record", author: "UNBOUND Access", creator: "UNBOUND Access" });
  let y = 22;
  const write = (text: string, size = 13, color = "#18343d") => {
    doc.setFontSize(size); doc.setTextColor(color);
    for (const line of doc.splitTextToSize(text, 170) as string[]) { if (y > 270) { doc.addPage(); y = 22; } doc.text(line, 20, y); y += size * .49; }
    y += 3;
  };
  const finish = () => { const n=doc.getNumberOfPages(); for(let p=1;p<=n;p++){doc.setPage(p);doc.setFontSize(9);doc.setTextColor("#607268");doc.text(`UNBOUND Access | Fictional practice only | ${p} / ${n}`,20,285);}return doc; };
  return { write, finish };
}
async function font() { try{const r=await fetch("/fonts/DejaVuSans.ttf");if(!r.ok)throw new Error("Font unavailable");return new Uint8Array(await r.arrayBuffer());}catch{throw new Error("The PDF font could not load. Your answers are preserved. Check your connection and try the PDF download again.");} }
export async function reviewDocument(session: Session, reviewed: boolean, bytes: Uint8Array) {
  const {write,finish}=await makeDocument(bytes), checks=issues(session), complete=reviewed&&checks.length===0;
  write("UNBOUND Access",21);write(session.form.title,16);write(complete?"REVIEWED ANSWER RECORD":"INCOMPLETE DRAFT - REVIEW REQUIRED",12,complete?"#176e58":"#9a4b21");
  write("Fictional practice form. This is an answer record for review, not a completed original agency form. Nothing has been submitted.",10);
  if(checks.length){write("Unresolved questions",14);for(const c of checks)write(`• ${c.message}`,11);}
  for(const row of exportRows(session)){write(row.label,12,"#607268");write(row.value,14);write(`Source: page ${row.page} · ${row.source}`,9,"#607268");}
  return {doc:finish(),complete};
}
export async function prepareReviewDownload(session:Session,reviewed:boolean){const {doc,complete}=await reviewDocument(session,reviewed,await font());return {blob:doc.output("blob"),fileName:`UNBOUND_Access_${complete?"Reviewed":"Incomplete_Draft"}.pdf`,complete};}
export async function downloadSource(form:FormDefinition){const {write,finish}=await makeDocument(await font());write(form.title,21);write("FICTIONAL PRACTICE FORM",12,"#176e58");write(form.sourceText,12);finish().save(`UNBOUND_Access_${form.id}.pdf`);}
export async function extractPdfText(file:File){
  if(file.size>5*1024*1024)throw new Error("Use a PDF smaller than 5 MB.");
  const pdfjs=await import("pdfjs-dist");pdfjs.GlobalWorkerOptions.workerSrc="/pdf.worker.min.mjs";
  const doc=await pdfjs.getDocument({data:await file.arrayBuffer(),isEvalSupported:false,useSystemFonts:true}).promise;
  try{if(doc.numPages>10)throw new Error("Use a text-based PDF with 10 pages or fewer.");const pages=[];
    for(let p=1;p<=doc.numPages;p++){const content=await(await doc.getPage(p)).getTextContent();pages.push(`[Page ${p}]\n`+content.items.map(i=>"str"in i?i.str+(i.hasEOL?"\n":" "):"").join(""));}
    const text=pages.join("\n\n");if(text.replace(/\[Page \d+\]/g,"").trim().length<30)throw new Error("This PDF has too little selectable text. Scans and handwriting are not supported.");if(text.length>16000)throw new Error("Use a shorter form: up to 16,000 text characters.");return text;
  }finally{await doc.destroy();}
}
