import { Prisma, prisma } from "@depaso/database";
import { PRODUCT_TYPE_LABELS } from "@depaso/domain";
import type { ProductFacets, ProductSearchResult } from "@depaso/validation";
import { loadProductImages } from "./productImages";
import { prettifyBrandName, prettifyProductName } from "./productNames";

const MAX_RESULTS = 30;
const MAX_FACET_TYPES = 12;
const MAX_FACET_BRANDS = 25;
/** Candidatos que se rankean por popularidad; el resto queda afuera por tier y largo del nombre. */
const POPULARITY_POOL = 400;
/** Palabras que no ayudan a encontrar nada y harían candidatos a casi todo el catálogo. */
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "con", "sin", "y", "en", "x", "para"]);

export interface ProductSearchFilters {
  /** Id de tipo (`"gaseosa"`, `"vino"`…), ver `@depaso/domain`. */
  type?: string | undefined;
  brandId?: string | undefined;
}

interface RankedRow {
  id: string;
  name: string;
  category: string;
  brandName: string | null;
  tier: number;
  popularity: number;
}

/** Minúsculas, sin acentos, espacios colapsados — igual que `Product.normalizedName`. */
function normalizeQuery(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeLike(token: string): string {
  return token.replace(/[\\%_]/g, (char) => `\\${char}`);
}

const nameExpr = Prisma.sql`COALESCE(p."normalizedName", lower(p.name))`;
const brandExpr = Prisma.sql`lower(COALESCE(b.name, ''))`;

/** Palabras de la búsqueda que realmente filtran (sin conectores). */
function searchTokens(normalized: string): string[] {
  if (!normalized) return [];
  const all = normalized.split(" ");
  const meaningful = all.filter((token) => !STOPWORDS.has(token));
  return meaningful.length > 0 ? meaningful : all;
}

/** Condiciones que dependen de las palabras buscadas (nombre o marca). */
function textConditions(tokens: string[]): Prisma.Sql[] {
  const singleLetter = tokens.length === 1 && (tokens[0]?.length ?? 0) < 2;
  return tokens.map((token) => {
    const pattern = singleLetter ? `${escapeLike(token)}%` : `%${escapeLike(token)}%`;
    return Prisma.sql`(${nameExpr} LIKE ${pattern} OR ${brandExpr} LIKE ${pattern})`;
  });
}

function filterConditions(filters: ProductSearchFilters): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];
  if (filters.type) conditions.push(Prisma.sql`p."productType" = ${filters.type}`);
  if (filters.brandId) conditions.push(Prisma.sql`p."brandId" = ${filters.brandId}`);
  return conditions;
}

function whereClause(conditions: Prisma.Sql[]): Prisma.Sql {
  return conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;
}

/**
 * Búsqueda de catálogo para armar la lista de compras. Lo que busca la gente es el producto
 * genérico ("arroz"), no la última marca que lo trae en el nombre, así que el orden es:
 *
 *  1. nombre exacto,
 *  2. el nombre empieza con la palabra buscada ("Arroz largo fino…"),
 *  3. la palabra aparece entera dentro del nombre ("Galleta de arroz"),
 *  4. aparece como parte de otra palabra,
 *  5. sólo coincide por la marca.
 *
 * Dentro de cada grupo van primero los que más comercios publican (el producto "de verdad"
 * del barrio) y, a igualdad, el nombre más corto. Todas las palabras de la búsqueda tienen
 * que aparecer en el nombre o en la marca. Con `filters` se acota por tipo y/o marca; sin
 * texto de búsqueda alcanza con un filtro (explorar "Gaseosas" sin escribir nada).
 */
async function searchProductsUncached(
  query: string,
  filters: ProductSearchFilters = {},
  options: { withImages?: boolean } = {},
): Promise<ProductSearchResult[]> {
  const normalized = normalizeQuery(query);
  const tokens = searchTokens(normalized);
  const extra = filterConditions(filters);
  if (tokens.length === 0 && extra.length === 0) return [];

  const conditions = [...textConditions(tokens), ...extra];

  const tierExpr =
    tokens.length === 0
      ? Prisma.sql`1`
      : (() => {
          const first = escapeLike(tokens[0] ?? normalized);
          const allInName = Prisma.join(
            tokens.map((token) => Prisma.sql`${nameExpr} LIKE ${`%${escapeLike(token)}%`}`),
            " AND ",
          );
          return Prisma.sql`CASE
            WHEN ${nameExpr} = ${normalized} THEN 0
            WHEN ${allInName} AND ${nameExpr} LIKE ${`${first} %`} THEN 1
            WHEN ${allInName} AND (' ' || ${nameExpr} || ' ') LIKE ${`% ${first} %`} THEN 2
            WHEN ${allInName} THEN 3
            ELSE 4
          END`;
        })();

  const ranked = await prisma.$queryRaw<RankedRow[]>(Prisma.sql`
    WITH cand AS (
      SELECT
        p.id,
        p.name,
        p.category,
        b.name AS "brandName",
        ${tierExpr} AS tier,
        p.popularity,
        length(p.name) AS name_length
      FROM products p
      LEFT JOIN brands b ON b.id = p."brandId"
      ${whereClause(conditions)}
      ORDER BY tier, p.popularity DESC, name_length
      LIMIT ${POPULARITY_POOL}
    )
    SELECT
      cand.id,
      cand.name,
      cand.category,
      cand."brandName",
      cand.tier::int AS tier,
      cand.popularity
    FROM cand
    ORDER BY cand.tier, cand.popularity DESC, cand.name_length, cand.name
    LIMIT ${MAX_RESULTS}
  `);

  if (ranked.length === 0) return [];

  const ids = ranked.map((row) => row.id);
  const [variants, images] = await Promise.all([
    prisma.productVariant.findMany({
      where: { productId: { in: ids } },
      select: { id: true, productId: true, name: true, unit: true, unitSize: true },
    }),
    options.withImages === false ? Promise.resolve(new Map<string, string>()) : loadProductImages(ids),
  ]);
  const variantsByProduct = new Map<string, typeof variants>();
  for (const variant of variants) {
    const bucket = variantsByProduct.get(variant.productId) ?? [];
    bucket.push(variant);
    variantsByProduct.set(variant.productId, bucket);
  }

  return ranked.map((row) => ({
    id: row.id,
    name: prettifyProductName(row.name),
    category: row.category,
    brandName: prettifyBrandName(row.brandName),
    imageUrl: images.get(row.id) ?? null,
    variants: (variantsByProduct.get(row.id) ?? []).map((variant) => ({
      id: variant.id,
      name: variant.name,
      unit: variant.unit,
      unitSize: variant.unitSize,
    })),
  }));
}

/**
 * Opciones de filtro para una búsqueda, con cuántos productos tiene cada una:
 *  - tipos: sobre lo que matchea el texto (y la marca elegida, si hay), para poder cambiar de tipo;
 *  - marcas: sobre lo que matchea el texto y el tipo elegido.
 * Así cada lista se arma sin el filtro propio y siempre se puede cambiar o quitar.
 */
async function getProductFacetsUncached(query: string, filters: ProductSearchFilters = {}): Promise<ProductFacets> {
  const tokens = searchTokens(normalizeQuery(query));
  const text = textConditions(tokens);

  const typeConditions = [...text, ...filterConditions({ brandId: filters.brandId })];
  const brandConditions = [...text, ...filterConditions({ type: filters.type }), Prisma.sql`p."brandId" IS NOT NULL`];

  const [typeRows, brandRows] = await Promise.all([
    prisma.$queryRaw<{ id: string; count: number }[]>(Prisma.sql`
      SELECT p."productType" AS id, count(*)::int AS count
      FROM products p
      LEFT JOIN brands b ON b.id = p."brandId"
      ${whereClause([...typeConditions, Prisma.sql`p."productType" IS NOT NULL`])}
      GROUP BY p."productType"
      ORDER BY count DESC
      LIMIT ${MAX_FACET_TYPES}
    `),
    prisma.$queryRaw<{ id: string; name: string; count: number }[]>(Prisma.sql`
      SELECT b.id, b.name, count(*)::int AS count
      FROM products p
      JOIN brands b ON b.id = p."brandId"
      ${whereClause(brandConditions)}
      GROUP BY b.id, b.name
      ORDER BY count DESC, b.name
      LIMIT ${MAX_FACET_BRANDS}
    `),
  ]);

  return {
    types: typeRows.map((row) => ({ id: row.id, label: PRODUCT_TYPE_LABELS[row.id] ?? row.id, count: row.count })),
    // "S/D", "Genérico" o vacío no son marcas para elegir.
    brands: brandRows.filter((row) => !/^(s\/?d|gen[eé]rico|sin marca|\s*)$/i.test(row.name.trim())).map((row) => ({
      id: row.id,
      name: prettifyBrandName(row.name) ?? row.name,
      count: row.count,
    })),
  };
}

/**
 * Caché en memoria de búsquedas y facetas: el catálogo cambia una vez por día (import de SEPA)
 * y la misma caja ("Gaseosas") la abren muchas personas. Diez minutos alcanzan y evitan que
 * cada toque vuelva a recorrer la base. Vive por instancia de la función, no se comparte.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 400;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  // Si falla no se guarda: el próximo intento vuelve a consultar.
  value.catch(() => cache.delete(key));
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  return value;
}

export function searchProducts(
  query: string,
  filters: ProductSearchFilters = {},
  options: { withImages?: boolean } = {},
): Promise<ProductSearchResult[]> {
  const key = ["s", normalizeQuery(query), filters.type ?? "", filters.brandId ?? "", options.withImages === false ? 0 : 1].join("|");
  return cached(key, () => searchProductsUncached(query, filters, options));
}

export function getProductFacets(query: string, filters: ProductSearchFilters = {}): Promise<ProductFacets> {
  const key = ["f", normalizeQuery(query), filters.type ?? "", filters.brandId ?? ""].join("|");
  return cached(key, () => getProductFacetsUncached(query, filters));
}
