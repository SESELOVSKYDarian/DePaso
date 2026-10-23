import type { LatLng, RouteProvider } from "@depaso/domain";
import { generateStoreCombinations } from "./combinations";
import { computeComboDeviation, type Deviation } from "./deviation";
import { buildExplanation } from "./explain";
import { decodePolyline, distanceToPathMeters } from "./geo";
import { createMockRouteProvider } from "./mockRouteProvider";
import { resolveComboOffers, type ResolvedCombo } from "./offers";
import type {
  OptimizationPlanResult,
  OptimizeInput,
  PlanStop,
  StoreCandidateInput,
  StoreRankingEntry,
} from "./types";

/** Lejanía máxima al recorrido de cada nivel. 1 cuadra ≈ 100 m: "sin desvíos" = 2 cuadras como mucho. */
export const STRICT_MAX_METERS = 200;
export const INTERMEDIATE_MAX_METERS = 1500;

/** Comercios que entran a evaluar combinaciones por nivel (con 3 paradas son ≈ 500 combinaciones). */
const MAX_CANDIDATES = 14;
/** Una parada más sólo vale la pena si ahorra al menos esto (o el 2 %): no se manda a nadie a otro local por $50. */
const MIN_SAVING_PER_EXTRA_STOP = 500;
const MIN_SAVING_RATIO_PER_EXTRA_STOP = 0.02;
/** Una oferta de baja confianza se castiga hasta un 10 % en el ranking. */
const LOW_CONFIDENCE_PENALTY = 0.1;
const RANKING_SIZE = 10;

/**
 * Costo de traslado estimado, sólo para mostrar un número de referencia en
 * `estimatedTravelCost` — NO participa del ranking (regla 61: nunca sumar $ + km/min
 * directo). Variables reales de combustible/vehículo son explícitamente "no MVP"
 * (docs/brand-product/PRODUCT.md, Variables futuras). Valor placeholder documentado.
 */
const PLACEHOLDER_TRAVEL_COST_PER_KM = 150;

type Tier = "FASTEST" | "BALANCED" | "CHEAPEST";

interface Evaluated {
  combo: StoreCandidateInput[];
  resolved: ResolvedCombo;
  discount: number;
  /** Costo de los productos menos promos de los medios de pago del usuario. */
  effective: number;
  /** `effective` con el castigo por baja confianza: es lo que se compara. */
  adjusted: number;
  missing: number;
  /** Suma de lo lejos que queda cada comercio del recorrido (desempate). */
  fromRouteSum: number;
}

export interface OptimizationOutcome {
  plans: OptimizationPlanResult[];
  /** Los comercios más baratos para comprar toda la lista, con promos y lejanía al recorrido. */
  ranking: StoreRankingEntry[];
}

/**
 * Motor de optimización de DePaso. TypeScript puro (sección 57): no importa React, React
 * Native ni Next.js, y puede correr desde API, tests, workers o scripts.
 *
 * Devuelve hasta 3 planes, uno por nivel de desvío, y en cada uno gana lo MÁS BARATO (precio
 * de los productos menos promos de los medios de pago del usuario):
 *  - `FASTEST` "sin desvíos": sólo comercios a 2 cuadras (200 m) del recorrido o menos;
 *  - `BALANCED` "intermedio": comercios hasta ≈ 15 cuadras (1,5 km) del recorrido;
 *  - `CHEAPEST` "hipereconómico": la ruta más barata para toda la lista, sin importar el recorrido.
 * Un nivel sin ningún comercio con productos de la lista simplemente no aparece.
 */
export async function optimizeWithRanking(
  input: OptimizeInput,
  routeProvider: RouteProvider = createMockRouteProvider(),
): Promise<OptimizationOutcome> {
  if (input.routeContext.waypoints.length < 2) {
    throw new Error("RouteContext necesita al menos 2 waypoints (ej. Trabajo → Casa)");
  }
  if (input.storeCandidates.length === 0 || input.shoppingList.items.length === 0) {
    return { plans: [], ranking: [] };
  }

  const waypoints = input.routeContext.waypoints;
  const baseRoute = await routeProvider.computeRoute(waypoints, input.transportMode);
  const decoded = baseRoute.polyline ? decodePolyline(baseRoute.polyline) : [];
  const path: LatLng[] = decoded.length >= 2 ? decoded : waypoints;

  const requiredIds = new Set(
    input.preferences.storePreferences.filter((p) => p.type === "REQUIRED").map((p) => p.storeBranchId),
  );
  const discountOf = (stops: PlanStop[]) => Math.max(0, input.promoDiscount?.(stops) ?? 0);

  const distanceById = new Map(
    input.storeCandidates.map((store) => [store.storeBranchId, distanceToPathMeters(store.location, path)]),
  );

  const evaluate = (combo: StoreCandidateInput[]): Evaluated => {
    const resolved = resolveComboOffers(combo, input.shoppingList, input.preferences);
    const discount = discountOf(resolved.stops);
    const effective = Math.max(0, resolved.totalProductCost - discount);
    return {
      combo,
      resolved,
      discount,
      effective,
      adjusted: effective * (1 + LOW_CONFIDENCE_PENALTY * (1 - resolved.avgConfidenceScore)),
      missing: resolved.missingProductIds.length,
      fromRouteSum: combo.reduce((sum, store) => sum + (distanceById.get(store.storeBranchId) ?? 0), 0),
    };
  };

  // Ranking de comercios: cuánto cuesta comprar TODA la lista en cada uno (con promos).
  const singles = input.storeCandidates.map((store) => ({ store, evaluated: evaluate([store]) }));
  const ranking: StoreRankingEntry[] = singles
    .filter(({ evaluated }) => evaluated.resolved.stops.length > 0)
    .sort(
      (a, b) =>
        a.evaluated.missing - b.evaluated.missing ||
        a.evaluated.adjusted - b.evaluated.adjusted ||
        a.evaluated.fromRouteSum - b.evaluated.fromRouteSum,
    )
    .slice(0, RANKING_SIZE)
    .map(({ store, evaluated }) => ({
      storeBranchId: store.storeBranchId,
      storeName: store.storeName,
      branchName: store.branchName,
      location: store.location,
      totalCost: Math.round(evaluated.effective),
      promoSavings: Math.round(evaluated.discount),
      coveredCount: input.shoppingList.items.length - evaluated.missing,
      missingCount: evaluated.missing,
      distanceFromRouteMeters: Math.round(distanceById.get(store.storeBranchId) ?? 0),
    }));

  /** Se queda con los comercios más prometedores: los que más cubren y los más baratos por producto. */
  const shortlist = (pool: StoreCandidateInput[]): StoreCandidateInput[] => {
    if (pool.length <= MAX_CANDIDATES) return pool;
    const chosen = new Map<string, StoreCandidateInput>();
    for (const store of pool) if (requiredIds.has(store.storeBranchId)) chosen.set(store.storeBranchId, store);
    const evaluatedPool = pool
      .map((store) => ({ store, evaluated: evaluate([store]) }))
      .sort((a, b) => a.evaluated.missing - b.evaluated.missing || a.evaluated.adjusted - b.evaluated.adjusted);
    for (const { store } of evaluatedPool.slice(0, 8)) chosen.set(store.storeBranchId, store);
    // El más barato de cada producto, aunque su canasta completa no sea buena.
    for (const item of input.shoppingList.items) {
      let cheapest: { store: StoreCandidateInput; price: number } | null = null;
      for (const store of pool) {
        for (const offer of store.offers) {
          if (offer.productId === item.productId && (!cheapest || offer.price < cheapest.price)) {
            cheapest = { store, price: offer.price };
          }
        }
      }
      if (cheapest && chosen.size < MAX_CANDIDATES) chosen.set(cheapest.store.storeBranchId, cheapest.store);
    }
    return [...chosen.values()];
  };

  /**
   * Lo más barato, pero sin mandar a nadie a un local más por una diferencia mínima: una parada
   * menos gana si la más barata no ahorra al menos `tolerancia` por cada parada de más.
   */
  const chooseBest = (evaluated: Evaluated[]): Evaluated | null => {
    if (evaluated.length === 0) return null;
    const minMissing = Math.min(...evaluated.map((e) => e.missing));
    const complete = evaluated.filter((e) => e.missing === minMissing);
    const byCost = (a: Evaluated, b: Evaluated) => a.adjusted - b.adjusted || a.fromRouteSum - b.fromRouteSum;
    const cheapest = [...complete].sort(byCost)[0]!;
    const tolerance = Math.max(MIN_SAVING_PER_EXTRA_STOP, MIN_SAVING_RATIO_PER_EXTRA_STOP * cheapest.adjusted);
    for (let stops = 1; stops < cheapest.combo.length; stops += 1) {
      const fewer = complete.filter((e) => e.combo.length === stops).sort(byCost)[0];
      if (fewer && fewer.adjusted - cheapest.adjusted <= tolerance * (cheapest.combo.length - stops)) return fewer;
    }
    return cheapest;
  };

  const limits: Record<Tier, number> = {
    FASTEST: input.tierLimitsMeters?.strict ?? STRICT_MAX_METERS,
    BALANCED: input.tierLimitsMeters?.intermediate ?? input.maxDeviationMeters ?? INTERMEDIATE_MAX_METERS,
    CHEAPEST: Number.POSITIVE_INFINITY,
  };

  const winners = new Map<Tier, Evaluated>();
  const referenceCost = new Map<Tier, number>();
  for (const tier of ["FASTEST", "BALANCED", "CHEAPEST"] as const) {
    const pool = input.storeCandidates.filter(
      (store) => (distanceById.get(store.storeBranchId) ?? Infinity) <= limits[tier] || requiredIds.has(store.storeBranchId),
    );
    if (pool.length === 0) continue;
    const combos = generateStoreCombinations(shortlist(pool), requiredIds);
    const evaluated = combos.map(evaluate);
    const best = chooseBest(evaluated);
    // Un plan que no cubre ningún producto de la lista no sirve.
    if (!best || best.resolved.stops.length === 0) continue;
    winners.set(tier, best);
    referenceCost.set(
      tier,
      Math.max(...evaluated.filter((e) => e.missing === best.missing).map((e) => e.resolved.totalProductCost)),
    );
  }

  // El desvío real (con el proveedor de rutas) sólo se calcula para los ganadores; si dos niveles
  // eligen lo mismo se calcula una vez. Va en paralelo para no hacer esperar de más.
  const comboKey = (combo: StoreCandidateInput[]) => combo.map((s) => s.storeBranchId).sort().join("|");
  const deviations = new Map<string, Promise<Deviation>>();
  for (const winner of winners.values()) {
    const key = comboKey(winner.combo);
    if (!deviations.has(key)) {
      deviations.set(
        key,
        computeComboDeviation(routeProvider, waypoints, baseRoute, winner.combo.map((c) => c.location), input.transportMode),
      );
    }
  }
  await Promise.all(deviations.values());

  const cheapestCost = winners.get("CHEAPEST")?.resolved.totalProductCost ?? Number.POSITIVE_INFINITY;
  const plans: OptimizationPlanResult[] = [];
  for (const tier of ["FASTEST", "BALANCED", "CHEAPEST"] as const) {
    const winner = winners.get(tier);
    if (!winner) continue;
    const deviation = await deviations.get(comboKey(winner.combo))!;
    const { combo, resolved } = winner;

    const estimatedTravelCost = Math.round((deviation.additionalDistanceMeters / 1000) * PLACEHOLDER_TRAVEL_COST_PER_KM);
    const estimatedSavings = Math.max(0, Math.round((referenceCost.get(tier) ?? 0) - resolved.totalProductCost));
    const storeNames = combo.map((c) => `${c.storeName} ${c.branchName}`);

    plans.push({
      label: tier,
      totalProductCost: resolved.totalProductCost,
      estimatedTravelCost,
      estimatedEffectiveCost: resolved.totalProductCost + estimatedTravelCost,
      additionalDistanceMeters: Math.round(deviation.additionalDistanceMeters),
      additionalTimeSeconds: Math.round(deviation.additionalTimeSeconds),
      numberOfStops: combo.length,
      missingProductIds: resolved.missingProductIds,
      priceConfidence: resolved.priceConfidence,
      estimatedSavings,
      stores: storeNames,
      stops: resolved.stops,
      explanation: buildExplanation({
        label: tier,
        storeNames,
        additionalDistanceMeters: deviation.additionalDistanceMeters,
        additionalTimeSeconds: deviation.additionalTimeSeconds,
        totalProductCost: resolved.totalProductCost,
        numberOfStops: combo.length,
        cheapestCost: Number.isFinite(cheapestCost) ? cheapestCost : resolved.totalProductCost,
        estimatedSavings,
        maxFromRouteMeters: Math.max(...combo.map((c) => distanceById.get(c.storeBranchId) ?? 0)),
        promoDiscount: winner.discount,
      }),
      debugScore: winner.adjusted,
    });
  }

  return { plans, ranking };
}

/** Sólo los planes (ver `optimizeWithRanking` si también se necesita el ranking de comercios). */
export async function optimizeShoppingList(
  input: OptimizeInput,
  routeProvider: RouteProvider = createMockRouteProvider(),
): Promise<OptimizationPlanResult[]> {
  return (await optimizeWithRanking(input, routeProvider)).plans;
}
