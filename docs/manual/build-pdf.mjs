// Arma el PDF del manual de usuario (formato APA 7) a partir de docs/MANUAL-DE-USUARIO.md
// Uso: cd docs/manual && npm i && node build-pdf.mjs
// Reglas APA: Arial 12, interlineado 1,5, sangría de primera línea 0,5", texto justificado,
// títulos por niveles sin numerar, "Figura N" / "Tabla N" con título en cursiva y encabezado "Título | n".
// La portada conserva el diseño oscuro de DePaso.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { marked } from "marked";

const aca = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(aca, "..", "..", "videos", "package.json"));
const { chromium } = require("playwright");

const TITULO = "Manual de usuario de DePaso";
const TITULOS_TABLAS = [
  "Pestañas de la barra inferior",
  "Opciones del perfil y su función",
  "Tipos de usuario y sus permisos",
];

// ---------- markdown -> html ----------
const md = readFileSync(join(aca, "..", "MANUAL-DE-USUARIO.md"), "utf8")
  .replace(/^﻿/, "")
  .replace(/\r\n/g, "\n")
  .replace(/\]\(manual\/img\//g, "](img/")
  .replace(/^# .*\n/, "")
  .replace(/^Este manual también está en PDF.*\n/m, "")
  .replace(/\[([^\]]+)\]\(GUIA-DE-INSTALACION\.md\)/g, "$1")
  .replace(/^---$/gm, "")
  .replace(/^(#{2}) \d+\. /gm, "$1 "); // los títulos APA no se numeran

let html = marked.parse(md);

// citas -> "Nota." (APA)
html = html.replace(/<blockquote>\s*<p>([\s\S]*?)<\/p>\s*<\/blockquote>/g, '<p class="nota"><b>Nota.</b> $1</p>');

// figuras: anuncio en el texto + "Figura N" + título en cursiva + imagen centrada
let nFigura = 0;
html = html.replace(/<p><img src="([^"]+)" alt="([^"]*)"\s*\/?><\/p>/g, (_, src, alt) => {
  nFigura += 1;
  const titulo = alt.charAt(0).toUpperCase() + alt.slice(1);
  return `<p>La Figura ${nFigura} presenta la pantalla «${alt}».</p>
<div class="figura"><p class="rotulo"><b>Figura ${nFigura}</b></p><p class="rotulo"><i>${titulo}</i></p><img src="${src}" alt=""></div>`;
});

// tablas: "Tabla N" + título en cursiva
let nTabla = 0;
html = html.replace(/<table>/g, () => {
  const titulo = TITULOS_TABLAS[nTabla] ?? "";
  nTabla += 1;
  return `<div class="tabla"><p class="rotulo"><b>Tabla ${nTabla}</b></p><p class="rotulo"><i>${titulo}</i></p><table>`;
});
html = html.replace(/<\/table>/g, "</table></div>");

// h2 = nivel 1 (centrado, negrita); h3 = nivel 2 (izquierda, negrita)
const cuerpo = `<h1 class="n1">${TITULO}</h1>\n${html}`;

const css = `
@font-face { font-family: Fredoka; src: url(Fredoka.ttf); font-weight: 300 700; }
@font-face { font-family: Montserrat; src: url(Montserrat.ttf); font-weight: 400; }
@font-face { font-family: Montserrat; src: url(Montserrat-Bold.ttf); font-weight: 600 800; }
@page { size: A4; margin: 25.4mm; }
@page :first { margin: 0; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; }

/* portada (diseño de DePaso, se mantiene) */
.portada { height: 297mm; width: 210mm; background: #000; color: #fff; display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center; page-break-after: always; position: relative; overflow: hidden; }
.portada::before { content: ""; position: absolute; width: 150mm; height: 150mm; border-radius: 50%;
  background: radial-gradient(circle, rgba(124,176,255,.28), transparent 65%); top: -35mm; right: -45mm; }
.portada::after { content: ""; position: absolute; width: 130mm; height: 130mm; border-radius: 50%;
  background: radial-gradient(circle, rgba(184,255,60,.16), transparent 65%); bottom: -40mm; left: -40mm; }
.portada img.logo { width: 120mm; position: relative; z-index: 1; }
.portada h1 { font-family: Fredoka, sans-serif; font-size: 34pt; margin: 18mm 0 3mm; position: relative; z-index: 1; border: 0; color: #fff; line-height: 1.2; }
.portada p { font-family: Montserrat, sans-serif; font-size: 13pt; color: #b9bec9; margin: 0; text-indent: 0; text-align: center; position: relative; z-index: 1; }
.portada .pie { position: absolute; bottom: 14mm; font-family: Montserrat, sans-serif; font-size: 9pt; color: #6d7380; z-index: 1; }

/* APA: títulos */
h1.n1, h2 { font-size: 12pt; font-weight: bold; text-align: center; margin: 0; line-height: 1.5; break-after: avoid; }
h3 { font-size: 12pt; font-weight: bold; text-align: left; margin: 0; line-height: 1.5; break-after: avoid; }
h4 { font-size: 12pt; font-weight: bold; margin: 0; }

/* APA: párrafos */
p { margin: 0; text-align: justify; text-indent: 12.7mm; orphans: 2; widows: 2; }
a { color: #000; text-decoration: none; }
em, i { font-style: italic; }

/* listas: viñeta ●, sangría 0,5" y francesa 0,25" */
ul, ol { margin: 0; padding: 0; }
ul { list-style: none; }
ul li { position: relative; padding-left: 19mm; margin-left: 0; text-align: justify; }
ul li::before { content: "●"; position: absolute; left: 12.7mm; font-size: 8pt; line-height: 2.2; }
ol { padding-left: 19mm; }
ol li { text-align: justify; padding-left: 0; }
li p { text-indent: 0; }

/* notas, figuras y tablas */
p.nota { font-size: 11pt; text-indent: 0; line-height: 1.5; }
.figura, .tabla { break-inside: avoid; margin: 0 0 4mm; }
.rotulo { text-indent: 0; text-align: left; line-height: 1.5; break-after: avoid; }
.figura img { display: block; margin: 2mm auto 2mm; max-height: 105mm; max-width: 55mm; border: .4mm solid #444; border-radius: 3mm; }
table { width: 100%; border-collapse: collapse; font-size: 11pt; line-height: 1.35; margin: 2mm 0 4mm; border-top: 1pt solid #000; border-bottom: 1pt solid #000; }
th { text-align: left; font-weight: bold; padding: 1.6mm 2mm; border-bottom: .75pt solid #000; }
td { padding: 1.6mm 2mm; border-bottom: .5pt solid #555; vertical-align: top; text-align: left; }
tr:last-child td { border-bottom: 0; }
td p, th p { text-indent: 0; }
`;

const htmlFinal = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${css}</style></head><body>
<section class="portada">
  <img class="logo" src="img/logo-dark.svg" alt="DePaso">
  <h1>Manual de usuario</h1>
  <p>Ahorrá en el camino.</p>
  <div class="pie">Versión de octubre de 2026 · Los precios de las capturas son ejemplos ficticios</div>
</section>
${cuerpo}
</body></html>`;

const archivoHtml = join(aca, "_manual.html");
writeFileSync(archivoHtml, htmlFinal);

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
  // encabezado APA: título corto y número de página a la derecha, Times New Roman 12
  headerTemplate: `<div style="width:100%;padding-right:25.4mm;text-align:right;font-family:'Times New Roman',serif;font-size:16px;position:relative;top:7mm">DePaso | <span class="pageNumber"></span></div>`,
  footerTemplate: "<span></span>",
});
await browser.close();
console.log("PDF listo");
