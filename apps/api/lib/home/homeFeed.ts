import { loadActivePromos } from "../promos/promoRows";
import { paymentMethodLabel } from "@depaso/domain";
import { Prisma, prisma } from "@depaso/database";
import type { HomeFeedResponse } from "@depaso/validation";
import { listAccessWhere } from "../lists/lists";
import { argentinaWeekday } from "../promos/applyPromos";
import { promoAppliesOnDay, promoAppliesToUser } from "../promos/paymentPromos";
import { prettifyProductName } from "../catalog/productNames";

const WATCHED_PRODUCTS_MAX = 200;
const MAX_PRICE_CHANGES = 8;
const MAX_PROMOS = 6;
/** Cambios más chicos son ruido de redondeo, no una novedad. */
const MIN_CHANGE_PERCENT = 3;
const BIG_PROMO_PERCENT = 25;

interface ChangeRow {
  productId: string;
  productName: string;
  storeName: string;
  previous: number;
  current: number;
}

/**
 * Novedades para Inicio: qué subió o bajó de lo que hay en tus listas (según el historial de
 * precios de los últimos 14 días) y qué promos de bancos/billeteras rigen hoy, primero las de
 * tus medios de pago. Sin historial todavía (el import de precios aún no corrió dos veces) la
 * lista de cambios sale vacía y no se inventa nada.
 */
export async function buildHomeFeed(userId: string, now: Date = new Date()): Promise<HomeFeedResponse> {
  const [items, methods, promos] = await Promise.all([
    prisma.shoppingListItem.findMany({
      where: { shoppingList: { archivedAt: null, ...listAccessWhere(userId) } },
      select: { productId: true },
      distinct: ["productId"],
      take: WATCHED_PRODUCTS_MAX,
    }),
    prisma.userPaymentMethod.findMany({ where: { userId }, select: { methodSlug: true } }),
    loadActivePromos(),
  ]);

  const productIds = items.map((item: (typeof items)[number]) => item.productId);
  const userMethodSlugs = methods.map((method: (typeof methods)[number]) => method.methodSlug);
  const weekday = argentinaWeekday(now);

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

  const priceChanges = changes
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
    .slice(0, MAX_PRICE_CHANGES);

  const homePromos = promos
    // Sin medio de pago concreto ni banco no hay condición que mostrar; sólo ruido.
    .filter((promo: (typeof promos)[number]) => promoAppliesOnDay(promo, weekday) && (promo.methodSlugs.length > 0 || promo.bank))
    .map((promo: (typeof promos)[number]) => {
      const who = promo.methodSlugs.length > 0 ? promo.methodSlugs.map(paymentMethodLabel).join(" / ") : (promo.bank ?? "");
      return {
        id: promo.id,
        retailer: promo.retailer,
        label: `${who} · ${promo.discountPercent}%${promo.capAmount ? ` (tope $${Math.round(promo.capAmount).toLocaleString("es-AR")})` : ""}`,
        discountPercent: promo.discountPercent,
        capAmount: promo.capAmount,
        mine: promoAppliesToUser(promo, userMethodSlugs),
        big: promo.discountPercent >= BIG_PROMO_PERCENT,
      };
    })
    .sort((a, b) => Number(b.mine) - Number(a.mine) || b.discountPercent - a.discountPercent)
    .slice(0, MAX_PROMOS);

  return { priceChanges, promos: homePromos, watchedProducts: productIds.length };
}
