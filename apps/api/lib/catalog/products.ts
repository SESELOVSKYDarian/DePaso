import { Prisma, prisma } from "@depaso/database";
import { PRODUCT_TYPE_LABELS } from "@depaso/domain";
import type { ProductFacets, ProductSearchResult } from "@depaso/validation";
import { loadProductImages } from "./productImages";
import { cached } from "./memoryCache";
import { prettifyBrandName, prettifyProductName } from "./productNames";
import {
  escapeLike,
  filterConditions,
  nameExpr,
  normalizeQuery,
  searchTokens,
  textConditions,
  whereClause,
  type ProductSearchFilters,
} from "./productSearchSql";

export type { ProductSearchFilters };

const MAX_RESULTS = 30;
const MAX_FACET_TYPES = 12;
const MAX_FACET_BRANDS = 25;
/** Candidatos que se rankean por popularidad; el resto queda afuera por tier y largo del nombre. */
const POPULARITY_POOL = 400;
interface RankedRow {
  id: string;
  name: string;
  category: string;
  brandName: string | null;
  tier: bigint | number;
  popularity: bigint | number;
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
            WHEN ${allInName} AND CONCAT(' ', ${nameExpr}, ' ') LIKE ${`% ${first} %`} THEN 2
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
        b.name AS brandName,
        ${tierExpr} AS tier,
        p.popularity,
        CHAR_LENGTH(p.name) AS name_length
      FROM products p
      LEFT JOIN brands b ON b.id = p.brandId
      ${whereClause(conditions)}
      ORDER BY tier, p.popularity DESC, name_length
      LIMIT ${POPULARITY_POOL}
    )
    SELECT
      cand.id,
      cand.name,
      cand.category,
      cand.brandName,
      cand.tier AS tier,
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
  const brandConditions = [...text, ...filterConditions({ type: filters.type }), Prisma.sql`p.brandId IS NOT NULL`];

  const [typeRows, brandRows] = await Promise.all([
    prisma.$queryRaw<{ id: string; count: bigint | number }[]>(Prisma.sql`
      SELECT p.productType AS id, count(*) AS count
      FROM products p
      LEFT JOIN brands b ON b.id = p.brandId
      ${whereClause([...typeConditions, Prisma.sql`p.productType IS NOT NULL`])}
      GROUP BY p.productType
      ORDER BY count DESC
      LIMIT ${MAX_FACET_TYPES}
    `),
    prisma.$queryRaw<{ id: string; name: string; count: bigint | number }[]>(Prisma.sql`
      SELECT b.id, b.name, count(*) AS count
      FROM products p
      JOIN brands b ON b.id = p.brandId
      ${whereClause(brandConditions)}
      GROUP BY b.id, b.name
      ORDER BY count DESC, b.name
      LIMIT ${MAX_FACET_BRANDS}
    `),
  ]);

  return {
    types: typeRows.map((row) => ({ id: row.id, label: PRODUCT_TYPE_LABELS[row.id] ?? row.id, count: Number(row.count) })),
    // "S/D", "Genérico" o vacío no son marcas para elegir.
    brands: brandRows.filter((row) => !/^(s\/?d|gen[eé]rico|sin marca|\s*)$/i.test(row.name.trim())).map((row) => ({
      id: row.id,
      name: prettifyBrandName(row.name) ?? row.name,
      count: Number(row.count),
    })),
  };
}

/** Busca productos (con caché). */
export function searchProducts(
  query: string,
  filters: ProductSearchFilters = {},
  options: { withImages?: boolean } = {},
): Promise<ProductSearchResult[]> {
  const key = ["s", normalizeQuery(query), filters.type ?? "", filters.brandId ?? "", options.withImages === false ? 0 : 1].join("|");
  return cached(key, () => searchProductsUncached(query, filters, options));
}

/** Tipos y marcas disponibles para afinar una búsqueda (con caché). */
export function getProductFacets(query: string, filters: ProductSearchFilters = {}): Promise<ProductFacets> {
  const key = ["f", normalizeQuery(query), filters.type ?? "", filters.brandId ?? ""].join("|");
  return cached(key, () => getProductFacetsUncached(query, filters));
}
