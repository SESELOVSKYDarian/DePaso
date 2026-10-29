"""Mezcla final con música licenciada y efectos del catálogo HyperFrames."""
import json,subprocess,wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];SR=48000
def run(a):return subprocess.run(a,check=True,capture_output=True)
def decode(path,filters=None):
    a=['ffmpeg','-v','error','-i',str(path)];a+=['-af',filters] if filters else []
    return np.frombuffer(run(a+['-f','f32le','-ar',str(SR),'-ac','2','pipe:1']).stdout,np.float32).reshape(-1,2)
def wav(p,a):
    with wave.open(str(p),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(a,-.99,.99)*32767).astype('<i2').tobytes())
def stamp(t):
    m=round(t*1000);return f'{m//3600000:02}:{m//60000%60:02}:{m//1000%60:02},{m%1000:03}'
films=json.loads((ROOT/'campaign.json').read_text(encoding='utf8'))
music=decode(ROOT/'assets/audio/cipher.oga','loudnorm=I=-26:TP=-4:LRA=7')
whoosh=decode(ROOT/'assets/audio/whoosh.mp3');click=decode(ROOT/'assets/audio/click-soft.mp3')
for name,f in films.items():
    n=f['duration']*SR;mix=np.zeros((n,2),np.float32);bed=music[8*SR:8*SR+n].copy()
    if len(bed)<n:raise ValueError('Music too short')
    # Fade the bed smoothly at the boundaries; all edits remain documented.
    fade=np.minimum(np.arange(n)/SR/.35,1)*np.minimum((n-np.arange(n))/SR/2,1);bed*=fade[:,None]
    if name=='funciones':bed*=.65
    timing=[];captions=[]
    def add(at,data,gain=1):
        a=round(at*SR);b=min(n,a+len(data));mix[a:b]+=data[:b-a]*gain
    for s in f['scenes']:
        p=ROOT/'assets/audio'/f'{name}-{s["id"]}.mp3';dur=float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(p)]).stdout)
        speed=max(1,dur/(s['duration']-.45));start=s['start']+.14
        a=decode(p,f'atempo={speed:.6f},loudnorm=I=-18:TP=-2:LRA=7');add(start,a)
        words=json.loads(p.with_suffix('.json').read_text(encoding='utf8'))
        for j in range(0,len(words),6):
            w=words[j:j+6];t=start+w[0]['start']/speed;end=min(s['start']+s['duration']-.05,start+(w[-1]['start']+w[-1]['duration'])/speed+.08)
            captions.append({'start':t,'end':max(t+.3,end),'text':' '.join(x['text'] for x in w)})
        timing.append({'id':s['id'],'sourceDuration':dur,'speed':speed,'start':start,'end':start+len(a)/SR})
        if s['kind'] in ['brand','end','ui'] and s['id'] not in ['report','access']:add(s['start']+.12,whoosh,.055)
        count=len([s.get(k) for k in ['screen','screen2','screen3'] if s.get(k)])
        for j in range(1,count):add(s['start']+s['duration']*j/count+.03,click,.13)
    mix+=bed
    raw=ROOT/'assets/audio'/f'{name}-premix.wav';wav(raw,mix)
    run(['ffmpeg','-y','-v','error','-i',str(raw),'-af','loudnorm=I=-16:TP=-1:LRA=9','-ac','2','-ar',str(SR),str(ROOT/'assets/audio'/f'{name}-mix.wav')]);raw.unlink()
    (ROOT/'assets/audio'/f'{name}-captions.json').write_text(json.dumps(captions,ensure_ascii=False,indent=2),encoding='utf8')
    (ROOT/'assets/audio'/f'{name}-voice-timing.json').write_text(json.dumps(timing,indent=2),encoding='utf8')
    (ROOT/'exports'/f'depaso-{name}.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(captions))+'\n',encoding='utf8')
    print(name,'mixed with Cipher; maximum voice speed',round(max(x['speed'] for x in timing),2),flush=True)
