import { formatDeviation, formatMinutes, formatMoney } from "./format";

export interface ExplanationInput {
  label: "BALANCED" | "FASTEST" | "CHEAPEST";
  storeNames: string[];
  additionalDistanceMeters: number;
  additionalTimeSeconds: number;
  totalProductCost: number;
  numberOfStops: number;
  /** Costo del plan CHEAPEST del mismo set — referencia para "pagás $X más". */
  cheapestCost: number;
  /** Tiempo adicional del plan FASTEST del mismo set — referencia para "X min antes". */
  fastestAdditionalTimeSeconds: number;
  estimatedSavings: number;
}

/**
 * Frases humanas por opción (sección 66 del master prompt) — nunca un score técnico.
 * Ejemplos literales de la fuente: "Te conviene Carrefour porque sólo agrega 350 metros a
 * tu recorrido y cuesta $620 más que la opción más barata." / "Pagás $X más, pero terminás
 * 18 min antes." / "Ahorrás $X, con 2 paradas extra."
 */
export function buildExplanation(input: ExplanationInput): string {
  const storeLabel = input.storeNames.join(" y ");
  const costDiffVsCheapest = Math.round(input.totalProductCost - input.cheapestCost);

  switch (input.label) {
    case "BALANCED": {
      const deviation = formatDeviation(input.additionalDistanceMeters);
      if (costDiffVsCheapest > 0) {
        return `Te conviene ${storeLabel} porque sólo agrega ${deviation} a tu recorrido y cuesta ${formatMoney(costDiffVsCheapest)} más que la opción más barata.`;
      }
      return `Te conviene ${storeLabel}: es la opción más barata y sólo agrega ${deviation} a tu recorrido.`;
    }
    case "FASTEST": {
      const timeSaved = formatMinutes(input.fastestAdditionalTimeSeconds);
      if (costDiffVsCheapest > 0) {
        return `Pagás ${formatMoney(costDiffVsCheapest)} más, pero terminás antes: sólo ${timeSaved} de desvío.`;
      }
      return `Es la opción más rápida y además la más barata: ${timeSaved} de desvío.`;
    }
    case "CHEAPEST": {
      const extraStops = input.numberOfStops - 1;
      const stopsCopy = extraStops > 0 ? `, con ${extraStops} parada${extraStops > 1 ? "s" : ""} extra` : "";
      if (input.estimatedSavings > 0) {
        return `Ahorrás ${formatMoney(input.estimatedSavings)}${stopsCopy}.`;
      }
      return `Es la opción más barata disponible${stopsCopy}.`;
    }
  }
}
