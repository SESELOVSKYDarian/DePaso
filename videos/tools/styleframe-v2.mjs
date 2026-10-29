import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/Usuario/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
await page.goto('file:///'+path.resolve('commercial-v2/styleframes.html').replaceAll('\\','/'));await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:'commercial-v2/out/styleframe.png'});await browser.close();
