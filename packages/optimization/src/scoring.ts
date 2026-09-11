import type { OptimizationMode } from "@depaso/types";
import type { OptimizationWeights } from "./types";
import type { ResolvedCombo } from "./offers";
import type { Deviation } from "./deviation";

/**
 * Pesos por defecto de cada modo (sección 60 del master prompt). Configurables — nunca se
 * suman $ + km + min directo (regla 61): cada dimensión se normaliza 0..1 antes de pesar.
 */
export const WEIGHT_PROFILES: Record<OptimizationMode, OptimizationWeights> = {
  BALANCED: { monetary: 0.3, route: 0.3, convenience: 0.15, preference: 0.15, confidence: 0.1 },
  CHEAPEST: { monetary: 0.55, route: 0.15, convenience: 0.1, preference: 0.1, confidence: 0.1 },
  FASTEST: { monetary: 0.1, route: 0.45, convenience: 0.3, preference: 0.05, confidence: 0.1 },
};

const MAX_STOPS = 3;

/**
 * Escala de referencia para normalizar el desvío (metros). Se usa una normalización suave
 * `d / (d + REFERENCE)` en vez de dividir por el máximo del set de candidatos: dividir por
 * el máximo hace que el mismo desvío absoluto puntúe distinto según qué otros comercios
 * existan ese día, lo cual es inestable. Con la escala fija, ~4.5 km de desvío ya se lee
 * como "bastante" (norm ≈0.5) y unos cientos de metros como "poco" — calibrado para que el
 * Caso A (+10 km vs +300 m) y el Caso B (+1 km con $8.000 de ahorro) del master prompt
 * (sección 87) den el resultado esperado bajo BALANCED. Valor a recalibrar con datos
 * reales de Mar del Plata (NO DEFINIDO en la documentación de producto).
 */
const ROUTE_DEVIATION_REFERENCE_METERS = 4500;

/**
 * Penalización dura por productos faltantes — no configurable por modo. Los 5 pesos de
 * cada perfil suman 1.0, así que con `missingRatio=1` (todo faltante) un valor >1 acá
 * garantiza que ningún plan incompleto le gane a uno completo sólo por parecer "barato"
 * (un carrito vacío no es la compra más barata). Evita que un plan incompleto gane sólo
 * por precio — complementa el Caso E (baja confianza también penaliza).
 */
const MISSING_PRODUCT_PENALTY = 2;

export interface ScoringContext {
  maxMonetary: number;
  totalPreferredItems: number;
  totalShoppingListItems: number;
}

export function scoreRawPlan(
  resolved: ResolvedCombo,
  deviation: Deviation,
  numberOfStops: number,
  weights: OptimizationWeights,
  ctx: ScoringContext
): number {
  const monetaryNorm = ctx.maxMonetary > 0 ? resolved.totalProductCost / ctx.maxMonetary : 0;
  const routeNorm =
    deviation.additionalDistanceMeters /
    (deviation.additionalDistanceMeters + ROUTE_DEVIATION_REFERENCE_METERS);
  const convenienceNorm = MAX_STOPS > 1 ? (numberOfStops - 1) / (MAX_STOPS - 1) : 0;
  const preferenceNorm =
    ctx.totalPreferredItems > 0 ? resolved.brokenPreferredCount / ctx.totalPreferredItems : 0;
  const confidenceNorm = 1 - resolved.avgConfidenceScore;
  const missingRatio =
    ctx.totalShoppingListItems > 0
      ? resolved.missingProductIds.length / ctx.totalShoppingListItems
      : 0;

  return (
    weights.monetary * monetaryNorm +
    weights.route * routeNorm +
    weights.convenience * convenienceNorm +
    weights.preference * preferenceNorm +
    weights.confidence * confidenceNorm +
    MISSING_PRODUCT_PENALTY * missingRatio
  );
}
