"""Render an edited, narrated app walkthrough. Requires Pillow and FFmpeg with flite."""
from pathlib import Path
import json, math, subprocess, wave, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageOps
ROOT=Path(__file__).resolve().parent
ASSETS=ROOT/'assets'; WORK=ROOT/'work'; WORK.mkdir(exist_ok=True)
FONT=ROOT.parent/'public/fonts/DejaVuSans.ttf'
W,H,FPS=1920,1080,25
BG='#102f34'; INK='#f3f6ef'; ACCENT='#9fe0c6'
font=lambda n:ImageFont.truetype(str(FONT),n)
def run(args): return subprocess.run(args,check=True,capture_output=True,text=True)
def probe(p): return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]).stdout)
def lines(text,width,f):
 out=[]; line=''
 for word in text.split():
  test=(line+' '+word).strip()
  if f.getlength(test)>width and line: out.append(line);line=word
  else:line=test
 if line:out.append(line)
 return out
# Source-derived evidence graphics. These are summaries of preserved receipts, not UI.
card=Image.new('RGB',(1348,926),'#f3f6ef');d=ImageDraw.Draw(card)
d.text((65,55),'REAL META INFERENCE',font=font(36),fill=BG)
d.text((65,115),'Llama 3.2 1B Instruct · browser CPU',font=font(29),fill=BG)
rows=[('CLEAR INPUT','three people → 3; zero dollars → 0; No → No'),('MODEL FAILURE','uncertain count → guessed 3'),('CURRENT GUARD','rejects unsupported / uncertain values'),('EXTRACTION FAILURE','required flags failed source validation')]
for i,(title,body) in enumerate(rows):
 y=230+i*135;d.text((65,y),title,font=font(26),fill='#176e58');d.text((65,y+48),body,font=font(29),fill=BG)
d.text((65,830),'Source-derived summary · unchanged run receipts in repository',font=font(23),fill=BG)
card.save(ASSETS/'meta-receipt.png')
card=Image.new('RGB',(1348,926),'#f3f6ef');d=ImageDraw.Draw(card)
d.text((70,65),'EVIDENCE AND LIMITS',font=font(38),fill=BG)
notes=['86 automated checks passed','Actual typed form → downloaded two-page PDF','One basic phone check reported','Full phone dictation / timed usability: unverified','Hosted AI: not configured; CPU inference: slow','Fictional data only · nothing submitted']
for i,t in enumerate(notes):d.text((70,180+i*105),t,font=font(29),fill=BG)
card.save(ASSETS/'evidence-card.png')
# Both pages are renders of the actual browser-downloaded PDF, not a fixture.
canvas=Image.new('RGB',(1348,926),'#dce4df');d=ImageDraw.Draw(canvas)
d.text((40,18),'ACTUAL BROWSER DOWNLOAD · TWO-PAGE REVIEWED RECORD',font=font(25),fill=BG)
for i in (1,2):
 pdf=Image.open(ASSETS/f'pdf-{i}.png').convert('RGB');pdf.thumbnail((625,830));canvas.paste(pdf,(25+(i-1)*670+(625-pdf.width)//2,70))
canvas.save(ASSETS/'pdf-output.png')
# Each phrase is synthesized independently at native speed, then measured.
# Captions follow the measured whole-phrase interval; no word-level timing is fabricated.
cues=[('hero', 'Small print, repeated facts, and too much typing can make paperwork exhausting. Unbound Access takes one question at a time.'), ('hero', 'Large controls and read aloud support spoken or typed answers. The person reviews every change and keeps control of the record.'), ('answer-review', 'This edited walkthrough uses actual app screens, fictional typed data, and generic synthetic narration. It is not continuous voice capture.'), ('answer-review', 'An answer is only a proposal. Cancel leaves saved answers unchanged. Confirm moves to the next question.'), ('number-limit', 'The prepared form says household size must be one through twelve. Thirteen is rejected before it can be saved.'), ('number-limit', 'Two is accepted. Zero dollars is also a valid income answer, rather than being mistaken for a missing value.'), ('conditional', 'Answer Yes to access support and the required follow up appears. Here the fictional request is questions read aloud.'), ('linked-correction', 'Now correct the home address from forty to forty one Practice Street. The app shows both linked fields and their previous values.'), ('linked-correction', 'Confirmation updates both home answers together. The separate landlord address stays ninety Venue Lane. Shared facts do not cross different people.'), ('pdf-ready', 'Review the source linked answers, acknowledge the review, and download the PDF. Persistent Save and Open links allow another attempt.'), ('pdf-output', 'These are both pages of the actual browser downloaded file. The corrected addresses and zero income survived export and were checked.'), ('pdf-output', 'This is a readable answer record, not a filled original agency form. Nothing is signed or submitted.'), ('meta-receipt', 'Built with Llama. Optional Meta Llama three point two, one billion parameters, runs genuine inference inside the browser through w llama.'), ('meta-receipt', 'The revised development run correctly interpreted three clear answers: three people, zero dollars, and No. Its unchanged raw outputs are preserved.'), ('meta-receipt', 'It also guessed three when the input was uncertain. The current source guard rejects that guess. This is not a model success.'), ('meta-receipt', 'Question extraction failed required flag validation. General extraction remains experimental and unreliable. Prepared forms and direct controls remain available.'), ('evidence-card', 'The optional model download is about eight hundred eight megabytes, with explicit consent and removal controls. CPU inference is slow.'), ('evidence-card', 'No API key, card, or paid fallback is needed. Local model tasks stay in the browser; browser speech may use a remote service.'), ('evidence-card', 'Eighty six automated checks passed. The complete typed browser journey and downloaded PDF were verified separately from model quality.'), ('evidence-card', 'One tester reported phone audio, microphone, and sample PDF opening. Full phone dictation, timed usability, and GPU offload remain unverified.'), ('hero', 'Try the working form, inspect real inference receipts, and read the public source. Every confirmed answer remains yours to review.')]
caption_events=[];timeline=[]; elapsed=0;source_manifest=[]
for i,(asset,text) in enumerate(cues):
 asset_path=ASSETS/(asset+'.png' if asset in ['meta-receipt','evidence-card','pdf-output'] else 'unbound-demo-'+asset+'.png')
 if not asset_path.exists():raise FileNotFoundError(asset_path)
 original=Image.open(asset_path).convert('RGB');source_manifest.append({'asset_id':asset,'path':str(asset_path.relative_to(ROOT)),'width':original.width,'height':original.height,'role':'actual app screenshot' if asset.startswith(('hero','answer','choice','source','number','conditional','linked','review','pdf-ready')) else 'source-derived receipt summary / actual browser-download PDF'})
 text_path=WORK/f'{i:02}.txt';text_path.write_text(text)
 wav=WORK/f'{i:02}.wav'
 run(['ffmpeg','-nostdin','-y','-v','error','-f','lavfi','-i',f'flite=textfile={text_path}:voice=slt','-ar','48000','-ac','1',str(wav)])
 with wave.open(str(wav)) as f: audio_seconds=f.getnframes()/f.getframerate()
 frames=math.ceil((audio_seconds+0.30)*FPS);duration=frames/FPS
 frame=Image.new('RGB',(W,H),BG); draw=ImageDraw.Draw(frame)
 draw.text((45,28),'UNBOUND ACCESS',font=font(25),fill=ACCENT)
 draw.text((1430,28),f'{i+1:02} / {len(cues):02}',font=font(24),fill=ACCENT)
 # The image remains intact and uniformly scaled inside a fixed evidence region.
 fit=ImageOps.contain(original,(1280,880),Image.Resampling.LANCZOS)
 frame.paste(fit,(35+(1280-fit.width)//2,95+(880-fit.height)//2))
 primary=font(40);wrapped=lines(text,505,primary)
 y=365-len(wrapped)*25
 for line in wrapped:draw.text((1370,y),line,font=primary,fill=INK);y+=57
 draw.text((1370,940),'Edited app walkthrough',font=font(22),fill=ACCENT)
 draw.text((1370,974),'Fictional data · typed input',font=font(21),fill=ACCENT)
 png=WORK/f'{i:02}.png';frame.save(png)
 clip=WORK/f'{i:02}.mp4'
 run(['ffmpeg','-nostdin','-y','-v','error','-loop','1','-framerate',str(FPS),'-i',str(png),'-i',str(wav),'-filter_complex',f'[1:a]apad=whole_dur={duration},loudnorm=I=-16:TP=-1.5:LRA=7[a]','-map','0:v:0','-map','[a]','-t',str(duration),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-ar','48000','-ac','2','-video_track_timescale','25000',str(clip)])
 caption_events.append({'start':elapsed,'end':elapsed+audio_seconds,'text':text,'mode':'subtitle','timing':'measured full synthesized phrase; no independent transcript alignment'})
 timeline.append({'asset_id':asset,'source_in':0,'source_out':audio_seconds,'sequence_start':elapsed,'sequence_end':elapsed+duration,'speech_end':elapsed+audio_seconds,'audio_owner':f'work/{i:02}.wav','still_image':str(asset_path.relative_to(ROOT)),'frames':frames,'playback_rate':1.0})
 elapsed+=duration
 print(json.dumps({'scene':i+1,'seconds':round(duration,2),'total':round(elapsed,2)}),flush=True)
if elapsed>179:raise ValueError(f'Demo too long: {elapsed}')
# Keep the final actual app screen readable through the end of the three-minute slot.
pad_frames=max(0,round((179-elapsed)*FPS))
if pad_frames:
 last=WORK/f'{len(cues)-1:02}.mp4'; extended=WORK/'extended.mp4'
 run(['ffmpeg','-nostdin','-y','-v','error','-i',str(last),'-vf',f'tpad=stop_mode=clone:stop_duration={pad_frames/FPS}','-af',f'apad=pad_dur={pad_frames/FPS}','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-ar','48000','-ac','2','-video_track_timescale','25000',str(extended)])
 extended.replace(last);timeline[-1]['sequence_end']+=pad_frames/FPS;timeline[-1]['frames']+=pad_frames;elapsed+=pad_frames/FPS

concat=WORK/'concat.txt';concat.write_text(''.join(f"file '{i:02}.mp4'\n" for i in range(len(cues))))
out=ROOT.parent/'public/artifacts/unbound-access-demo.mp4'
run(['ffmpeg','-nostdin','-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-map','0:v:0','-map','0:a:0','-c','copy','-movflags','+faststart',str(out)])
run(['ffmpeg','-nostdin','-v','error','-i',str(out),'-f','null','-'])
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(ROOT/'captions.srt').write_text(''.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}\n\n' for i,c in enumerate(caption_events)))
(ROOT/'timeline.json').write_text(json.dumps({'fps':FPS,'size':[W,H],'audio_sample_rate':48000,'voice':'FFmpeg libflite slt, offline generic synthetic voice','listening_review':'not_performed','review_limit':'Frames, stream metadata and full decode checked. Audible quality and speech recognition were not independently checked.','target_seconds_max':180,'measured_sequence_seconds':elapsed,'events':timeline,'captions':caption_events,'assets':source_manifest,'output_probe':probe(out)},indent=2)+'\n')
(ROOT/'transcript.txt').write_text('\n\n'.join(t for _,t in cues)+'\n')
print(json.dumps({'output':str(out),'duration_seconds':probe(out)['format']['duration'],'bytes':out.stat().st_size}),flush=True)
