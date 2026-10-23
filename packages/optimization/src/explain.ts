import { formatBlocks, formatDeviation, formatMinutes, formatMoney } from "./format";

export interface ExplanationInput {
  label: "BALANCED" | "FASTEST" | "CHEAPEST";
  storeNames: string[];
  additionalDistanceMeters: number;
  additionalTimeSeconds: number;
  totalProductCost: number;
  numberOfStops: number;
  /** Costo del plan hipereconómico del mismo set — referencia para "pagás $X más". */
  cheapestCost: number;
  estimatedSavings: number;
  /** Lo más lejos que queda un comercio del plan respecto del recorrido (línea recta, metros). */
  maxFromRouteMeters: number;
  /** Descuento por promos de los medios de pago del usuario incluido en la elección. */
  promoDiscount: number;
}

/**
 * Frases humanas por opción (sección 66 del master prompt) — nunca un score técnico.
 */
export function buildExplanation(input: ExplanationInput): string {
  const storeLabel = input.storeNames.join(" y ");
  const moreThanCheapest = Math.round(input.totalProductCost - input.cheapestCost);
  const promo = input.promoDiscount > 0 ? ` Con tus medios de pago ya contamos ${formatMoney(input.promoDiscount)} de promo.` : "";
  const vsCheapest = moreThanCheapest > 0 ? ` Es ${formatMoney(moreThanCheapest)} más que la hipereconómica.` : "";

  switch (input.label) {
    case "FASTEST":
      return `Sin salirte del camino: ${storeLabel} te queda a ${formatBlocks(input.maxFromRouteMeters)} (máximo 2). Lo más barato dentro de eso.${vsCheapest}${promo}`;
    case "BALANCED":
      return `Lo más barato con un desvío razonable: ${storeLabel}, +${formatMinutes(input.additionalTimeSeconds)} y ${formatDeviation(input.additionalDistanceMeters)} extra.${vsCheapest}${promo}`;
    case "CHEAPEST": {
      const stopsCopy = input.numberOfStops > 1 ? `, en ${input.numberOfStops} paradas` : "";
      const savings = input.estimatedSavings > 0 ? ` Ahorrás ${formatMoney(input.estimatedSavings)} contra la opción más cara.` : "";
      return `La ruta más barata para tu lista, sin importar tu recorrido: ${storeLabel}${stopsCopy}. Te desviás ${formatDeviation(input.additionalDistanceMeters)}.${savings}${promo}`;
    }
  }
}
