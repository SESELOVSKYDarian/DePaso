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

type Promos = Awaited<ReturnType<typeof prisma.paymentPromo.findMany>>;

/** Promos activas + medios de pago del usuario + día: lo necesario para calcular descuentos. */
export interface PromoContext {
  promos: Promos;
  userMethodSlugs: string[];
  weekday: number;
}

/** `null` si el usuario no cargó medios de pago o no hay promos activas (no hay nada que descontar). */
export async function loadPromoContext(userId: string, now: Date = new Date()): Promise<PromoContext | null> {
  const methods = await prisma.userPaymentMethod.findMany({ where: { userId } });
  const userMethodSlugs = methods.map((method: (typeof methods)[number]) => method.methodSlug);
  if (userMethodSlugs.length === 0) return null;
  const promos = await prisma.paymentPromo.findMany({ where: { active: true } });
  if (promos.length === 0) return null;
  return { promos, userMethodSlugs, weekday: argentinaWeekday(now) };
}

/** Cuánto descuentan en total las promos del usuario si compra en estas paradas. */
export function promoDiscountForStops(context: PromoContext | null, stops: PlanStopLike[]): number {
  if (!context) return 0;
  let total = 0;
  for (const stop of stops) {
    const subtotal = stop.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const best = bestPromoForStore(context.promos, {
      storeName: stop.storeName,
      subtotal,
      userMethodSlugs: context.userMethodSlugs,
      weekday: context.weekday,
    });
    if (best) total += best.discount;
  }
  return total;
}

/**
 * Descuenta de cada plan las promos de bancos/billeteras que le corresponden al usuario según
 * los medios de pago que declaró. Sin medios de pago cargados, los planes salen intactos.
 */
export async function applyPaymentPromos<T extends PlanLike>(
  plans: T[],
  userId: string,
  now: Date = new Date(),
  /** Si ya se cargó (para rankear), se reusa en vez de volver a consultar la base. */
  preloaded?: PromoContext | null
): Promise<(T & { promoSavings: number; appliedPromos: AppliedPromo[] })[]> {
  const none = plans.map((plan) => ({ ...plan, promoSavings: 0, appliedPromos: [] as AppliedPromo[] }));
  const context = preloaded !== undefined ? preloaded : await loadPromoContext(userId, now);
  if (!context) return none;
  const { promos, userMethodSlugs, weekday } = context;

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
