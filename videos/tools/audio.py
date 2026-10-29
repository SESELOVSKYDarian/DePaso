"""Genera locución; remix.py mezcla música y efectos de catálogo."""
import asyncio,json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'python'))
import edge_tts
ROOT=Path(__file__).resolve().parents[1]
def norm(s):return ''.join(c for c in s.lower() if c.isalnum())
async def voice(name,s):
    target=ROOT/'assets/audio'/f'{name}-{s["id"]}.mp3';meta=target.with_suffix('.json')
    if target.exists() and target.stat().st_size>500 and meta.exists():
        words=json.loads(meta.read_text(encoding='utf8'))
        if norm(' '.join(w['text'] for w in words))==norm(s['voice']):return
    words=[]
    with target.open('wb') as out:
        async for chunk in edge_tts.Communicate(s['voice'],'es-AR-ElenaNeural',rate='+3%',boundary='WordBoundary').stream():
            if chunk['type']=='audio':out.write(chunk['data'])
            elif chunk['type']=='WordBoundary':words.append({'text':chunk['text'],'start':chunk['offset']/1e7,'duration':chunk['duration']/1e7})
    meta.write_text(json.dumps(words,ensure_ascii=False),encoding='utf8')
    print('voice',name,s['id'],flush=True)
async def main():
    films=json.loads((ROOT/'campaign.json').read_text(encoding='utf8'))
    for name,f in films.items():
        for s in f['scenes']:await voice(name,s)
if __name__=='__main__':asyncio.run(main())
