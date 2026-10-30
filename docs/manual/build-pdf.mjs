// Arma el PDF del manual de usuario a partir de docs/MANUAL-DE-USUARIO.md
// Uso: cd docs/manual && npm i && node build-pdf.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";

const aca = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(aca, "..", "..", "videos", "package.json"));
const { chromium } = require("playwright");

// markdown -> html (las imagenes del md son relativas a docs/, aca las apuntamos a docs/manual)
const md = readFileSync(join(aca, "..", "MANUAL-DE-USUARIO.md"), "utf8")
  .replace(/\]\(manual\/img\//g, "](img/")
  .replace(/^# .*\n/, "")
  .replace(/^Este manual también está en PDF.*\n/m, "")
  .replace(/\]\(GUIA-DE-INSTALACION\.md\)/g, "](#)");
const cuerpo = marked.parse(md);

const css = `
@font-face { font-family: Fredoka; src: url(Fredoka.ttf); font-weight: 300 700; }
@font-face { font-family: Montserrat; src: url(Montserrat.ttf); font-weight: 400; }
@font-face { font-family: Montserrat; src: url(Montserrat-Bold.ttf); font-weight: 600 800; }
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
@page :first { margin: 0; }
* { box-sizing: border-box; }
body { font-family: Montserrat, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #16181d; margin: 0; }
.portada { height: 297mm; width: 210mm; background: #000; color: #fff; display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center; page-break-after: always; position: relative; overflow: hidden; }
.portada::before { content: ""; position: absolute; width: 150mm; height: 150mm; border-radius: 50%;
  background: radial-gradient(circle, rgba(124,176,255,.28), transparent 65%); top: -35mm; right: -45mm; }
.portada::after { content: ""; position: absolute; width: 130mm; height: 130mm; border-radius: 50%;
  background: radial-gradient(circle, rgba(184,255,60,.16), transparent 65%); bottom: -40mm; left: -40mm; }
.portada img.logo { width: 120mm; position: relative; z-index: 1; }
.portada h1 { font-family: Fredoka, sans-serif; font-size: 34pt; margin: 18mm 0 3mm; position: relative; z-index: 1; border: 0; color: #fff; }
.portada p { font-size: 13pt; color: #b9bec9; margin: 0; position: relative; z-index: 1; }
.portada .pie { position: absolute; bottom: 14mm; font-size: 9pt; color: #6d7380; z-index: 1; }
h1, h2, h3 { font-family: Fredoka, sans-serif; color: #0a0d14; line-height: 1.2; }
h2 { font-size: 20pt; margin: 0 0 4mm; padding-bottom: 2mm; border-bottom: 2.5px solid #7cb0ff; page-break-before: always; }
h2:first-of-type { page-break-before: auto; }
h3 { font-size: 13.5pt; margin: 7mm 0 2mm; color: #1f4fd6; }
p { margin: 0 0 3mm; }
a { color: #1f4fd6; text-decoration: none; }
strong { color: #0a0d14; }
ul, ol { margin: 0 0 3mm; padding-left: 6mm; }
li { margin-bottom: 1mm; }
blockquote { margin: 3mm 0; padding: 2.5mm 4mm; background: #eef4ff; border-left: 3px solid #7cb0ff; border-radius: 0 3mm 3mm 0; color: #26324f; }
blockquote p { margin: 0; }
hr { border: 0; border-top: 1px solid #e3e6ec; margin: 4mm 0; }
table { width: 100%; border-collapse: collapse; margin: 3mm 0 5mm; font-size: 9.5pt; page-break-inside: avoid; }
th { background: #0a0d14; color: #fff; text-align: left; padding: 2mm 3mm; font-weight: 600; }
td { padding: 2mm 3mm; border-bottom: 1px solid #e3e6ec; vertical-align: top; }
tr:nth-child(even) td { background: #f6f8fb; }
p > img { display: block; margin: 4mm auto; max-height: 128mm; max-width: 62mm; border-radius: 6mm;
  border: 1.2mm solid #0a0d14; box-shadow: 0 2mm 6mm rgba(0,0,0,.25); page-break-inside: avoid; }
`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css}</style></head><body>
<section class="portada">
  <img class="logo" src="img/logo-dark.svg" alt="DePaso">
  <h1>Manual de usuario</h1>
  <p>Ahorrá en el camino.</p>
  <div class="pie">Versión de octubre de 2026 · Los precios de las capturas son ejemplos ficticios</div>
</section>
${cuerpo}
</body></html>`;

const archivoHtml = join(aca, "_manual.html");
writeFileSync(archivoHtml, html);

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "msedge" });
const page = await browser.newPage();
await page.goto(pathToFileURL(archivoHtml).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: join(aca, "DePaso-Manual-de-usuario.pdf"),
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:8px;color:#8a90a0;text-align:center;font-family:sans-serif">DePaso · Manual de usuario · <span class="pageNumber"></span></div>',
});
await browser.close();
console.log("PDF listo");
