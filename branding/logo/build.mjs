// Genera isotipo, wordmark, lockups e íconos de DePaso (SVG + PNG). Uso: node build.mjs <carpeta-salida>
import { Resvg } from "@resvg/resvg-js";
import opentype from "opentype.js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2] ?? "out";
mkdirSync(out, { recursive: true });

const FREDOKA = "D:/DePaso/node_modules/@expo-google-fonts/fredoka/700Bold/Fredoka_700Bold.ttf";
const MONTSERRAT = "D:/DePaso/node_modules/@expo-google-fonts/montserrat/600SemiBold/Montserrat_600SemiBold.ttf";
const loadFont = (path) => {
  const buf = readFileSync(path);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const fredoka = loadFont(FREDOKA);
const montserrat = loadFont(MONTSERRAT);

/** Paletas del isotipo. `light` va sobre fondos claros; `dark` sobre fondos oscuros. */
const PAL = {
  light: { body: "#1A1341", road: "#FFFFFF", mint: "#9FE6D0", blue: "#2F80CF", pin: "#B7FF1A", dash: "#2F80CF" },
  dark: { body: "#F5F5F7", road: "#1D1D1F", mint: "#7DDBC0", blue: "#4A9BEA", pin: "#B7FF1A", dash: "#4A9BEA" },
};

const D_PATH = "M50 34H134A94 94 0 0 1 134 222H50A22 22 0 0 1 28 200V56A22 22 0 0 1 50 34Z";
const ROAD = "M22 246C70 214 128 204 134 150";

/** Isotipo en 256x256 (sin <svg>). `small` = corte para tamaños chicos (sin rayas, trazos más gruesos). */
function symbolGroup(p, { small = false, id = "d" } = {}) {
  const ring = small ? 20 : 16;
  const road = small ? 28 : 22;
  return `
  <defs><clipPath id="${id}"><path d="${D_PATH}"/></clipPath></defs>
  <g clip-path="url(#${id})">
    <rect width="256" height="256" fill="${p.body}"/>
    <path fill="${p.mint}" d="M88 34H134A94 94 0 0 1 134 222H50A22 22 0 0 1 28 200V172C52 160 84 160 108 170C140 182 178 160 190 118C200 84 160 48 124 40C108 36 98 34 88 34Z"/>
    <path fill="${p.blue}" d="M224.8 103.7A94 94 0 0 1 89.9 211A150 150 0 0 0 224.8 103.7Z"/>
    <path fill="${p.blue}" d="M89.9 211A94 94 0 0 0 134 222H80Z"/>
    <g fill="none" stroke="${p.road}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="136" cy="108" r="30" stroke-width="${ring}"/>
      <path stroke-width="${road}" d="${ROAD}"/>
    </g>
    ${small ? "" : `<path fill="none" stroke="${p.dash}" stroke-width="5" stroke-linecap="round" stroke-dasharray="7 17" stroke-dashoffset="-6" d="M22 246C70 214 128 204 134 166"/>`}
  </g>
  <path fill="${p.pin}" transform="translate(136 110) scale(1.18) translate(-136 -110)" d="M136 90.5a11.5 11.5 0 0 1 11.5 11.5c0 8.5-8 15.5-11.5 22c-3.5-6.5-11.5-13.5-11.5-22A11.5 11.5 0 0 1 136 90.5Z"/>
  <g stroke="${p.pin}" stroke-width="12" stroke-linecap="round">
    <path d="M206 34l8-22"/><path d="M226 54l22-12"/>
  </g>`;
}

/** Versión monocromática (sólo alfa) para el ícono temático de Android: cuerpo sólido con camino/pin recortados. */
function symbolMono() {
  return `
  <defs>
    <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256">
      <rect width="256" height="256" fill="#000"/>
      <path d="${D_PATH}" fill="#fff"/>
      <g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="136" cy="108" r="30" stroke-width="18"/>
        <path stroke-width="24" d="${ROAD}"/>
      </g>
      <path fill="#000" transform="translate(136 110) scale(1.18) translate(-136 -110)" d="M136 90.5a11.5 11.5 0 0 1 11.5 11.5c0 8.5-8 15.5-11.5 22c-3.5-6.5-11.5-13.5-11.5-22A11.5 11.5 0 0 1 136 90.5Z"/>
    </mask>
  </defs>
  <rect width="256" height="256" fill="#fff" mask="url(#m)"/>
  <g stroke="#fff" stroke-width="12" stroke-linecap="round"><path d="M206 34l8-22"/><path d="M226 54l22-12"/></g>`;
}

const svgDoc = (w, h, body, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${extra}>${body}\n</svg>\n`;

// --- Wordmark ---------------------------------------------------------------------------
const WORD_SIZE = 112;
const TAG_SIZE = 34;
function wordmarkPaths(kind) {
  const c = {
    light: { de: "#1A1341", paso: "#2F80CF", tag: "#1A1341", dot: "#B7FF1A" },
    dark: { de: "#F5F5F7", paso: "#5AA9F5", tag: "#D2D2D7", dot: "#B7FF1A" },
  }[kind];
  const spacing = -0.02;
  const de = fredoka.getPath("De", 0, 0, WORD_SIZE, { letterSpacing: spacing });
  const deW = fredoka.getAdvanceWidth("De", WORD_SIZE, { letterSpacing: spacing });
  const paso = fredoka.getPath("Paso", deW, 0, WORD_SIZE, { letterSpacing: spacing });
  const wBox = (() => {
    const a = de.getBoundingBox();
    const b = paso.getBoundingBox();
    return { x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1), x2: Math.max(a.x2, b.x2), y2: Math.max(a.y2, b.y2) };
  })();

  const tagText = "Ahorrá en el camino";
  const tagY = wBox.y2 + 14 + TAG_SIZE * 0.72;
  const tag = montserrat.getPath(tagText, wBox.x1, tagY, TAG_SIZE, { letterSpacing: 0.12 });
  const tagBox = tag.getBoundingBox();
  const dotR = TAG_SIZE * 0.1;
  const dotX = tagBox.x2 + TAG_SIZE * 0.16 + dotR;
  const dotY = tagY - dotR;

  const d = (p) => p.toPathData(2);
  const markup =
    `<path fill="${c.de}" d="${d(de)}"/>` +
    `<path fill="${c.paso}" d="${d(paso)}"/>` +
    `<path fill="${c.tag}" d="${d(tag)}"/>` +
    `<circle cx="${dotX.toFixed(2)}" cy="${dotY.toFixed(2)}" r="${dotR.toFixed(2)}" fill="${c.dot}"/>`;
  return {
    markup,
    box: { x1: wBox.x1, y1: wBox.y1, x2: Math.max(wBox.x2, dotX + dotR), y2: tagBox.y2 + 2 },
    wordBox: wBox,
  };
}

function lockup(kind) {
  const pal = PAL[kind];
  const wm = wordmarkPaths(kind);
  const textW = wm.box.x2 - wm.box.x1;
  const textH = wm.box.y2 - wm.box.y1;
  const ICON_H = 190; // alto visual del isotipo (254-12 en el lienzo de 256 → escala)
  const scale = ICON_H / 210;
  const iconW = 220 * scale;
  const gap = 44;
  const pad = 24;
  const H = Math.max(ICON_H, textH) + pad * 2;
  const W = iconW + gap + textW + pad * 2;
  const iconX = pad - 28 * scale;
  const iconY = (H - ICON_H) / 2 - 12 * scale;
  const textX = pad + iconW + gap - wm.box.x1;
  const textY = (H - textH) / 2 - wm.box.y1;
  return svgDoc(
    Math.round(W),
    Math.round(H),
    `<title>DePaso</title><g transform="translate(${iconX.toFixed(2)} ${iconY.toFixed(2)}) scale(${scale.toFixed(4)})">${symbolGroup(pal, { id: "dl" })}</g>` +
      `<g transform="translate(${textX.toFixed(2)} ${textY.toFixed(2)})">${wm.markup}</g>`,
  );
}

/** Lockup apilado: isotipo arriba, wordmark + tagline debajo (para splash y pantallas de marca). */
function stacked(kind) {
  const pal = PAL[kind];
  const wm = wordmarkPaths(kind);
  const textW = wm.box.x2 - wm.box.x1;
  const textH = wm.box.y2 - wm.box.y1;
  const ICON = 300;
  const scale = ICON / 256;
  const gap = 40;
  const W = Math.max(textW, ICON) + 80;
  const H = ICON + gap + textH + 60;
  const iconX = (W - ICON) / 2;
  const textX = (W - textW) / 2 - wm.box.x1;
  const textY = 30 + ICON + gap - wm.box.y1;
  return svgDoc(
    Math.round(W),
    Math.round(H),
    `<title>DePaso</title><g transform="translate(${iconX.toFixed(2)} 30) scale(${scale.toFixed(4)})">${symbolGroup(pal, { id: "ds" })}</g>` +
      `<g transform="translate(${textX.toFixed(2)} ${textY.toFixed(2)})">${wm.markup}</g>`,
  );
}

// --- App icon ---------------------------------------------------------------------------
function appIconSvg() {
  const s = 1024;
  const symbol = 660; // 64% del lienzo: respira y sobrevive a máscaras redondeadas
  const scale = symbol / 256;
  const tx = (s - symbol) / 2 - 8 * scale;
  const ty = (s - symbol) / 2 - 6 * scale;
  return svgDoc(
    s,
    s,
    `<title>DePaso</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2C2C2E"/><stop offset="1" stop-color="#050506"/></linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.16" r="0.7"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.14"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="url(#bg)"/>
  <rect width="${s}" height="${s}" fill="url(#glow)"/>
  <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${symbolGroup(PAL.dark, { id: "di" })}</g>`,
  );
}

function adaptiveForeground(kind, mono = false) {
  const s = 1024;
  const symbol = 540; // zona segura de adaptive icons: 66% (≈676px) → 540 deja margen
  const scale = symbol / 256;
  const tx = (s - symbol) / 2 - 8 * scale;
  const ty = (s - symbol) / 2 - 6 * scale;
  const inner = mono ? symbolMono() : symbolGroup(PAL[kind], { id: "da" });
  return svgDoc(s, s, `<title>DePaso</title><g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${inner}</g>`);
}

function markOnly(kind, { small = false, size = 512 } = {}) {
  const scale = size / 256;
  return svgDoc(
    size,
    size,
    `<title>DePaso</title><g transform="scale(${scale})">${symbolGroup(PAL[kind], { small, id: "dm" })}</g>`,
  );
}

function splashMark(kind) {
  // Marca sola, centrada con holgura para que el plugin de splash la escale.
  const s = 1024;
  const symbol = 760;
  const scale = symbol / 256;
  const tx = (s - symbol) / 2 - 8 * scale;
  const ty = (s - symbol) / 2 - 6 * scale;
  return svgDoc(s, s, `<title>DePaso</title><g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${symbolGroup(PAL[kind], { id: "dp" })}</g>`);
}

// --- Salida -----------------------------------------------------------------------------
const files = {
  "symbol-light.svg": svgDoc(256, 256, `<title>DePaso</title>${symbolGroup(PAL.light)}`),
  "symbol-dark.svg": svgDoc(256, 256, `<title>DePaso</title>${symbolGroup(PAL.dark)}`),
  "symbol-small-light.svg": svgDoc(256, 256, `<title>DePaso</title>${symbolGroup(PAL.light, { small: true })}`),
  "lockup-horizontal-light.svg": lockup("light"),
  "lockup-horizontal-dark.svg": lockup("dark"),
  "lockup-stacked-light.svg": stacked("light"),
  "lockup-stacked-dark.svg": stacked("dark"),
  "app-icon.svg": appIconSvg(),
  "adaptive-foreground.svg": adaptiveForeground("dark"),
  "adaptive-monochrome.svg": adaptiveForeground("dark", true),
  "splash-light.svg": splashMark("light"),
  "splash-dark.svg": splashMark("dark"),
  "favicon.svg": svgDoc(256, 256, `<title>DePaso</title>${symbolGroup(PAL.light, { small: true })}`),
};

for (const [name, content] of Object.entries(files)) writeFileSync(join(out, name), content);

const png = (svgName, pngName, width, bg) => {
  const svg = files[svgName];
  const r = new Resvg(svg, { fitTo: { mode: "width", value: width }, ...(bg ? { background: bg } : {}), font: { loadSystemFonts: false } });
  writeFileSync(join(out, pngName), r.render().asPng());
};

png("app-icon.svg", "icon.png", 1024);
png("adaptive-foreground.svg", "adaptive-icon.png", 1024);
png("adaptive-monochrome.svg", "adaptive-icon-monochrome.png", 1024);
png("splash-light.svg", "splash-icon.png", 1024);
png("splash-dark.svg", "splash-icon-dark.png", 1024);
png("favicon.svg", "favicon.png", 96);
png("symbol-light.svg", "logo-mark.png", 512);
png("symbol-dark.svg", "logo-mark-dark.png", 512);
png("lockup-horizontal-light.svg", "logo-wordmark.png", 1600);
png("lockup-horizontal-dark.svg", "logo-wordmark-dark.png", 1600);
png("lockup-stacked-light.svg", "logo-stacked.png", 1000);
png("lockup-stacked-dark.svg", "logo-stacked-dark.png", 1000);
// Fondo de la marca para el fondo adaptativo (color sólido, 432 lo genera Android desde backgroundColor).
console.log("generado en", out);
