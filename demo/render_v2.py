"""Zero-cost competition edit. `--prepare-audio` measures native-speed speech first."""
from pathlib import Path
import argparse, hashlib, json, math, subprocess, wave
from PIL import Image, ImageDraw, ImageFont, ImageOps
ROOT=Path(__file__).resolve().parent
ASSETS=ROOT/'assets';WORK=ROOT/'work'/'v2';WORK.mkdir(parents=True,exist_ok=True)
FONT=ROOT.parent/'public/fonts/DejaVuSans.ttf'
W,H,FPS,SR=1920,1080,25,48000
BG,INK,ACCENT,PAPER='#102f34','#f3f6ef','#9fe0c6','#f7f8f3'
SEQUENCE=json.loads((ROOT/'sequence-v2.json').read_text())
font=lambda n:ImageFont.truetype(str(FONT),n)
def run(args):return subprocess.run([str(a) for a in args],check=True,capture_output=True,text=True)
def probe(p):return json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',p]).stdout)
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def wrap(text,width,f):
    result=[];line=''
    for word in text.split():
        candidate=(line+' '+word).strip()
        if f.getlength(candidate)>width and line:result.append(line);line=word
        else:line=candidate
    if line:result.append(line)
    return result
def card(name,title,rows,footer='Source-derived summary · exact receipts in public source'):
    im=Image.new('RGB',(1500,790),PAPER);d=ImageDraw.Draw(im);d.text((64,42),title,font=font(45),fill=BG);y=150
    for label,body in rows:
        d.text((64,y),label,font=font(27),fill='#176e58');y+=45
        for line in wrap(body,1360,font(36)):d.text((64,y),line,font=font(36),fill=BG);y+=48
        y+=27
    if y>730:raise ValueError(f'Card overflow: {name}')
    d.text((64,744),footer,font=font(23),fill='#5f7074');im.save(ASSETS/name)
def make_graphics():
    evidence=ROOT.parent/'docs/evidence/local-meta'
    one=json.loads((evidence/'attempt-6-v13-sequential-score.json').read_text());three=json.loads((evidence/'attempt-7-v14-3b-extraction-score.json').read_text())
    assert (three['question_types_correct'],three['question_types_total'],three['elapsedMs'])==(8,8,162825)
    assert (one['question_types_correct'],one['question_types_total'])==(2,8)
    receipt=json.loads((evidence/'attempt-7-v14-3b-extraction.json').read_text())['receipts'][0];assert receipt['accepted'] and len(receipt['calls'])==8
    card('v2-model-source.png','One source line → one proposed answer type',[
        ('SOURCE QUESTION','Appointment date YYYY-MM-DD (required)'),('UNCHANGED META RESPONSE',receipt['calls'][2]['raw']),('ROLE','Meta proposes the type; the application keeps the exact source wording.')])
    im=Image.new('RGB',(1500,790),PAPER);d=ImageDraw.Draw(im);d.text((64,42),'Source questions → recorded Meta types',font=font(43),fill=BG)
    labels=['Contact name','Contact email','Appointment date','Repair budget','Describe the bicycle problem']
    for index,(label,call) in enumerate(zip(labels,receipt['calls'][:5])):
        y=160+index*100;d.text((64,y),label,font=font(38),fill=BG);d.text((1100,y),json.loads(call['raw'])['kind'],font=font(38),fill='#176e58')
    d.text((64,744),'Authored development form · exact raw responses preserved separately',font=font(23),fill='#5f7074');im.save(ASSETS/'v2-types.png')
    card('v2-address-types.png','Three address rows, two distinct facts',[
        ('HOME ADDRESS','Type: text · home fact'),('REPEAT THE SAME HOME ADDRESS','Type: text · same home fact'),('WORKSHOP ADDRESS','Type: text · separate workshop fact')],footer='Types: Meta output · fact links: application-derived from explicit source wording')
    for family,score,name in [('1B',one,'v2-score-1b.png'),('3B',three,'v2-score-3b.png')]:
        im=Image.new('RGB',(1500,790),PAPER);d=ImageDraw.Draw(im)
        d.text((64,42),f'Meta Llama 3.2 {family} Instruct',font=font(49),fill=BG)
        d.text((64,127),'Same authored bicycle-repair development form',font=font(29),fill='#5f7074')
        n=score['question_types_correct'];d.text((64,230),f'{n} / 8',font=font(130),fill='#176e58' if n==8 else '#9a4b21')
        d.text((600,265),'Question types matched',font=font(43),fill=BG)
        for i in range(8):d.rectangle((67+i*168,440,207+i*168,510),fill=('#176e58' if n==8 else '#9a4b21') if i<n else '#dce3dd')
        d.text((64,560),'Source validation: '+('accepted' if score['parser_accepted'] else 'rejected'),font=font(37),fill=BG)
        if family=='3B':d.text((64,620),'Recorded CPU extraction: 162.825 seconds',font=font(31),fill=BG)
        d.text((64,744),'Recorded run · one development case, not an independent benchmark',font=font(23),fill='#5f7074');im.save(ASSETS/name)
    card('v2-source-boundaries.png','Source grounding stays explicit',[
        ('META PROPOSES','The answer type for each source question.'),('APPLICATION DERIVES','Exact labels, pages, required flags and explicitly repeated facts.'),('PERSON APPROVES','Every proposed question, link and answer.')])
    qa=json.loads((evidence/'browser-3b-pdf-qa.json').read_text());assert qa['model_answer']['elapsedMs']==95032
    card('v2-zero-receipt.png','Recorded Meta answer call',[
        ('FICTIONAL INPUT','zero dollars'),('UNCHANGED RESPONSE',qa['model_answer']['raw']),('RECORDED CPU TIME','95.032 seconds · proposal still requires confirmation')])
    pdf=evidence/qa['pdf'];assert sha(pdf)==qa['sha256']
    run(['pdftoppm','-singlefile','-png','-r','125',pdf,ASSETS/'v2-actual-3b-pdf'])
    pdf_image=Image.open(ASSETS/'v2-actual-3b-pdf.png').convert('RGB');pw,ph=pdf_image.size
    im=Image.new('RGB',(1500,790),PAPER);d=ImageDraw.Draw(im);d.text((64,30),'Exact detail from the actual downloaded record',font=font(37),fill=BG)
    # Four complete label/value pairs, cropped in PDF point coordinates. Source
    # quote rows are outside these crops; no text is redrawn or spliced within a pair.
    for index,(top,bottom) in enumerate([(445,390),(297,242),(223,168),(149,94)]):
        region=(80,round((841.89-top)*125/72),950,round((841.89-bottom)*125/72))
        cropped=pdf_image.crop(region);fit=ImageOps.contain(cropped,(1372,130));im.paste(fit,(64+(1372-fit.width)//2,120+index*145))
    d.text((64,744),'Exact pixel crops · zero budget, both home copies, separate workshop',font=font(23),fill='#5f7074')
    im.save(ASSETS/'v2-pdf-detail.png')
    card('v2-reliability.png','Recovery without silent answer changes',[
        ('60 LONG CORRECTIONS','Confirmed through the UI; the final answer survived refresh.'),('CONTRADICTORY FOLLOW-UP','Details remain visible. Reviewed status waits for an explicit correction.')],footer='Recorded browser QA · fictional typed input · not a usability study')
    card('v2-check-count.png','107 automated checks passed',[
        ('ENGINEERING CHECKS','State, validation, PDF output, recovery and injected speech failures.'),('SEPARATE QUESTIONS','Model accuracy, real device performance and measured usability.')],footer='Tests are not a model-quality score or a universal accessibility claim')
    card('v2-model-consent.png','Optional model download',[
        ('3B MODEL','2.02 GB · explicit consent and removal controls'),('ZERO-DOLLAR PROTOTYPE','No API key, payment card or paid fallback.'),('DATA PATH','Local AI runs in-browser; browser speech may use its own online service.')])
    card('v2-phone-scope.png','Device evidence stays specific',[
        ('TESTER REPORT','Repaired phone PDF download worked.'),('STILL UNVERIFIED','Fully hands-free completion and measured usability.')],footer='No private phone image or personal answer appears in this video')
def prepare_audio():
    events=[];cursor=0;pcm_parts=[]
    for i,cue in enumerate(SEQUENCE):
        txt=WORK/f'{i:02}.txt';wav=WORK/f'{i:02}.wav';txt.write_text(cue['text'])
        signature=hashlib.sha256((cue['text']+'|flite-slt|48000').encode()).hexdigest();sig=WORK/f'{i:02}.sha256'
        if not wav.exists() or not sig.exists() or sig.read_text()!=signature:
            run(['ffmpeg','-nostdin','-y','-v','error','-f','lavfi','-i',f'flite=textfile={txt}:voice=slt','-ar',SR,'-ac','1','-c:a','pcm_s16le',wav]);sig.write_text(signature)
        with wave.open(str(wav)) as audio:
            assert audio.getframerate()==SR and audio.getnchannels()==1
            samples=audio.getnframes();pcm=audio.readframes(samples)
        frames=math.ceil((samples+round(.18*SR))*FPS/SR);end=cursor+frames
        pcm_parts.append(pcm+b'\0\0'*(frames*(SR//FPS)-samples))
        events.append({**cue,'sequence_start':cursor/FPS,'sequence_end':end/FPS,'start_frame':cursor,'end_frame':end,'speech_end':cursor/FPS+samples/SR,'source_in':0,'source_out':samples/SR,'audio_owner':f'work/v2/{i:02}.wav','playback_rate':1.0,'frames':frames});cursor=end
    duration=cursor/FPS
    if duration>=180:raise ValueError(f'Script is {duration:.2f}s; revise words, never accelerate narration.')
    with wave.open(str(WORK/'narration-master.wav'),'wb') as out:out.setnchannels(1);out.setsampwidth(2);out.setframerate(SR);out.writeframes(b''.join(pcm_parts))
    (WORK/'prepared-timeline.json').write_text(json.dumps(events,indent=2)+'\n')
    print(json.dumps({'prepared_speech_seconds':duration,'words':sum(len(c['text'].split()) for c in SEQUENCE),'scenes':len(events)}),flush=True)
    return events,duration
def stamp(t):
    ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
def render():
    events,duration=prepare_audio();make_graphics();manifest=[];checks=[]
    for i,e in enumerate(events):
        path=ASSETS/e['asset']
        if not path.exists():raise FileNotFoundError(path)
        source=Image.open(path).convert('RGB');original_size=list(source.size)
        if e.get('crop'):source=source.crop(tuple(e['crop']))
        im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
        d.text((70,29),'UNBOUND ACCESS',font=font(25),fill=ACCENT);d.text((70,75),e['chapter'],font=font(32),fill=INK)
        label=e['kind'];d.text((W-70-font(23).getlength(label),34),label,font=font(23),fill=ACCENT)
        fit=ImageOps.contain(source,(1780,720),Image.Resampling.LANCZOS);im.paste(fit,((W-fit.width)//2,140+(720-fit.height)//2))
        f=font(44);caption_lines=wrap(e['text'],1760,f)
        if len(caption_lines)>3:raise ValueError('Caption overflow: '+e['id'])
        for j,line in enumerate(caption_lines):d.text(((W-f.getlength(line))//2,890+j*55),line,font=f,fill=INK)
        still=WORK/f'{i:02}.png';im.save(still)
        run(['ffmpeg','-nostdin','-y','-v','error','-loop','1','-framerate',FPS,'-i',still,'-an','-frames:v',e['frames'],'-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','19','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-video_track_timescale','25000',WORK/f'{i:02}.mp4'])
        manifest.append({'path':str(path.relative_to(ROOT)),'sha256':sha(path),'original_dimensions':original_size,'crop':e.get('crop'),'kind':e['kind']})
        cps=len(e['text'])/(e['speech_end']-e['sequence_start']);checks.append({'id':e['id'],'caption_lines':len(caption_lines),'characters_per_second':round(cps,2),'needs_reading_speed_review':cps>20})
        print(json.dumps({'scene':i+1,'seconds':round(e['sequence_end']-e['sequence_start'],2)}),flush=True)
    concat=WORK/'concat.txt';concat.write_text(''.join(f"file '{i:02}.mp4'\n" for i in range(len(events))))
    run(['ffmpeg','-nostdin','-y','-v','error','-f','concat','-safe','0','-i',concat,'-map','0:v:0','-an','-c','copy',WORK/'picture.mp4'])
    stderr=run(['ffmpeg','-nostdin','-v','info','-i',WORK/'narration-master.wav','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-f','null','-']).stderr
    loudness=json.loads(stderr[stderr.rfind('{'):]);normalization='loudnorm=I=-16:TP=-1.5:LRA=7:linear=true:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}'.format(**loudness)
    out=ROOT.parent/'public/artifacts/unbound-access-demo-v2.mp4'
    run(['ffmpeg','-nostdin','-y','-v','error','-i',WORK/'picture.mp4','-i',WORK/'narration-master.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-af',normalization,'-c:a','aac','-b:a','160k','-ar',SR,'-ac','2','-movflags','+faststart',out])
    run(['ffmpeg','-nostdin','-v','error','-i',out,'-f','null','-']);metadata=probe(out);actual=float(metadata['format']['duration']);assert actual<180 and abs(actual-duration)<.1
    captions=[{'start':e['sequence_start'],'end':e['speech_end'],'text':e['text'],'mode':'subtitle','timing':'Measured synthesized full phrase; no invented word timestamps.'} for e in events]
    (ROOT/'captions.srt').write_text(''.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}\n\n' for i,c in enumerate(captions)))
    (ROOT/'transcript.txt').write_text('\n\n'.join(e['text'] for e in events)+'\n')
    (ROOT/'timeline.json').write_text(json.dumps({'fps':FPS,'size':[W,H],'audio_sample_rate':SR,'style':'Established teal and cream editorial evidence; measured values, hard cuts, no decorative motion.','voice':'FFmpeg libflite slt; generic offline synthesis at native speed','playback_rate':1.0,'listening_review':'not_performed','alignment_limit':'Synthesis inputs and measured phrase intervals; no independent speech-recognition alignment.','target_seconds_max':180,'measured_sequence_seconds':duration,'actual_container_seconds':actual,'events':events,'captions':captions,'assets':manifest,'caption_checks':checks,'input_mix_loudness':loudness,'output_sha256':sha(out),'output_probe':metadata},indent=2)+'\n')
    print(json.dumps({'output':str(out),'duration_seconds':actual,'bytes':out.stat().st_size,'sha256':sha(out)}),flush=True)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--prepare-audio',action='store_true');args=parser.parse_args()
    if args.prepare_audio:prepare_audio()
    else:render()
