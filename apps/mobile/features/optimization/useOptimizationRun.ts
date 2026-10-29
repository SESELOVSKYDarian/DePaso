import type { OptimizationPlanResponse, OptimizationRunResponse, StoreRankingEntryResponse } from "@depaso/validation";
import { useState } from "react";
import { optimizationClient } from "@/lib/apiClient";
import { useDetour } from "@/lib/detour/DetourContext";
import { usePurchase } from "@/lib/purchase/PurchaseContext";
import { useTodayRoute } from "@/lib/routeContext/TodayRouteContext";

/**
 * Pide al servidor las tres opciones de compra para una lista y el recorrido de hoy, y guarda
 * el resultado. La mejor opción intermedia queda dibujada en el mapa.
 */
export function useOptimizationRun(selectedListId: string | null) {
  const { waypoints } = useTodayRoute();
  const { setRoutePlan, setRoutePlans } = usePurchase();
  const { tierLimitsMeters } = useDetour();

  const [plans, setPlans] = useState<OptimizationPlanResponse[] | null>(null);
  const [ranking, setRanking] = useState<StoreRankingEntryResponse[]>([]);
  const [bestPrices, setBestPrices] = useState<OptimizationRunResponse["bestPrices"]>([]);
  const [hasPaymentMethods, setHasPaymentMethods] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRun = Boolean(selectedListId) && waypoints.length >= 2 && !running;

  const run = async () => {
    if (!selectedListId || waypoints.length < 2) return;
    setError(null);
    setRunning(true);
    try {
      const result = await optimizationClient.run({
        shoppingListId: selectedListId,
        routeContext: { waypoints: waypoints.map(({ latitude, longitude }) => ({ latitude, longitude })) },
        transportMode: "CAR",
        tierLimitsMeters,
      });
      // "Sin opciones" es una respuesta válida (no un error del servidor): se explica aparte.
      if (result.plans.length === 0) {
        setError("Nada de esto te queda de paso hoy. Probá con otra lista o sumá una parada a tu ruta.");
        return;
      }
      setPlans(result.plans);
      setRanking(result.ranking);
      setBestPrices(result.bestPrices);
      setHasPaymentMethods(result.hasPaymentMethods);
      // el mejor equilibrio queda dibujado en el mapa del recorrido
      setRoutePlans(result.plans);
      setRoutePlan(result.plans.find((plan) => plan.label === "BALANCED") ?? result.plans[0] ?? null);
    } catch (caught) {
      const code = (caught as { body?: { error?: string } }).body?.error;
      setError(
        code === "NO_CURRENT_PRICES"
          ? "Todavía no encontramos precios vigentes para esta lista."
          : "No pudimos armar tu Top 3. Probá de nuevo en unos instantes.",
      );
    } finally {
      setRunning(false);
    }
  };

  return { plans, ranking, bestPrices, hasPaymentMethods, running, error, canRun, run, reset: () => setPlans(null) };
}
