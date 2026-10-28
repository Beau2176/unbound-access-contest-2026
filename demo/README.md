# Narrated app walkthrough

This is an edited sequence of actual application screenshots, two source-derived editorial graphics, and an output from the application's real PDF exporter. It is not a continuous screen recording or a captured voice-input journey. All example answers are fictional.

The screenshots were captured with the approved cloud-browser controls during this session. `workshop-reviewed.pdf` was generated locally by the same `reviewDocument` function using the nine answers shown in the browser; it is not described as a successful cloud-browser download. The phone tester independently reported downloading/opening the sample PDF. The current cloud-browser download-event wait timed out even though the app displayed its persistent Save/Open links.

Narration is generic offline synthetic speech from FFmpeg's libflite `slt` voice. No voice cloning, paid synthesis, external narration upload or paid model inference was used. Caption intervals use actual full-phrase synthesized durations, not invented word timestamps. They follow the synthesis inputs; no independent speech recognition or listening review was available. Captions are burned in; leave the SRT disabled when viewing the MP4 to avoid a duplicate text layer.

## Reproduce

Requirements: the application dependencies, Node 24+, Python 3 with Pillow, FFmpeg with `flite`/`libx264`/AAC, and Poppler `pdftoppm`.

```sh
node --experimental-strip-types scripts/render-demo-pdf.mjs
pdftoppm -png -r 100 demo/assets/workshop-reviewed.pdf demo/assets/pdf
python3 demo/render.py
```

The render writes `public/artifacts/unbound-access-demo.mp4`, phrase captions, transcript, measured timeline, and source/stream metadata. Narration and output remain at 1.0× speed. The scene duration includes a short reading/breath pause; it does not stretch speech to a target duration. Full decode, representative encoded frames, join frames and stream timings are checked. Audible delivery was not independently checked in this environment.

Project-specific assets and code are MIT licensed. Font and dependencies retain their upstream notices. The synthetic voice uses the installed FFmpeg/libflite distribution; no claim is made that it is Boyd's voice.
