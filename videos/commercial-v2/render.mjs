import path from 'node:path';
import fs from 'node:fs';
import dns from 'node:dns';
import http from 'node:http';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';
dns.setDefaultResultOrder('ipv4first');
const browserExecutable='C:/Users/Usuario/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe';
const bundleDir=await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public'),onProgress:p=>{if(p===100)console.log('Bundle ready')}});
// Explicit IPv4 URL avoids the Windows localhost/::1 mismatch in media download workers.
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.wav':'audio/wav','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const target=path.resolve(bundleDir,'.'+(pathname==='/'?'/index.html':pathname));
 if(!target.startsWith(path.resolve(bundleDir)+path.sep)||!fs.existsSync(target)||fs.statSync(target).isDirectory()){res.writeHead(404);res.end();return;}
 const size=fs.statSync(target).size;res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
 const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);
 if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(target,{start,end}).pipe(res);}
 else{res.writeHead(200,{'Content-Length':size});fs.createReadStream(target).pipe(res);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const serveUrl=`http://127.0.0.1:${server.address().port}`;
const id=process.argv.includes('--preview')?'DePaso-Hook-Preview':'DePaso-Commercial-Dark';
const inputProps={bgm:!process.argv.includes('--no-bgm')};
const composition=await selectComposition({serveUrl,id,browserExecutable,inputProps});
if(process.argv.includes('--stills')){
 fs.mkdirSync('out/qa',{recursive:true});
 for(const frame of [15,65,125,215,270,350,430,500,570,675,770,830,910,1015]){if(frame>=composition.durationInFrames)continue;await renderStill({serveUrl,composition,frame,output:path.resolve(`out/qa/frame-${frame}.png`),browserExecutable,inputProps});console.log('still',frame)}
}else{
 const name=process.argv.includes('--preview')?'hook-preview':inputProps.bgm?'commercial-dark':'commercial-dark-no-bgm';
 await renderMedia({serveUrl,composition,codec:'h264',audioCodec:'aac',audioBitrate:'320k',crf:17,pixelFormat:'yuv420p',outputLocation:path.resolve(`out/depaso-${name}.mp4`),browserExecutable,inputProps,concurrency:4,onProgress:p=>{const pc=Math.floor(p.progress*100);if(pc%10===0)process.stdout.write(`${pc}% `)}});
 console.log('\nRendered',name);
}
server.close();
