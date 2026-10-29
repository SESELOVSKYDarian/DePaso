import {
  clearStoredTodayRoute,
  getStoredTodayRoute,
  setStoredTodayRoute,
} from "@/lib/auth/secureStore";
import { dayStamp } from "./dayStamp";
import type { TodayWaypoint } from "./TodayRouteContext";

/** Lo que se guarda en el celular: el recorrido, de quién es y de qué día. */
interface StoredTodayRoute {
  day: string;
  userId: string;
  waypoints: TodayWaypoint[];
}

// El almacén seguro es chico (≈2 KB): se recortan los textos largos y se limita la cantidad.
const MAX_STORED_STOPS = 8;
const MAX_ADDRESS_LENGTH = 80;

function isWaypoint(value: unknown): value is TodayWaypoint {
  const item = value as Partial<TodayWaypoint> | null;
  return (
    typeof item?.key === "string" &&
    typeof item.name === "string" &&
    typeof item.latitude === "number" &&
    typeof item.longitude === "number"
  );
}

/** Recorrido guardado de este usuario, sólo si es de hoy. Si es de otro día, lo borra. */
export async function loadTodayRoute(userId: string, now: Date = new Date()): Promise<TodayWaypoint[]> {
  try {
    const raw = await getStoredTodayRoute();
    if (!raw) return [];
    const stored = JSON.parse(raw) as Partial<StoredTodayRoute>;
    if (stored.day !== dayStamp(now) || stored.userId !== userId) {
      if (stored.day !== dayStamp(now)) await clearStoredTodayRoute();
      return [];
    }
    return (stored.waypoints ?? []).filter(isWaypoint);
  } catch {
    // Valor corrupto o sin almacenamiento: se arranca sin recorrido.
    return [];
  }
}

/** Guarda el recorrido de hoy; si queda vacío, borra lo guardado. */
export async function saveTodayRoute(userId: string, waypoints: TodayWaypoint[], now: Date = new Date()): Promise<void> {
  try {
    if (waypoints.length === 0) {
      await clearStoredTodayRoute();
      return;
    }
    const compact = waypoints.slice(0, MAX_STORED_STOPS).map((waypoint) => ({
      ...waypoint,
      address: waypoint.address.slice(0, MAX_ADDRESS_LENGTH),
    }));
    const stored: StoredTodayRoute = { day: dayStamp(now), userId, waypoints: compact };
    await setStoredTodayRoute(JSON.stringify(stored));
  } catch {
    // Si no se puede guardar, el recorrido sigue vivo en memoria: sólo no sobrevive a un reinicio.
  }
}
