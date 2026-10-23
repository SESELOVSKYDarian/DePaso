import type { OptimizationPlanResponse } from "@depaso/validation";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

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
const PurchaseContext = createContext<PurchaseContextValue | null>(null);

/** Modo compra efímero: no altera la lista original ni inventa persistencia antes de definirla. */
export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<OptimizationPlanResponse | null>(null);
  const [routePlan, setRoutePlan] = useState<OptimizationPlanResponse | null>(null);
  const [routePlans, setRoutePlans] = useState<OptimizationPlanResponse[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const value = useMemo(() => ({
    plan, checked, routePlan, setRoutePlan, routePlans, setRoutePlans,
    start: (next: OptimizationPlanResponse) => { setPlan(next); setRoutePlan(next); setChecked({}); },
    toggle: (key: string) => setChecked((previous) => ({ ...previous, [key]: !previous[key] })),
    finish: () => { setPlan(null); setRoutePlan(null); setChecked({}); },
  }), [plan, checked, routePlan, routePlans]);
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
export function usePurchase() { const value = useContext(PurchaseContext); if (!value) throw new Error("usePurchase debe usarse dentro de PurchaseProvider"); return value; }
