# Third-party components

Original application code and fictional sample forms were created during the event, starting October 27, 2026, under Boyd Koehler's direction with an OpenAI coding assistant. The existing commercial UNBOUND AI repositories were not modified or copied into this project.

The project starts with the supplied Sites Vinext starter. Its runtime, authentication helpers, connector scaffolding, UI primitives, build scripts and associated packages are reused infrastructure, not original contest claims. Existing embedded notices and license files are retained.

- React / React DOM: MIT.
- Vinext and the supplied Sites integration: retain their package/source notices.
- Lucide icons: ISC.
- Tailwind CSS and shadcn-related components: MIT; retained vendor notices are included.
- Zod: MIT.
- jsPDF 4.2.1: MIT. License copied to public/licenses/jspdf.txt.
- PDF.js 5.6.205: Apache-2.0. License copied to public/licenses/pdfjs.txt; the worker is vendored at public/pdf.worker.min.mjs for same-origin loading.
- DejaVu Sans font: Bitstream Vera/DejaVu terms in public/fonts/LICENSE.txt.

- wllama and wllama-compat 3.8.1: MIT; WebAssembly runtime assets are copied from the pinned npm packages during build. llama.cpp and bundled dependencies retain their upstream notices.
- Optional Meta Llama 3.2 1B Instruct: downloaded directly from the pinned hugging-quants GGUF redistribution only after opt-in. Built with Llama. The model uses the Llama 3.2 Community License, not the project's MIT license; see public/artifacts/LLAMA-3.2-LICENSE.txt and the upstream model card/acceptable-use policy. No model weights are committed or included in the source download.

Hosted model/provider use has separate terms. No stock imagery, real applications, personal records, testimonials or outside voices are included. Demo narration is the generic offline FFmpeg/libflite slt voice; it does not impersonate a real person.
