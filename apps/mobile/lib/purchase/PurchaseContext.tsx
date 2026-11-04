import type { OptimizationPlanResponse } from "@depaso/validation";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { startNearbyAlerts, stopNearbyAlerts } from "@/lib/notifications/nearby";
import { isRouteNotificationEnabled, showLocalNotification } from "@/lib/notifications/push";
import { useMidnightReset } from "@/lib/routeContext/useMidnightReset";

type PurchaseContextValue = {
  plan: OptimizationPlanResponse | null;
  checked: Record<string, boolean>;
  start: (plan: OptimizationPlanResponse) => void;
  toggle: (key: string) => void;
  finish: () => void;
  /** Plan que se dibuja en el mapa del recorrido (elegido o en vista previa). */
  routePlan: OptimizationPlanResponse | null;
  setRoutePlan: (plan: OptimizationPlanResponse | null) => void;
  /** Las opciones calculadas (sin desvíos, intermedio, hipereconómico) para poder cambiar de una a otra en el mapa. */
  routePlans: OptimizationPlanResponse[];
  setRoutePlans: (plans: OptimizationPlanResponse[]) => void;
};
/** Aviso en el celular al empezar la compra: cuántas paradas son y dónde es la primera. */
async function notifyRouteStarted(plan: OptimizationPlanResponse): Promise<void> {
  if (!(await isRouteNotificationEnabled())) return;
  const first = [...plan.stops].sort((a, b) => (a.routeIndex ?? a.order) - (b.routeIndex ?? b.order))[0];
  const stops = plan.numberOfStops;
  const saving = plan.estimatedSavings > 0 ? ` Ahorrás ${Math.round(plan.estimatedSavings).toLocaleString("es-AR")}.` : "";
  await showLocalNotification({
    title: "Empezaste tu compra de paso 🛒",
    body: `${stops} ${stops === 1 ? "parada" : "paradas"}${first ? `, primero ${first.storeName}` : ""}.${saving}`,
    data: { type: "route" },
  });
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

/** Modo compra efímero: no altera la lista original ni inventa persistencia antes de definirla. */
export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<OptimizationPlanResponse | null>(null);
  const [routePlan, setRoutePlan] = useState<OptimizationPlanResponse | null>(null);
  const [routePlans, setRoutePlans] = useState<OptimizationPlanResponse[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  // a las 00:00 el recorrido de hoy se reinicia, y el plan armado sobre él también
  useMidnightReset(() => { setPlan(null); setRoutePlan(null); setRoutePlans([]); setChecked({}); void stopNearbyAlerts(); });
  const value = useMemo(() => ({
    plan, checked, routePlan, setRoutePlan, routePlans, setRoutePlans,
    start: (next: OptimizationPlanResponse) => { setPlan(next); setRoutePlan(next); setChecked({}); void notifyRouteStarted(next); void startNearbyAlerts(next); },
    toggle: (key: string) => setChecked((previous) => ({ ...previous, [key]: !previous[key] })),
    finish: () => { setPlan(null); setRoutePlan(null); setChecked({}); void stopNearbyAlerts(); },
  }), [plan, checked, routePlan, routePlans]);
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
export function usePurchase() { const value = useContext(PurchaseContext); if (!value) throw new Error("usePurchase debe usarse dentro de PurchaseProvider"); return value; }
