import { paymentMethodLabel } from "@depaso/domain";
import { prisma } from "@depaso/database";
import type { AppliedPromo } from "@depaso/validation";
import { bestPromoForStore } from "./paymentPromos";

const DISCLAIMER = "Promo informada por la fuente: confirmá condiciones, tope y vigencia en el comercio antes de pagar.";
const DAY_NAMES = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];

interface PlanStopLike {
  storeName: string;
  items: { unitPrice: number; quantity: number }[];
}

interface PlanLike {
  totalProductCost: number;
  estimatedEffectiveCost: number;
  estimatedSavings: number;
  stops: PlanStopLike[];
}

/** Día de la semana (0 = domingo) en la hora de Argentina. */
export function argentinaWeekday(now: Date): number {
  const name = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

/**
 * Descuenta de cada plan las promos de bancos/billeteras que le corresponden al usuario según
 * los medios de pago que declaró. Sin medios de pago cargados, los planes salen intactos.
 */
export async function applyPaymentPromos<T extends PlanLike>(
  plans: T[],
  userId: string,
  now: Date = new Date()
): Promise<(T & { promoSavings: number; appliedPromos: AppliedPromo[] })[]> {
  const methods = await prisma.userPaymentMethod.findMany({ where: { userId } });
  const userMethodSlugs = methods.map((method: (typeof methods)[number]) => method.methodSlug);
  const none = plans.map((plan) => ({ ...plan, promoSavings: 0, appliedPromos: [] as AppliedPromo[] }));
  if (userMethodSlugs.length === 0) return none;

  const promos = await prisma.paymentPromo.findMany({ where: { active: true } });
  if (promos.length === 0) return none;
  const weekday = argentinaWeekday(now);

  return plans.map((plan) => {
    const appliedPromos: AppliedPromo[] = [];
    let promoSavings = 0;
    for (const stop of plan.stops) {
      const subtotal = stop.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const best = bestPromoForStore(promos, { storeName: stop.storeName, subtotal, userMethodSlugs, weekday });
      if (!best) continue;
      const { promo, discount } = best;
      const methodText = promo.methodSlugs.map(paymentMethodLabel).join(" / ");
      const capText = promo.capAmount ? ` (tope ${formatMoney(promo.capAmount)})` : "";
      const daysText = promo.daysOfWeek.length > 0 ? ` · ${promo.daysOfWeek.map((d: number) => DAY_NAMES[d]).join(", ")}` : "";
      appliedPromos.push({
        retailer: promo.retailer,
        label: `${methodText} · ${promo.discountPercent}%${capText}${daysText}`,
        discountAmount: discount,
        disclaimer: DISCLAIMER,
        sourceUrl: promo.sourceUrl,
      });
      promoSavings += discount;
    }
    return {
      ...plan,
      totalProductCost: Math.max(0, plan.totalProductCost - promoSavings),
      estimatedEffectiveCost: Math.max(0, plan.estimatedEffectiveCost - promoSavings),
      estimatedSavings: plan.estimatedSavings + promoSavings,
      promoSavings,
      appliedPromos,
    };
  });
}
