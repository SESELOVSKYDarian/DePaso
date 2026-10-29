import { findStoresAlongRoute, haversine, type LatLng } from "./nearbyStores";

export interface PlanStopInput {
  storeBranchId: string;
  storeName: string;
  branchName: string;
  order: number;
}

export interface BranchInfo extends LatLng {
  address: string;
}

export interface PlanStopRoute {
  address: string;
  latitude: number;
  longitude: number;
  distanceFromRouteMeters: number;
  detourMeters: number;
  detourSeconds: number;
  /** Posición de la parada en `routeWaypoints`. */
  routeIndex: number;
}

/**
 * Mete las paradas de compra en el recorrido, cada una donde menos distancia agrega ("inserción
 * más barata", sin tocar origen ni destino), y calcula para cada parada cuánto queda del camino
 * y cuánto hay que desviarse. Devuelve el recorrido completo y los datos de cada parada, en
 * el mismo orden que `stops`. Las paradas sin ubicación conocida se omiten.
 */
export function buildPlanRoute<T extends PlanStopInput>(
  baseWaypoints: LatLng[],
  stops: T[],
  branches: Map<string, BranchInfo>,
): { routeWaypoints: LatLng[]; stops: (T & Partial<PlanStopRoute>)[] } {
  const route: LatLng[] = baseWaypoints.map((point) => ({ latitude: point.latitude, longitude: point.longitude }));
  const inserted = new Map<string, LatLng>();

  for (const stop of [...stops].sort((a, b) => a.order - b.order)) {
    const branch = branches.get(stop.storeBranchId);
    if (!branch) continue;
    const point = { latitude: branch.latitude, longitude: branch.longitude };
    let bestIndex = 1;
    let bestExtra = Infinity;
    for (let i = 1; i < route.length; i += 1) {
      const extra = haversine(route[i - 1]!, point) + haversine(point, route[i]!) - haversine(route[i - 1]!, route[i]!);
      if (extra < bestExtra) {
        bestExtra = extra;
        bestIndex = i;
      }
    }
    route.splice(bestIndex, 0, point);
    inserted.set(stop.storeBranchId, point);
  }

  const measured = findStoresAlongRoute(
    baseWaypoints,
    [...inserted.keys()].map((id) => {
      const branch = branches.get(id)!;
      return { branchId: id, storeName: "", branchName: "", address: branch.address, latitude: branch.latitude, longitude: branch.longitude };
    }),
    Number.POSITIVE_INFINITY,
  );
  const byBranch = new Map(measured.map((entry) => [entry.branchId, entry]));

  return {
    routeWaypoints: route,
    stops: stops.map((stop) => {
      const point = inserted.get(stop.storeBranchId);
      const branch = branches.get(stop.storeBranchId);
      const metrics = byBranch.get(stop.storeBranchId);
      if (!point || !branch || !metrics) return stop;
      return {
        ...stop,
        address: branch.address,
        latitude: point.latitude,
        longitude: point.longitude,
        distanceFromRouteMeters: metrics.distanceFromRouteMeters,
        detourMeters: metrics.detourMeters,
        detourSeconds: metrics.detourSeconds,
        routeIndex: route.indexOf(point),
      };
    }),
  };
}
