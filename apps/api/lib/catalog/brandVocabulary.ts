import { prisma } from "@depaso/database";
import { prettifyBrandName } from "./productNames";
import type { BrandEntry } from "./phonetic";

const CACHE_MS = 30 * 60 * 1000;
const MIN_PRODUCTS = 8;
const MAX_BRANDS = 600;
const SKIP = /^(generico|s\/d|sd|sin marca|primer precio)$/i;

let cache: { at: number; brands: BrandEntry[] } | null = null;

/** Marcas del catálogo con más productos. Se guardan en memoria: cambian muy de vez en cuando. */
export async function loadBrands(): Promise<BrandEntry[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.brands;
  try {
    const rows = await prisma.$queryRaw<{ id: string; name: string; count: bigint | number }[]>`
      SELECT b.id, b.name, count(*) AS count
      FROM products p
      JOIN brands b ON b.id = p.brandId
      GROUP BY b.id, b.name
      HAVING count(*) >= ${MIN_PRODUCTS}
      ORDER BY count DESC
      LIMIT ${MAX_BRANDS}
    `;
    const brands = rows
      .filter((row) => !SKIP.test(row.name.trim()))
      .map((row) => ({ id: row.id, name: row.name, count: Number(row.count) }));
    cache = { at: Date.now(), brands };
    return brands;
  } catch (error) {
    console.error("brand vocabulary failed", error instanceof Error ? error.name : "unknown");
    return cache?.brands ?? [];
  }
}

/** Nombres legibles ("Águila", "La Serenísima") de las marcas más conocidas, para guiar a la voz y a la IA. */
export async function topBrandNames(limit: number): Promise<string[]> {
  const brands = await loadBrands();
  const names: string[] = [];
  for (const brand of brands) {
    const pretty = prettifyBrandName(brand.name);
    if (pretty && !names.includes(pretty)) names.push(pretty);
    if (names.length >= limit) break;
  }
  return names;
}
