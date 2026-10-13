import { Prisma, prisma } from "@depaso/database";
import type { ProductSearchResult } from "@depaso/validation";
import { loadProductImages } from "./productImages";
import { prettifyBrandName, prettifyProductName } from "./productNames";

const MAX_RESULTS = 30;
/** Candidatos que se rankean por popularidad; el resto queda afuera por tier y largo del nombre. */
const POPULARITY_POOL = 400;
/** Palabras que no ayudan a encontrar nada y harían candidatos a casi todo el catálogo. */
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "con", "sin", "y", "en", "x", "para"]);

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
 * que aparecer en el nombre o en la marca.
 */
export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const allTokens = normalized.split(" ");
  const meaningful = allTokens.filter((token) => !STOPWORDS.has(token));
  const tokens = meaningful.length > 0 ? meaningful : allTokens;
  const first = tokens[0] ?? normalized;
  const singleLetter = tokens.length === 1 && first.length < 2;

  const nameExpr = Prisma.sql`COALESCE(p."normalizedName", lower(p.name))`;
  const brandExpr = Prisma.sql`lower(COALESCE(b.name, ''))`;

  const tokenMatches = tokens.map((token) => {
    const pattern = singleLetter ? `${escapeLike(token)}%` : `%${escapeLike(token)}%`;
    return Prisma.sql`(${nameExpr} LIKE ${pattern} OR ${brandExpr} LIKE ${pattern})`;
  });
  const allInName = tokens.map((token) => Prisma.sql`${nameExpr} LIKE ${`%${escapeLike(token)}%`}`);
  const firstEscaped = escapeLike(first);

  const ranked = await prisma.$queryRaw<RankedRow[]>(Prisma.sql`
    WITH cand AS (
      SELECT
        p.id,
        p.name,
        p.category,
        b.name AS "brandName",
        CASE
          WHEN ${nameExpr} = ${normalized} THEN 0
          WHEN ${Prisma.join(allInName, " AND ")} AND ${nameExpr} LIKE ${`${firstEscaped} %`} THEN 1
          WHEN ${Prisma.join(allInName, " AND ")} AND (' ' || ${nameExpr} || ' ') LIKE ${`% ${firstEscaped} %`} THEN 2
          WHEN ${Prisma.join(allInName, " AND ")} THEN 3
          ELSE 4
        END AS tier,
        length(p.name) AS name_length
      FROM products p
      LEFT JOIN brands b ON b.id = p."brandId"
      WHERE ${Prisma.join(tokenMatches, " AND ")}
      ORDER BY tier, name_length
      LIMIT ${POPULARITY_POOL}
    )
    SELECT
      cand.id,
      cand.name,
      cand.category,
      cand."brandName",
      cand.tier::int AS tier,
      (
        SELECT count(*)::int
        FROM product_variants v
        JOIN prices pr ON pr."productVariantId" = v.id
        WHERE v."productId" = cand.id AND pr.status <> 'STALE'
      ) AS popularity
    FROM cand
    ORDER BY cand.tier, popularity DESC, cand.name_length, cand.name
    LIMIT ${MAX_RESULTS}
  `);

  if (ranked.length === 0) return [];

  const ids = ranked.map((row) => row.id);
  const [variants, images] = await Promise.all([
    prisma.productVariant.findMany({
      where: { productId: { in: ids } },
      select: { id: true, productId: true, name: true, unit: true, unitSize: true },
    }),
    loadProductImages(ids),
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
