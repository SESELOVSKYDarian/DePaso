import { Prisma, prisma } from "@depaso/database";
import type { HomeListSummary } from "@depaso/validation";
import { prettifyProductName } from "../catalog/productNames";
import { listAccessWhere } from "../lists/lists";

/** Cuántos productos de la lista se muestran de ejemplo en Inicio. */
const PREVIEW_ITEMS = 4;

/**
 * Resumen de la lista activa del usuario (la que modificó más recientemente, con productos):
 * cuántos productos tiene, algunos de ejemplo y cuánto saldría comprando cada uno en el
 * comercio más barato. `null` si todavía no tiene ninguna lista con productos.
 */
export async function buildListSummary(userId: string): Promise<HomeListSummary | null> {
  const list = await prisma.shoppingList.findFirst({
    where: { archivedAt: null, items: { some: {} }, ...listAccessWhere(userId) },
    orderBy: { updatedAt: "desc" },
    include: { items: true },
  });
  if (!list) return null;

  const productIds = list.items.map((item) => item.productId);
  const [products, cheapest] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
    // El precio más bajo vigente de cada producto de la lista.
    prisma.$queryRaw<{ productId: string; minPrice: number }[]>(Prisma.sql`
      SELECT v.productId AS productId, CAST(MIN(pr.price) AS DOUBLE) AS minPrice
      FROM prices pr
      JOIN product_variants v ON v.id = pr.productVariantId
      WHERE v.productId IN (${Prisma.join(productIds)}) AND pr.status <> 'STALE' AND pr.price > 0
      GROUP BY v.productId
    `),
  ]);

  const nameById = new Map(products.map((product) => [product.id, prettifyProductName(product.name)]));
  const priceById = new Map(cheapest.map((row) => [row.productId, row.minPrice]));

  const pricedItems = list.items.filter((item) => priceById.has(item.productId));
  const cheapestTotal = pricedItems.reduce((sum, item) => sum + (priceById.get(item.productId) ?? 0) * item.quantity, 0);

  return {
    id: list.id,
    name: list.name,
    itemCount: list.items.length,
    previewItems: list.items
      .slice(0, PREVIEW_ITEMS)
      .map((item) => ({ name: nameById.get(item.productId) ?? "Producto", quantity: item.quantity })),
    cheapestTotal: pricedItems.length > 0 ? Math.round(cheapestTotal * 100) / 100 : null,
    pricedItems: pricedItems.length,
  };
}
