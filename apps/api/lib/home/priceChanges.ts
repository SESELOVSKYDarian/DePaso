import { Prisma, prisma } from "@depaso/database";
import type { HomeFeedResponse } from "@depaso/validation";
import { prettifyProductName } from "../catalog/productNames";

type PriceChange = HomeFeedResponse["priceChanges"][number];

const MAX_PRICE_CHANGES = 8;
/** Cambios más chicos son ruido de redondeo, no una novedad. */
const MIN_CHANGE_PERCENT = 3;

interface ChangeRow {
  productId: string;
  productName: string;
  storeName: string;
  previous: number;
  current: number;
}

/**
 * Qué subió o bajó de estos productos según el historial de precios de los últimos 14 días: por
 * producto se toma el comercio donde más cambió. Sin historial todavía (el import de precios aún
 * no corrió dos veces) devuelve una lista vacía: no se inventa nada.
 */
export async function loadPriceChanges(productIds: string[], now: Date = new Date(), limit: number = MAX_PRICE_CHANGES): Promise<PriceChange[]> {
  const changes =
    productIds.length === 0
      ? []
      : await prisma.$queryRaw<ChangeRow[]>(Prisma.sql`
          SELECT ranked.productId, ranked.productName, ranked.storeName, ranked.previous, ranked.current
          FROM (
            SELECT
              v.productId AS productId,
              p.name AS productName,
              s.name AS storeName,
              CAST(ph.amount AS DOUBLE) AS previous,
              CAST(pr.price AS DOUBLE) AS current,
              ROW_NUMBER() OVER (PARTITION BY v.productId ORDER BY ABS(pr.price - ph.amount) / ph.amount DESC) AS position
            FROM price_history ph
            JOIN prices pr ON pr.id = ph.priceId
            JOIN product_variants v ON v.id = pr.productVariantId
            JOIN products p ON p.id = v.productId
            JOIN store_branches sb ON sb.id = pr.storeBranchId
            JOIN stores s ON s.id = sb.storeId
            WHERE v.productId IN (${Prisma.join(productIds)})
              AND ph.changedAt > ${new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)}
              AND pr.status <> 'STALE'
              AND ph.amount > 0
              AND ph.amount <> pr.price
          ) ranked
          WHERE ranked.position = 1
        `);

  const priceChanges: PriceChange[] = changes
    .map((row) => ({
      productId: row.productId,
      productName: prettifyProductName(row.productName),
      storeName: row.storeName,
      previousPrice: row.previous,
      currentPrice: row.current,
      changePercent: Math.round(((row.current - row.previous) / row.previous) * 1000) / 10,
    }))
    .filter((change) => Math.abs(change.changePercent) >= MIN_CHANGE_PERCENT)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    ;
  return priceChanges.slice(0, limit);
}
