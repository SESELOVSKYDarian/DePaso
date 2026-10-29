import type { RouteContextResponse } from "@depaso/validation";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";

type Point = { latitude: number; longitude: number };

/** Dos recorridos son el mismo si pasan por los mismos puntos en el mismo orden. */
export function samePoints(a: Point[], b: Point[]): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  return a.every((point, index) => {
    const other = b[index]!;
    return Math.abs(point.latitude - other.latitude) < 0.00005 && Math.abs(point.longitude - other.longitude) < 0.00005;
  });
}

/** La ruta guardada que coincide con el recorrido de hoy, si hay alguna. */
export function findMatchingPreset(presets: RouteContextResponse[], today: TodayWaypoint[]): RouteContextResponse | null {
  return presets.find((preset) => samePoints(preset.stops ?? [], today)) ?? null;
}
