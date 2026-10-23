import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getStoredDetourBlocks, setStoredDetourBlocks } from "@/lib/auth/secureStore";

/** Una cuadra en Argentina ronda los 100 m. */
export const METERS_PER_BLOCK = 100;
export const DEFAULT_STRICT_BLOCKS = 2;
export const DEFAULT_INTERMEDIATE_BLOCKS = 15;
export const STRICT_RANGE = { min: 1, max: 5 } as const;
export const INTERMEDIATE_RANGE = { min: 5, max: 40 } as const;

interface DetourContextValue {
  /** Cuadras máximas del nivel "Sin desvíos". */
  strictBlocks: number;
  /** Cuadras máximas del nivel "Intermedio". */
  intermediateBlocks: number;
  /** Metros equivalentes, tal como se mandan al servidor. */
  tierLimitsMeters: { strict: number; intermediate: number };
  setBlocks: (blocks: { strict: number; intermediate: number }) => void;
}

const DetourContext = createContext<DetourContextValue | null>(null);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

/**
 * Cuánto se acepta desviarse del camino en cada nivel de compra. Se pide al crear la cuenta y se
 * cambia en Perfil → "Cuánto me desvío". Vive en el dispositivo; sin elegir, rigen 2 y 15 cuadras.
 */
export function DetourProvider({ children }: { children: ReactNode }) {
  const [strictBlocks, setStrict] = useState(DEFAULT_STRICT_BLOCKS);
  const [intermediateBlocks, setIntermediate] = useState(DEFAULT_INTERMEDIATE_BLOCKS);

  useEffect(() => {
    let cancelled = false;
    void getStoredDetourBlocks()
      .then((stored) => {
        if (cancelled || !stored) return;
        setStrict(clamp(stored.strict, STRICT_RANGE.min, STRICT_RANGE.max));
        setIntermediate(clamp(stored.intermediate, INTERMEDIATE_RANGE.min, INTERMEDIATE_RANGE.max));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const setBlocks = useCallback((next: { strict: number; intermediate: number }) => {
    const strict = clamp(next.strict, STRICT_RANGE.min, STRICT_RANGE.max);
    const intermediate = clamp(next.intermediate, INTERMEDIATE_RANGE.min, INTERMEDIATE_RANGE.max);
    setStrict(strict);
    setIntermediate(intermediate);
    void setStoredDetourBlocks({ strict, intermediate }).catch(() => undefined);
  }, []);

  const value = useMemo<DetourContextValue>(
    () => ({
      strictBlocks,
      intermediateBlocks,
      tierLimitsMeters: { strict: strictBlocks * METERS_PER_BLOCK, intermediate: intermediateBlocks * METERS_PER_BLOCK },
      setBlocks,
    }),
    [strictBlocks, intermediateBlocks, setBlocks],
  );

  return <DetourContext.Provider value={value}>{children}</DetourContext.Provider>;
}

export function useDetour(): DetourContextValue {
  const value = useContext(DetourContext);
  if (!value) throw new Error("useDetour debe usarse dentro de <DetourProvider>");
  return value;
}
