import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { loadTodayRoute, saveTodayRoute } from "./todayRouteStorage";
import { useMidnightReset } from "./useMidnightReset";

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
 * guardados) y de las rutas guardadas con nombre (presets en el servidor), esto es el
 * recorrido de UN día: se guarda en el celular, sobrevive a cerrar la app y se borra solo a
 * las 00:00. Section 31: un lugar temporal nunca pasa a "Mis lugares" por haberse usado.
 */
export function TodayRouteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [waypoints, setWaypointsState] = useState<TodayWaypoint[]>([]);
  /** Hasta leer lo guardado no se escribe nada: si no, un recorrido vacío pisaría al guardado. */
  const hydratedFor = useRef<string | null>(null);

  // al entrar un usuario: recupero su recorrido de hoy; al salir: lo suelto de memoria
  useEffect(() => {
    hydratedFor.current = null;
    if (!userId) {
      setWaypointsState([]);
      return;
    }
    let cancelled = false;
    void loadTodayRoute(userId).then((stored) => {
      if (cancelled) return;
      setWaypointsState(stored);
      hydratedFor.current = userId;
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // cada cambio se guarda en el celular
  useEffect(() => {
    if (userId && hydratedFor.current === userId) void saveTodayRoute(userId, waypoints);
  }, [userId, waypoints]);

  // a las 00:00 arranca un recorrido nuevo
  useMidnightReset(() => setWaypointsState([]));

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
