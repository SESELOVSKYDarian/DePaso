import type { NearbyStore, OptimizationPlanResponse } from "@depaso/validation";

/** Debajo de esto se considera que el comercio está sobre el camino. */
export const RIGHT_ON_ROUTE_METERS = 120;

export function formatDetour(store: NearbyStore): string {
  if (store.detourMeters < RIGHT_ON_ROUTE_METERS) return "Justo de paso";
  const minutes = Math.max(1, Math.round(store.detourSeconds / 60));
  const meters =
    store.detourMeters < 1000 ? `${Math.round(store.detourMeters / 10) * 10} m` : `${(store.detourMeters / 1000).toFixed(1)} km`;
  return `+${minutes} min · ${meters}`;
}

export const money = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

/** Una cuadra en Argentina ronda los 100 m: "a 2 cuadras" se entiende mejor que "a 200 m". */
export function formatBlocks(meters: number | undefined): string {
  if (meters === undefined) return "";
  const blocks = Math.round(meters / 100);
  if (blocks < 1) return "Sobre tu camino";
  return `A ${blocks} ${blocks === 1 ? "cuadra" : "cuadras"} de tu camino`;
}

export function sameBase(plan: OptimizationPlanResponse, waypoints: { latitude: number; longitude: number }[]): boolean {
  const route = plan.routeWaypoints;
  if (!route) return false;
  const inserted = new Set(plan.stops.map((stop) => stop.routeIndex));
  const base = route.filter((_, index) => !inserted.has(index));
  return (
    base.length === waypoints.length &&
    base.every(
      (point, index) =>
        Math.abs(point.latitude - waypoints[index]!.latitude) < 1e-6 &&
        Math.abs(point.longitude - waypoints[index]!.longitude) < 1e-6,
    )
  );
}
