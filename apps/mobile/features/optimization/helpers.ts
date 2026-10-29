import type { OptimizationPlanResponse } from "@depaso/validation";

type PlanLabel = OptimizationPlanResponse["label"];

/** Nombre, bajada e ícono de cada una de las tres opciones de compra. */
export const PLAN_LABELS = {
  FASTEST: { title: "Sin desvíos", subtitle: "A 2 cuadras de tu camino como mucho", icon: "flash-outline" as const },
  BALANCED: { title: "Intermedio", subtitle: "Algunos desvíos, más ahorro", icon: "sparkles-outline" as const },
  CHEAPEST: { title: "Hipereconómico", subtitle: "Lo más barato, sin importar tu ruta", icon: "wallet-outline" as const },
};

/** Por qué una opción no aparece, para cada nivel. */
export const UNAVAILABLE_TEXT: Record<PlanLabel, string> = {
  FASTEST: "Ningún comercio con tus productos te queda a 2 cuadras del camino.",
  BALANCED: "No encontramos comercios con tus productos a un desvío razonable.",
  CHEAPEST: "Todavía no hay precios para armar esta opción.",
};

/** Orden en que se muestran las opciones. */
export const PLAN_ORDER: PlanLabel[] = ["FASTEST", "BALANCED", "CHEAPEST"];

/** Una cuadra ronda los 100 m: "A 2 cuadras de tu camino". */
export function blocksFromRoute(meters: number): string {
  const count = Math.round(meters / 100);
  return count < 1 ? "Sobre tu camino" : `A ${count} ${count === 1 ? "cuadra" : "cuadras"} de tu camino`;
}

/** Precio en pesos con formato argentino. */
export function money(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

/** Distancia extra del plan: "350 m extra" o "1.2 km extra". */
export function extraDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m extra` : `${(meters / 1000).toFixed(1)} km extra`;
}
