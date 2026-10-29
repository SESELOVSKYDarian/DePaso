import { loadActivePromos } from "../promos/promoRows";
import { paymentMethodLabel } from "@depaso/domain";
import { Prisma, prisma } from "@depaso/database";
import type { HomeFeedResponse } from "@depaso/validation";
import { listAccessWhere } from "../lists/lists";
import { argentinaWeekday } from "../promos/applyPromos";
import { promoAppliesOnDay, promoAppliesToUser } from "../promos/paymentPromos";
import { prettifyProductName } from "../catalog/productNames";
import { loadCheapProducts, loadPopularProducts } from "./homeProducts";
import { loadPriceChanges } from "./priceChanges";
import { buildListSummary } from "./listSummary";

const WATCHED_PRODUCTS_MAX = 200;
const MAX_PRICE_CHANGES = 8;
const MAX_PROMOS = 6;
/** Cambios más chicos son ruido de redondeo, no una novedad. */
const MIN_CHANGE_PERCENT = 3;
const BIG_PROMO_PERCENT = 25;


/**
 * Novedades para Inicio: qué subió o bajó de lo que hay en tus listas (según el historial de
 * precios de los últimos 14 días) y qué promos de bancos/billeteras rigen hoy, primero las de
 * tus medios de pago. Sin historial todavía (el import de precios aún no corrió dos veces) la
 * lista de cambios sale vacía y no se inventa nada. Además trae el resumen de tu lista activa y
 * dos tiras de productos (los que hoy están baratos y los más buscados) para que Inicio no
 * quede vacío.
 */
export async function buildHomeFeed(userId: string, now: Date = new Date()): Promise<HomeFeedResponse> {
  const [items, methods, promos, listSummary, cheapToday, popular] = await Promise.all([
    prisma.shoppingListItem.findMany({
      where: { shoppingList: { archivedAt: null, ...listAccessWhere(userId) } },
      select: { productId: true },
      distinct: ["productId"],
      take: WATCHED_PRODUCTS_MAX,
    }),
    prisma.userPaymentMethod.findMany({ where: { userId }, select: { methodSlug: true } }),
    loadActivePromos(),
    buildListSummary(userId),
    loadCheapProducts(),
    loadPopularProducts(),
  ]);

  const productIds = items.map((item: (typeof items)[number]) => item.productId);
  const userMethodSlugs = methods.map((method: (typeof methods)[number]) => method.methodSlug);
  const weekday = argentinaWeekday(now);

  const priceChanges = await loadPriceChanges(productIds, now);

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

  return { priceChanges, promos: homePromos, listSummary, cheapToday, popular, watchedProducts: productIds.length };
}
