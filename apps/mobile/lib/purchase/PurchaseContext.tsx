import type { OptimizationPlanResponse } from "@depaso/validation";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type PurchaseContextValue = {
  plan: OptimizationPlanResponse | null;
  checked: Record<string, boolean>;
  start: (plan: OptimizationPlanResponse) => void;
  toggle: (key: string) => void;
  finish: () => void;
};
const PurchaseContext = createContext<PurchaseContextValue | null>(null);

/** Modo compra efímero: no altera la lista original ni inventa persistencia antes de definirla. */
export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<OptimizationPlanResponse | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const value = useMemo(() => ({
    plan, checked,
    start: (next: OptimizationPlanResponse) => { setPlan(next); setChecked({}); },
    toggle: (key: string) => setChecked((previous) => ({ ...previous, [key]: !previous[key] })),
    finish: () => { setPlan(null); setChecked({}); },
  }), [plan, checked]);
  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
export function usePurchase() { const value = useContext(PurchaseContext); if (!value) throw new Error("usePurchase debe usarse dentro de PurchaseProvider"); return value; }
