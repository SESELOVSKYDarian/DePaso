import { PAYMENT_METHOD_SLUGS } from "@depaso/domain";

/** Forma de cada promoción del dataset abierto (github.com/paprikacc/promos-argentina, MIT). */
export interface SourcePromo {
  id: string;
  comercio: string;
  banco?: string | null;
  metodo_pago?: string[] | null;
  beneficio?: string | null;
  tope?: string | null;
  dias?: string[] | null;
  vigencia?: string | null;
  url?: string | null;
  fuente?: string | null;
  confianza?: number | null;
  flags_fraude?: string[] | null;
  score?: number | null;
}

export interface NormalizedPromo {
  externalId: string;
  retailer: string;
  normalizedRetailer: string;
  bank: string | null;
  methodSlugs: string[];
  discountPercent: number;
  capAmount: number | null;
  daysOfWeek: number[];
  validityNote: string | null;
  sourceUrl: string | null;
  source: string | null;
}

export function normalizeRetailer(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const METHOD_ALIASES: Record<string, string> = {
  "cuenta dni": "cuenta-dni",
  "mercado pago": "mercado-pago",
  modo: "modo",
  visa: "visa",
  mastercard: "mastercard",
  "american express": "american-express",
  amex: "american-express",
  cabal: "cabal",
  naranja: "naranja",
  "naranja x": "naranja",
};

/** "Crédito"/"Débito"/"No Especificado" no identifican un medio concreto: se descartan. */
export function toMethodSlugs(raw: string[] | null | undefined): string[] {
  const slugs = new Set<string>();
  for (const entry of raw ?? []) {
    const slug = METHOD_ALIASES[normalizeRetailer(entry)];
    if (slug && PAYMENT_METHOD_SLUGS.includes(slug)) slugs.add(slug);
  }
  return [...slugs];
}

export function parsePercent(raw: string | null | undefined): number | null {
  const match = raw?.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** "$20.000" -> 20000. */
export function parseAmount(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d,]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number(digits);
  return digits && Number.isFinite(value) ? value : null;
}

const DAY_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

export function toDaysOfWeek(raw: string[] | null | undefined): number[] {
  const days = new Set<number>();
  for (const entry of raw ?? []) {
    const index = DAY_INDEX[normalizeRetailer(entry)];
    if (index !== undefined) days.add(index);
  }
  const list = [...days].sort();
  // Los 7 días equivalen a "todos los días": se guarda vacío.
  return list.length === 7 ? [] : list;
}

/** Topes menores a esto son ruido del scraper (ej. "$2", "$75"): se descarta la promo. */
const MIN_PLAUSIBLE_CAP = 500;
const MAX_PLAUSIBLE_CAP = 100_000;
const MAX_PLAUSIBLE_PERCENT = 70;

/** Devuelve `null` si la promo no es confiable o no se puede interpretar. */
export function normalizeSourcePromo(source: SourcePromo): NormalizedPromo | null {
  if (source.flags_fraude && source.flags_fraude.length > 0) return null;
  if (source.confianza != null && source.confianza < 60) return null;

  const percent = parsePercent(source.beneficio);
  if (percent === null || percent <= 0 || percent > MAX_PLAUSIBLE_PERCENT) return null;

  const cap = parseAmount(source.tope);
  if (cap !== null && (cap < MIN_PLAUSIBLE_CAP || cap > MAX_PLAUSIBLE_CAP)) return null;

  const retailer = source.comercio.trim();
  const normalizedRetailer = normalizeRetailer(retailer);
  // Categorías genéricas ("Supermercados") no identifican un comercio real.
  if (!normalizedRetailer || normalizedRetailer === "supermercados") return null;

  return {
    externalId: source.id,
    retailer,
    normalizedRetailer,
    bank: source.banco && source.banco !== "Todos Los Bancos" ? source.banco : null,
    methodSlugs: toMethodSlugs(source.metodo_pago),
    discountPercent: percent,
    capAmount: cap,
    daysOfWeek: toDaysOfWeek(source.dias),
    validityNote: source.vigencia ?? null,
    sourceUrl: source.url ?? null,
    source: source.fuente ?? null,
  };
}

export interface PromoForMatching {
  id: string;
  retailer: string;
  normalizedRetailer: string;
  bank: string | null;
  methodSlugs: string[];
  discountPercent: number;
  capAmount: number | null;
  daysOfWeek: number[];
}

/** Aplica hoy: sin días definidos vale siempre; si no, el día debe estar en la lista. */
export function promoAppliesOnDay(promo: Pick<PromoForMatching, "daysOfWeek">, weekday: number): boolean {
  return promo.daysOfWeek.length === 0 || promo.daysOfWeek.includes(weekday);
}

/**
 * Aplica al usuario sólo si la promo exige un medio de pago concreto y el usuario lo tiene.
 * Las promos sin medio de pago identificable no se descuentan del total: su condición real
 * (banco, tarjeta, fidelidad) no se sabe y sobreestimaría el ahorro.
 */
export function promoAppliesToUser(promo: Pick<PromoForMatching, "methodSlugs">, userMethodSlugs: string[]): boolean {
  return promo.methodSlugs.some((slug) => userMethodSlugs.includes(slug));
}

/** ¿La promo es de este comercio? Compara nombre normalizado en ambos sentidos. */
export function promoMatchesStore(promo: Pick<PromoForMatching, "normalizedRetailer">, storeName: string): boolean {
  const store = normalizeRetailer(storeName);
  if (!store) return false;
  return store === promo.normalizedRetailer || store.includes(promo.normalizedRetailer) || promo.normalizedRetailer.includes(store);
}

export function promoDiscount(subtotal: number, promo: Pick<PromoForMatching, "discountPercent" | "capAmount">): number {
  const raw = (subtotal * promo.discountPercent) / 100;
  return Math.round(Math.min(raw, promo.capAmount ?? Number.POSITIVE_INFINITY) * 100) / 100;
}

/** Devuelve el descuento más grande entre las promos aplicables, o `null` si ninguna aplica. */
export function bestPromoForStore<T extends PromoForMatching>(
  promos: T[],
  input: { storeName: string; subtotal: number; userMethodSlugs: string[]; weekday: number }
): { promo: T; discount: number } | null {
  let best: { promo: T; discount: number } | null = null;
  for (const promo of promos) {
    // Promo de un banco puntual: no se sabe si el usuario es cliente de ese banco.
    if (promo.bank) continue;
    if (!promoMatchesStore(promo, input.storeName)) continue;
    if (!promoAppliesOnDay(promo, input.weekday)) continue;
    if (!promoAppliesToUser(promo, input.userMethodSlugs)) continue;
    const discount = promoDiscount(input.subtotal, promo);
    if (discount > 0 && (!best || discount > best.discount)) best = { promo, discount };
  }
  return best;
}
