/**
 * Corrección fonética de marcas dichas por voz: el reconocimiento escribe "ayla" cuando la
 * persona dijo "Águila". Se compara cómo SUENA la palabra (en español rioplatense), no cómo se
 * escribe, contra la lista de marcas del catálogo.
 */

/** Minúsculas y sin acentos. */
export function stripAccents(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Aproxima el sonido de una palabra: "aguila" -> "agila", "ayla" -> "aila". */
export function phoneticKey(word: string): string {
  let key = stripAccents(word).replace(/[^a-zñ0-9]/g, "");
  key = key
    .replace(/ñ/g, "n")
    .replace(/h/g, "")
    .replace(/qu(?=[ei])/g, "k")
    .replace(/gu(?=[ei])/g, "g")
    .replace(/c(?=[ei])/g, "s")
    .replace(/ll/g, "y")
    .replace(/[zc]/g, (match) => (match === "z" ? "s" : "k"))
    .replace(/v/g, "b")
    .replace(/w/g, "u")
    .replace(/x/g, "ks")
    .replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1");
  return key;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
    }
    previous = current;
  }
  return previous[b.length]!;
}

/** Parecido entre 0 y 1 de cómo suenan dos palabras. */
export function phoneticSimilarity(a: string, b: string): number {
  const keyA = phoneticKey(a);
  const keyB = phoneticKey(b);
  const longest = Math.max(keyA.length, keyB.length);
  if (longest === 0) return 0;
  return 1 - levenshtein(keyA, keyB) / longest;
}

export interface BrandEntry {
  id: string;
  /** Nombre tal como está en el catálogo (p. ej. "AGUILA"). */
  name: string;
  /** Cantidad de productos: ante un empate gana la marca más conocida. */
  count: number;
}

export interface BrandCorrection {
  /** Texto original reemplazado por el nombre de la marca ("ayla" -> "aguila"). */
  term: string;
  brand: BrandEntry;
}

const MIN_BRAND_LENGTH = 4;
const MIN_SIMILARITY = 0.6;
const IGNORED_BRANDS = new Set(["generico", "s/d", "sd", "sin marca"]);

/**
 * Busca la marca que más se parece, al oído, a `token`. Devuelve `null` si ninguna se parece lo
 * suficiente. Las marcas muy cortas ("ala", "tao") no se usan: se parecerían a casi cualquier cosa.
 */
export function closestBrand(token: string, brands: BrandEntry[]): BrandEntry | null {
  return closestBrandScored(token, brands)?.brand ?? null;
}

function closestBrandScored(token: string, brands: BrandEntry[]): { brand: BrandEntry; score: number } | null {
  const key = phoneticKey(token);
  if (key.length < MIN_BRAND_LENGTH - 1) return null;

  let best: { brand: BrandEntry; score: number } | null = null;
  for (const brand of brands) {
    const normalized = stripAccents(brand.name).trim();
    if (normalized.length < MIN_BRAND_LENGTH || IGNORED_BRANDS.has(normalized)) continue;
    // Marcas de varias palabras ("la serenisima"): se compara contra la palabra más larga.
    const words = normalized.split(/\s+/);
    const candidate = words.length > 1 ? words.reduce((a, b) => (b.length > a.length ? b : a)) : normalized;
    if (candidate.length < MIN_BRAND_LENGTH) continue;
    const score = phoneticSimilarity(token, candidate);
    if (score < MIN_SIMILARITY) continue;
    if (!best || score > best.score || (score === best.score && brand.count > best.brand.count)) {
      best = { brand, score };
    }
  }
  return best;
}

/**
 * Para un pedido como "chocolate ayla": se prueba cada palabra y, si suena a una marca conocida,
 * se devuelve cuál. Las palabras con `isKnownWord` verdadero (p. ej. el producto, "chocolate")
 * no se tocan.
 */
export function correctBrandInTerm(
  term: string,
  brands: BrandEntry[],
  isKnownWord: (word: string) => boolean,
): BrandCorrection | null {
  const words = stripAccents(term).split(/\s+/).filter(Boolean);
  let best: { correction: BrandCorrection; score: number } | null = null;
  for (const word of words) {
    if (word.length < MIN_BRAND_LENGTH - 1 || isKnownWord(word)) continue;
    const scored = closestBrandScored(word, brands);
    // Gana la palabra que más suena a una marca, no la primera que se parezca un poco.
    if (scored && (!best || scored.score > best.score)) {
      best = { correction: { term: word, brand: scored.brand }, score: scored.score };
    }
  }
  return best?.correction ?? null;
}
