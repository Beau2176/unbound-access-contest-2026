# Updated competition walkthrough

Current edit: 170.2 seconds (2:50), 1920×1080, 25 fps, H.264/AAC, stereo 48 kHz. This edited video uses actual app images, source-derived evidence graphics, and the unchanged one-page PDF from the earlier actual 3B browser workflow. It is not continuous voice capture or a new inference run.

The sequence shows the successful 3B eight-type development case and separate zero-dollar answer, the failed 1B comparison, model versus application-derived metadata, explicit confirmation, isolated linked-address correction and reviewed export. New app images replay the preserved schema through manual import with fictional answers; their on-screen labels identify the replay. The PDF comes from docs/evidence/local-meta/browser-3b-reviewed-answer-record.pdf, whose SHA256 is checked before rendering. These model results are development examples, not held-out accuracy benchmarks.

Narration uses the established generic offline FFmpeg/libflite slt voice. There is no cloning, paid synthesis, provider upload or new inference. Complete phrases are synthesized at native speed and measured; picture intervals add only short breathing gaps. There is no speech acceleration or target-runtime padding. The complete mix is normalized once, then encoded. No music or effects compete with the voice.

Captions follow exact synthesis inputs and measured full-phrase intervals. They are burned in; disable the SRT when watching the MP4 to avoid duplicated text. No independent listening or speech-recognition alignment was available. All 22 encoded visual states, 42 cut-boundary frames, full decoding, caption layout/timing and measured loudness were checked. These checks do not establish pleasant audible delivery or a fully hands-free phone session.

## Reproduce

Requirements: Python 3, Pillow, NumPy for QA, FFmpeg with flite/libx264/AAC, and Poppler pdftoppm. Source assets and actual receipts are in the public source project. Fonts and dependencies retain their notices.

```sh
python3 demo/render_v2.py --prepare-audio
python3 demo/render_v2.py
```

The render writes public/artifacts/unbound-access-demo-v2.mp4, demo/timeline.json, demo/transcript.txt, demo/captions.srt, and ignored audio/frames under demo/work/v2/. The movie is also copied to the original unbound-access-demo.mp4 path so the saved contest entry still reaches it. sequence-v2.json is the editable script/cue list. The timeline records source-to-final mapping, metadata, hashes, phrase timing and verification limits. docs/evidence/video-v2-qa.json records final encode checks.

render.py is retained as the legacy renderer, not the production command. The original movie remains in Site/Git history. Project assets/code are MIT; font/library/model notices remain in THIRD_PARTY_NOTICES.md. The generic narration is not Boyd's voice.
