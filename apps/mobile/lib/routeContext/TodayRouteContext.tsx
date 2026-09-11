import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface TodayWaypoint {
  /** Clave estable para listas — no es el id de `UserPlace` cuando es temporal/actual. */
  key: string;
  /** Presente sólo si el waypoint viene de un `UserPlace` guardado. */
  placeId?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  emoji: string;
}

interface TodayRouteContextValue {
  waypoints: TodayWaypoint[];
  setWaypoints: (waypoints: TodayWaypoint[]) => void;
  clear: () => void;
}

const TodayRouteContext = createContext<TodayRouteContextValue | null>(null);

/**
 * "¿Por dónde vas a andar hoy?" (sección 33-35) — a diferencia de `PlacesContext` (lugares
 * guardados, persistidos) y de los `SavedRouteContext` (presets con nombre, persistidos),
 * esto es efímero: vive sólo en memoria de la sesión actual. Section 31: un lugar temporal
 * nunca se guarda solo porque se usó una vez.
 */
export function TodayRouteProvider({ children }: { children: ReactNode }) {
  const [waypoints, setWaypointsState] = useState<TodayWaypoint[]>([]);

  const setWaypoints = useCallback((next: TodayWaypoint[]) => setWaypointsState(next), []);
  const clear = useCallback(() => setWaypointsState([]), []);

  const value = useMemo<TodayRouteContextValue>(
    () => ({ waypoints, setWaypoints, clear }),
    [waypoints, setWaypoints, clear]
  );

  return <TodayRouteContext.Provider value={value}>{children}</TodayRouteContext.Provider>;
}

export function useTodayRoute(): TodayRouteContextValue {
  const ctx = useContext(TodayRouteContext);
  if (!ctx) throw new Error("useTodayRoute debe usarse dentro de <TodayRouteProvider>");
  return ctx;
}
