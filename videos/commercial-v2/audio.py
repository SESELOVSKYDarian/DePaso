import asyncio,json,subprocess,sys,wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'tools/python'))
import edge_tts
SR=48000;DURATION=35.2
def run(a):return subprocess.run(a,check=True,capture_output=True)
def decode(path,filters=None):
    args=['ffmpeg','-v','error','-i',str(path)]
    if filters:args+=['-af',filters]
    return np.frombuffer(run(args+['-f','f32le','-ar',str(SR),'-ac','2','pipe:1']).stdout,np.float32).reshape(-1,2)
def write(path,a):
    with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setframerate(SR);w.setsampwidth(2);w.writeframes((np.clip(a,-.99,.99)*32767).astype('<i2').tobytes())
def stamp(t):
    m=round(t*1000);return f'{m//3600000:02}:{m//60000%60:02}:{m//1000%60:02},{m%1000:03}'
async def main():
    shots=json.loads((ROOT/'src/shots.json').read_text(encoding='utf8'));out=ROOT/'public/audio';out.mkdir(exist_ok=True)
    n=round(DURATION*SR);voice=np.zeros((n,2),np.float32);captions=[];timing=[]
    for s in shots:
        p=out/f'{s["id"]}.mp3';j=p.with_suffix('.json')
        cached=json.loads(j.read_text(encoding='utf8')) if j.exists() else []
        norm=lambda text:''.join(c for c in text.lower() if c.isalnum())
        if not(p.exists() and j.exists() and p.stat().st_size>500 and norm(' '.join(w['text'] for w in cached))==norm(s['voice'])):
            words=[]
            with p.open('wb') as target:
                async for c in edge_tts.Communicate(s['voice'],'es-AR-TomasNeural',rate='+12%',boundary='WordBoundary').stream():
                    if c['type']=='audio':target.write(c['data'])
                    elif c['type']=='WordBoundary':words.append({'text':c['text'],'start':c['offset']/1e7,'duration':c['duration']/1e7})
            j.write_text(json.dumps(words,ensure_ascii=False),encoding='utf8')
        duration=float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p)]).stdout)
        speed=max(1,duration/(s['duration']/30-.2));pcm=decode(p,f'atempo={speed},loudnorm=I=-17:TP=-2:LRA=7')
        start=s['from']/30+.06;a=round(start*SR);b=min(n,a+len(pcm));voice[a:b]+=pcm[:b-a]
        timing.append({'id':s['id'],'duration':duration,'speed':speed,'from':s['from'],'end':start+len(pcm)/SR})
        words=json.loads(j.read_text(encoding='utf8'))
        for k in range(0,len(words),5):
            ww=words[k:k+5];a=start+ww[0]['start']/speed;b=min((s['from']+s['duration'])/30-.03,start+(ww[-1]['start']+ww[-1]['duration'])/speed+.06)
            captions.append({'from':round(a*30),'to':round(b*30),'text':' '.join(w['text'] for w in ww)})
        print('voice',s['id'],round(duration,2),'speed',round(speed,2),flush=True)
    # Locate the 150 BPM phase in the existing licensed track, rather than assume its first sample is a beat.
    musicSource=ROOT.parent/'assets/audio/cipher.oga';full=decode(musicSource,'loudnorm=I=-29:TP=-7:LRA=8')
    short=full[:30*SR].mean(axis=1);blocks=np.pad(short,(0,(-len(short))%480)).reshape(-1,480)
    rms=np.sqrt((blocks**2).mean(axis=1));transient=np.maximum(np.diff(rms,prepend=rms[0]),0)
    scores=[]
    for phase in range(40):scores.append(sum(float(transient[i]) for i in range(phase,len(transient),40)))
    phase=int(np.argmax(scores))*.01;start=8+phase;music=full[round(start*SR):round(start*SR)+n].copy()
    fade=np.minimum(np.arange(n)/SR/.08,1)*np.minimum((n-np.arange(n))/SR/.9,1);music*=fade[:,None]
    fxdir=Path('C:/Users/Usuario/.agents/skills/media-use/audio/assets/sfx')
    cues=[(0.04,'whoosh.mp3',.12),(3.2,'whoosh.mp3',.09),(6.4,'impact-bass-1.mp3',.13),(8,'whoosh.mp3',.1),(17.6,'whoosh.mp3',.11),(24.83,'whoosh.mp3',.08),(32,'impact-bass-2.mp3',.11)]
    for t,filename,gain in cues:
        pcm=decode(fxdir/filename);a=round(t*SR);b=min(n,a+len(pcm));voice[a:b]+=pcm[:b-a]*gain
    write(out/'voice-sfx.wav',voice);write(out/'music.wav',music)
    (ROOT/'src/captions.json').write_text(json.dumps(captions,ensure_ascii=False,indent=2),encoding='utf8')
    (ROOT/'out/voice-timing.json').write_text(json.dumps(timing,indent=2),encoding='utf8')
    (ROOT/'out/beat-grid.json').write_text(json.dumps({'bpm':150,'phaseSeconds':phase,'musicSourceOffset':start,'shotFrames':[s['from'] for s in shots],'framePeriod':12,'phaseMethod':'10ms RMS positive-difference energy, phase maximum over 30 s'},indent=2),encoding='utf8')
    (ROOT/'out/depaso-commercial-dark.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["from"]/30)} --> {stamp(c["to"]/30)}\n{c["text"]}' for i,c in enumerate(captions))+'\n',encoding='utf8')
asyncio.run(main())
