import { prisma } from "@depaso/database";

/**
 * Recalcula `Product.popularity` (precios vigentes por producto). Se corre cada día después de
 * los imports de precios; la búsqueda ordena por esa columna en vez de contar en cada consulta.
 */
export async function refreshProductPopularity(): Promise<number> {
  return prisma.$executeRaw`
    UPDATE products p
    LEFT JOIN (
      SELECT v.productId AS id, count(*) AS n
      FROM product_variants v
      JOIN prices pr ON pr.productVariantId = v.id
      WHERE pr.status <> 'STALE'
      GROUP BY v.productId
    ) c ON c.id = p.id
    SET p.popularity = COALESCE(c.n, 0)
    WHERE p.popularity <> COALESCE(c.n, 0)
  `;
}
