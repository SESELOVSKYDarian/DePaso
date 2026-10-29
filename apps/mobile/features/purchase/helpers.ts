import type { OptimizationPlanResponse } from "@depaso/validation";
import { confidenceLabel, formatRecency, sourceTypeLabel } from "@/lib/priceDisclosure";

export type PlanStop = OptimizationPlanResponse["stops"][number];
export type PlanItem = PlanStop["items"][number];

/** Clave de un producto dentro de un comercio: sirve para tildarlo. */
export function itemKey(stop: PlanStop, item: PlanItem): string {
  return `${stop.storeBranchId}:${item.productId}`;
}

/** De dónde sale el precio, qué tan confiable es y de cuándo es: "Fuente oficial (SEPA) · hace 1 día". */
export function priceMeta(item: PlanItem): string {
  const parts = [sourceTypeLabel(item.sourceType), confidenceLabel(item.confidence), formatRecency(item.reportedAt)].filter(
    (part): part is string => part !== null,
  );
  return parts.join(" · ");
}

/** Cuánto suman los productos de un comercio. */
export function stopSubtotal(stop: PlanStop): number {
  return stop.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

/** Precio en pesos sin decimales, con separador de miles argentino. */
export function pesos(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}
