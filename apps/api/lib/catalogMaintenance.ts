import { prisma } from "@depaso/database";

/**
 * Recalcula `Product.popularity` (precios vigentes por producto). Se corre cada día después de
 * los imports de precios; la búsqueda ordena por esa columna en vez de contar en cada consulta.
 */
export async function refreshProductPopularity(): Promise<number> {
  return prisma.$executeRaw`
    UPDATE products p
    SET popularity = COALESCE(counts.n, 0)
    FROM (
      SELECT p2.id, c.n
      FROM products p2
      LEFT JOIN (
        SELECT v."productId" AS id, count(*)::int AS n
        FROM product_variants v
        JOIN prices pr ON pr."productVariantId" = v.id
        WHERE pr.status <> 'STALE'
        GROUP BY v."productId"
      ) c ON c.id = p2.id
    ) counts
    WHERE counts.id = p.id AND p.popularity IS DISTINCT FROM COALESCE(counts.n, 0)
  `;
}
