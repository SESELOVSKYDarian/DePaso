import type { RouteProvider } from "@depaso/domain";
import type { OptimizationMode } from "@depaso/types";
import { generateStoreCombinations } from "./combinations";
import { computeCheapestInsertion, computeComboDeviation, type Deviation } from "./deviation";
import { buildExplanation } from "./explain";
import { createMockRouteProvider } from "./mockRouteProvider";
import { resolveComboOffers, type ResolvedCombo } from "./offers";
import { scoreRawPlan, WEIGHT_PROFILES } from "./scoring";
import type { OptimizationPlanResult, OptimizeInput, StoreCandidateInput } from "./types";

const DEFAULT_MAX_DEVIATION_METERS = 3000;

/**
 * Costo de traslado estimado, sólo para mostrar un número de referencia en
 * `estimatedTravelCost` — NO participa del ranking (regla 61: nunca sumar $ + km/min
 * directo). Variables reales de combustible/vehículo son explícitamente "no MVP"
 * (docs/brand-product/PRODUCT.md, Variables futuras). Valor placeholder documentado.
 */
const PLACEHOLDER_TRAVEL_COST_PER_KM = 150;

interface RawPlan {
  combo: StoreCandidateInput[];
  resolved: ResolvedCombo;
  deviation: Deviation;
}

/**
 * Motor de optimización de DePaso. TypeScript puro (sección 57): no importa React, React
 * Native ni Next.js, y puede correr desde API, tests, workers o scripts. Devuelve siempre
 * el Top 3 (BALANCED / FASTEST / CHEAPEST) — es la salida central del producto (sección 65).
 */
export async function optimizeShoppingList(
  input: OptimizeInput,
  routeProvider: RouteProvider = createMockRouteProvider()
): Promise<OptimizationPlanResult[]> {
  if (input.routeContext.waypoints.length < 2) {
    throw new Error("RouteContext necesita al menos 2 waypoints (ej. Trabajo → Casa)");
  }
  if (input.storeCandidates.length === 0 || input.shoppingList.items.length === 0) {
    return [];
  }

  const baseRoute = await routeProvider.computeRoute(
    input.routeContext.waypoints,
    input.transportMode
  );
  const maxDeviationMeters = input.maxDeviationMeters ?? DEFAULT_MAX_DEVIATION_METERS;
  const requiredStoreBranchIds = new Set(
    input.preferences.storePreferences.filter((p) => p.type === "REQUIRED").map((p) => p.storeBranchId)
  );

  // 1. Filtrar candidatos por corredor de ruta ANTES de generar combinaciones (sección 64).
  const filteredCandidates: StoreCandidateInput[] = [];
  for (const store of input.storeCandidates) {
    const insertion = await computeCheapestInsertion(
      routeProvider,
      input.routeContext.waypoints,
      baseRoute,
      store.location,
      input.transportMode
    );
    if (
      insertion.additionalDistanceMeters <= maxDeviationMeters ||
      requiredStoreBranchIds.has(store.storeBranchId)
    ) {
      filteredCandidates.push(store);
    }
  }

  // 2. Combinaciones de 1 a 3 comercios; REQUIRED se fuerza en todas (restricción dura,
  // aplicada antes del ranking — BUSINESS-RULES.md).
  const combos = generateStoreCombinations(filteredCandidates, requiredStoreBranchIds);
  if (combos.length === 0) return [];

  const totalPreferredItems = input.preferences.productPreferences.filter(
    (p) => p.type === "PREFERRED"
  ).length;

  const rawPlans: RawPlan[] = [];
  for (const combo of combos) {
    const resolved = resolveComboOffers(combo, input.shoppingList, input.preferences);
    const deviation = await computeComboDeviation(
      routeProvider,
      input.routeContext.waypoints,
      baseRoute,
      combo.map((c) => c.location),
      input.transportMode
    );
    rawPlans.push({ combo, resolved, deviation });
  }

  const maxMonetary = Math.max(0, ...rawPlans.map((p) => p.resolved.totalProductCost));
  const scoringCtx = {
    maxMonetary,
    totalPreferredItems,
    totalShoppingListItems: input.shoppingList.items.length,
  };

  // 3. Puntuar cada plan bajo los 3 perfiles de peso y quedarse con el mejor de cada uno.
  const profiles: OptimizationMode[] = ["BALANCED", "FASTEST", "CHEAPEST"];
  const winners = new Map<OptimizationMode, { raw: RawPlan; score: number }>();

  for (const profile of profiles) {
    const weights = {
      ...WEIGHT_PROFILES[profile],
      ...(input.mode === profile ? input.weightsOverride : undefined),
    };

    let best: { raw: RawPlan; score: number } | null = null;
    for (const raw of rawPlans) {
      const score = scoreRawPlan(
        raw.resolved,
        raw.deviation,
        raw.combo.length,
        weights,
        scoringCtx
      );
      if (!best || score < best.score) {
        best = { raw, score };
      }
    }
    if (best) winners.set(profile, best);
  }

  const cheapestCost = winners.get("CHEAPEST")?.raw.resolved.totalProductCost ?? maxMonetary;
  const fastestAdditionalTimeSeconds =
    winners.get("FASTEST")?.raw.deviation.additionalTimeSeconds ?? 0;
  const worstCost = maxMonetary;

  const results: OptimizationPlanResult[] = [];
  for (const profile of profiles) {
    const winner = winners.get(profile);
    if (!winner) continue;
    const { raw, score } = winner;

    const estimatedTravelCost = Math.round(
      (raw.deviation.additionalDistanceMeters / 1000) * PLACEHOLDER_TRAVEL_COST_PER_KM
    );
    const estimatedSavings = Math.max(0, Math.round(worstCost - raw.resolved.totalProductCost));

    results.push({
      label: profile,
      totalProductCost: raw.resolved.totalProductCost,
      estimatedTravelCost,
      estimatedEffectiveCost: raw.resolved.totalProductCost + estimatedTravelCost,
      additionalDistanceMeters: Math.round(raw.deviation.additionalDistanceMeters),
      additionalTimeSeconds: Math.round(raw.deviation.additionalTimeSeconds),
      numberOfStops: raw.combo.length,
      missingProductIds: raw.resolved.missingProductIds,
      priceConfidence: raw.resolved.priceConfidence,
      estimatedSavings,
      stores: raw.combo.map((c) => `${c.storeName} ${c.branchName}`),
      stops: raw.resolved.stops,
      explanation: buildExplanation({
        label: profile,
        storeNames: raw.combo.map((c) => `${c.storeName} ${c.branchName}`),
        additionalDistanceMeters: raw.deviation.additionalDistanceMeters,
        additionalTimeSeconds: raw.deviation.additionalTimeSeconds,
        totalProductCost: raw.resolved.totalProductCost,
        numberOfStops: raw.combo.length,
        cheapestCost,
        fastestAdditionalTimeSeconds,
        estimatedSavings,
      }),
      debugScore: score,
    });
  }

  return results;
}
