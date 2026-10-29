import fs from 'node:fs';
import {films} from '../campaign.mjs';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function title(s){return s.title.split('\n').map(line=>`<span class="line${s.accent&&line.includes(s.accent)?' accent':''}">${esc(line)}</span>`).join('');}
const offsets={'plans':-745,'plans-again':-745,'purchase':-525,'purchase-check':-525,'purchase-done':-525,'voice':-360,'voice-review':-80,'login':-180,'register':-80,'profile':-150,'payments':-15,'merchant-request':-100,'plan-fast':65,'plan-balanced':65,'plan-economic':65};
function routeSvg(id,hero=false){return `<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-label="Schéma explicatif du parcours"><path d="M-50 175H850M-50 350H850M-50 525H850M-50 700H850M120 -50V850M295 -50V850M470 -50V850M645 -50V850" stroke="${hero?'#dde6e6':'#edf0f3'}" stroke-width="3" fill="none"/><path d="M800 450Q620 500 670 800H800Z" fill="#d8ecf7"/><path id="${id}-path" class="map-path" d="M130 650L295 650L295 350L470 350L470 175L645 175"/><circle cx="130" cy="650" r="18" fill="#1b6ac9"/><circle cx="645" cy="175" r="18" fill="#1b6ac9"/><g class="map-stop"><rect x="232" y="416" width="126" height="100" rx="24" class="map-store"/><path d="M263 450H327L319 433H271ZM268 451V488H322V451M287 488V465H304V488" fill="none" stroke="#1b6ac9" stroke-width="5" stroke-linejoin="round"/><circle class="map-pin" cx="295" cy="390" r="20"/></g><text x="72" y="715" class="map-label">Casa</text><text x="554" y="128" class="map-label">Trabajo</text><text x="392" y="467" class="map-label">Tu compra</text><text x="392" y="506" class="map-small">Una parada en el camino</text></svg>`;}
function scene(name,f,s,i){
 const id=`${name}-${s.id}`,portrait=name==='reel';let body='';
 if(s.kind==='ui'){
 const screens=s.screen==='plans'?['plan-fast','plan-balanced','plan-economic']:[s.screen,s.screen2,s.screen3].filter(Boolean);
 body=`<div class="copy"><div class="rule"></div><h1 class="title">${title(s)}</h1><p class="subtitle">${esc(s.subtitle)}</p></div><div class="visual"><div class="ui-stage" data-layout-allow-overflow="true">${screens.map((screen,k)=>`<div class="screen-state state-${k}" style="opacity:${k?0:1}"><img src="assets/screens/${screen}.png" style="top:${offsets[screen]??0}px" alt="${esc(screen)} · captura real de DePaso"/></div>`).join('')}</div></div><p class="state-label">Interfaz real · datos de ejemplo</p>`;
 }else if(s.kind==='map'){
 body=`<div class="copy"><div class="rule"></div><h1 class="title">${title(s)}</h1><p class="subtitle">${esc(s.subtitle)}</p></div><div class="visual"><div class="map-stage">${routeSvg(id)}<p class="map-caption">Recorrido ilustrativo · Mar del Plata</p></div></div>`;
 }else if(s.kind==='hook'){
 body=`<div class="hero-copy"><h1 class="title">${title(s)}</h1><p class="subtitle">${esc(s.subtitle)}</p></div><div class="hero-route" data-layout-allow-overflow="true">${routeSvg(id,true)}</div><img class="hero-icon" src="assets/brand/symbol.svg" alt="DePaso"/>`;
 }else if(s.kind==='words'){
 body=`<div class="problem-copy"><h1 class="title">${title(s)}</h1><p class="subtitle">${esc(s.subtitle)}</p></div><div class="problem-line"></div><div class="problem-dot"></div>`;
 }else if(s.kind==='brand'){
 body=`<img class="brand-logo" src="assets/brand/logo.svg" alt="DePaso"/><div class="brand-copy"><h1 class="title">${title(s)}</h1><p class="subtitle">${esc(s.subtitle)}</p></div><img class="brand-art" src="assets/brand/bienvenida.png" alt="Ilustración original de DePaso"/>`;
 }else{
 body=`<img class="end-logo" src="assets/brand/logo.svg" alt="DePaso"/><p class="end-subtitle">Tu lista. Tu recorrido.</p><h1 class="end-title" data-var-text="cta">${esc(s.title)}</h1><div class="end-line"></div><p class="end-credit">Música: «Cipher» · Kevin MacLeod · incompetech.com<br/>CC BY 3.0 · Edición y mezcla para esta campaña</p>`;
 }
 const code=[];
 if(s.kind==='ui'||s.kind==='map'){
  code.push(`tl.fromTo('#${id} .rule',{scaleX:0},{scaleX:1,duration:.5,ease:'power3.out'},0);`);
  code.push(`tl.fromTo('#${id} .line',{opacity:0,y:22},{opacity:1,y:0,duration:.55,stagger:.09,ease:'power4.out'},.04);`);
  code.push(`tl.fromTo('#${id} .subtitle',{opacity:0},{opacity:1,duration:.3},.42);`);
  code.push(`tl.fromTo('#${id} .visual',{x:90,opacity:0},{x:0,opacity:1,duration:.65,ease:'power4.out'},.12);`);
  const count=s.screen==='plans'?3:[s.screen,s.screen2,s.screen3].filter(Boolean).length;
  for(let k=1;k<count;k++){let t=s.duration*k/count;code.push(`tl.fromTo('#${id} .state-${k}',{opacity:0},{opacity:1,duration:.2},${t});`);}
  if(s.kind==='map')code.push(`tl.fromTo('#${id}-path',{strokeDasharray:1000,strokeDashoffset:1000},{strokeDashoffset:0,duration:2.8,ease:'power2.inOut'},.4);tl.fromTo('#${id} .map-stop',{opacity:0},{opacity:1,duration:.35},2);`);
 }else if(s.kind==='hook'){
  code.push(`tl.fromTo('#${id} .line',{x:-35,opacity:0},{x:0,opacity:1,duration:.5,stagger:.09,ease:'power4.out'},0);tl.fromTo('#${id}-path',{strokeDasharray:1000,strokeDashoffset:1000},{strokeDashoffset:0,duration:${Math.min(s.duration-1,2.6)},ease:'power2.inOut'},.25);tl.fromTo('#${id} .hero-icon',{scale:.65,opacity:0},{scale:1,opacity:1,duration:.6,ease:'back.out(1.15)'},.4);`);
 }else if(s.kind==='words'){
  code.push(`tl.fromTo('#${id} .line',{opacity:0},{opacity:1,duration:.3,stagger:.35},0);tl.fromTo('#${id} .problem-dot',{x:0},{x:1570,duration:${s.duration-.3},ease:'power2.inOut'},.1);`);
 }else if(s.kind==='brand'){
  code.push(`tl.fromTo('#${id} .brand-logo',{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:.8,ease:'power3.inOut'},0);tl.fromTo('#${id} .brand-copy',{opacity:0,y:25},{opacity:1,y:0,duration:.5,ease:'power4.out'},.45);tl.fromTo('#${id} .brand-art',{x:150,opacity:0},{x:0,opacity:1,duration:.8,ease:'power4.out'},.2);`);
 }else{
  code.push(`tl.fromTo('#${id} .end-logo',{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:.85,ease:'power3.inOut'},0);tl.fromTo('#${id} .end-title',{opacity:0,y:20},{opacity:1,y:0,duration:.55,ease:'power4.out'},.5);tl.fromTo('#${id} .end-line',{scaleX:0},{scaleX:1,duration:.55,ease:'power4.out'},.9);`);
 }
 // Each scene exits as a single full-width wipe, carried by the brand's route direction.
 if(i<f.scenes.length-1)code.push(`tl.fromTo('#${id} .exit-panel',{xPercent:-101},{xPercent:0,duration:.24,ease:'power3.in'},${s.duration-.24});`);
 const css=`#root{position:absolute;inset:0} .exit-panel{position:absolute;inset:0;background:${f.scenes[i+1]?.tone==='blue'?'#1b6ac9':f.scenes[i+1]?.tone==='mint'?'#eaf6e4':'#f5f5f7'};z-index:10;transform:translateX(-101%)}`;
 // Do not set CSS transforms on GSAP targets.
 const cleanCss=css.replace(';transform:translateX(-101%)','');
 fs.writeFileSync(`compositions/${id}.html`,`<template><style>${cleanCss}</style><link rel="stylesheet" href="assets/campaign.css"/><div id="root" data-composition-id="${id}" data-width="${f.width}" data-height="${f.height}"><div id="${id}-stage" class="scene ${s.tone} ${portrait?'portrait':''}">${body}<div class="exit-panel" data-layout-allow-overflow="true" style="opacity:${i<f.scenes.length-1?1:0}"></div></div></div><script>const tl=gsap.timeline({paused:true});${code.join('\n').replaceAll("'#"+id+" .","'#"+id+"-stage .")}window.__timelines['${id}']=tl;</script></template>`);
 return `<div id="${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${s.start}" data-duration="${s.duration}" data-track-index="1" data-track-kind="graphics" data-width="${f.width}" data-height="${f.height}"></div>`;
}
for(const [name,f]of Object.entries(films)){
 let captions=[];try{captions=JSON.parse(fs.readFileSync(`assets/audio/${name}-captions.json`,'utf8'))}catch{}
 const body=f.scenes.map((s,i)=>scene(name,f,s,i)).join('\n');
 const captionId=`${name}-captions`;
 const captionLines=captions.map((c,i)=>`<div id="${name}-caption-${i}" class="clip" data-start="${c.start.toFixed(3)}" data-duration="${(c.end-c.start).toFixed(3)}" data-track-index="3"><p class="caption-text"><span>${esc(c.text)}</span></p></div>`).join('\n');
 fs.writeFileSync(`compositions/${captionId}.html`,`<template><style>#root{position:absolute;inset:0;pointer-events:none}</style><link rel="stylesheet" href="assets/campaign.css"/><div id="root" data-composition-id="${captionId}" data-width="${f.width}" data-height="${f.height}"><div class="${name==='reel'?'portrait':''}" style="position:absolute;inset:0">${captionLines}</div></div><script>window.__timelines['${captionId}']=gsap.timeline({paused:true});</script></template>`);
 const cap=`<div id="${captionId}" class="clip" style="z-index:20;pointer-events:none" data-composition-id="${captionId}" data-composition-src="compositions/${captionId}.html" data-start="0" data-duration="${f.duration}" data-track-index="3" data-track-kind="captions" data-width="${f.width}" data-height="${f.height}"></div>`;
 const html=`<!doctype html><html lang="es-AR" data-composition-variables='[{"id":"cta","type":"string","label":"Cierre","default":"Descargá DePaso"}]'><head><meta charset="utf-8"/><link rel="stylesheet" href="assets/campaign.css"/><script src="assets/gsap.min.js"></script><style>html,body{width:${f.width}px;height:${f.height}px}#root{position:relative;width:100%;height:100%}</style></head><body class="${name==='reel'?'portrait':''}"><div id="root" data-composition-id="${name}" data-start="0" data-duration="${f.duration}" data-width="${f.width}" data-height="${f.height}" data-fps="30">${body}${cap}<audio id="${name}-audio" class="clip" data-start="0" data-duration="${f.duration}" data-track-index="2" data-volume="1" src="assets/audio/${name}-mix.wav"></audio></div><script>window.__timelines=window.__timelines||{};window.__timelines['${name}']=gsap.timeline({paused:true});</script></body></html>`;
 if(name==='comercial')fs.writeFileSync('index.html',html);
 else{
  fs.mkdirSync(`${name}/compositions`,{recursive:true});fs.mkdirSync(`${name}/assets/audio`,{recursive:true});
  fs.writeFileSync(`${name}/index.html`,html);
  fs.copyFileSync('hyperframes.json',`${name}/hyperframes.json`);
  for(const s of f.scenes)fs.copyFileSync(`compositions/${name}-${s.id}.html`,`${name}/compositions/${name}-${s.id}.html`);
  fs.copyFileSync(`compositions/${captionId}.html`,`${name}/compositions/${captionId}.html`);
  for(const dir of ['screens','fonts','brand'])fs.cpSync(`assets/${dir}`,`${name}/assets/${dir}`,{recursive:true});
  for(const file of ['campaign.css','gsap.min.js'])fs.copyFileSync(`assets/${file}`,`${name}/assets/${file}`);
  if(fs.existsSync(`assets/audio/${name}-mix.wav`))fs.copyFileSync(`assets/audio/${name}-mix.wav`,`${name}/assets/audio/${name}-mix.wav`);
  fs.writeFileSync(`${name}/package.json`,JSON.stringify({name:`depaso-${name}`,private:true,scripts:{dev:'..\\node_modules\\.bin\\hyperframes.cmd preview',check:'..\\node_modules\\.bin\\hyperframes.cmd check',render:`..\\node_modules\\.bin\\hyperframes.cmd render --quality delivery --fps 30 --output ../exports/depaso-${name}.mp4`}},null,2));
 }
}
for(const old of ['reel.html','funciones.html'])if(fs.existsSync(old))fs.unlinkSync(old);
fs.writeFileSync('campaign.json',JSON.stringify(films,null,2));
let story='# Guiones y storyboard\n\n';
for(const [name,f]of Object.entries(films)){story+=`## ${name} · ${f.width}×${f.height} · ${f.duration} s\n\n| Tiempo | Plano y texto | Locución |\n|---|---|---|\n`;for(const s of f.scenes)story+=`| ${s.start}–${s.start+s.duration} s | ${s.kind}${s.screen?' · '+s.screen:''}. ${s.title.replaceAll('\n',' / ')} | ${s.voice} |\n`;story+='\n';}
fs.writeFileSync('STORYBOARD.md',story);
console.log('Built 3 compositions,',Object.values(films).reduce((n,f)=>n+f.scenes.length,0),'scenes.');
