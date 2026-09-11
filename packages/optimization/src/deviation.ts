import type { LatLng, RouteProvider, RouteResult } from "@depaso/domain";
import type { TransportMode } from "@depaso/types";

export interface Deviation {
  additionalDistanceMeters: number;
  additionalTimeSeconds: number;
  waypoints: LatLng[];
}

/**
 * Inserción más barata: prueba insertar `candidate` entre cada par de waypoints
 * consecutivos de la ruta base y se queda con la posición que agrega menos distancia.
 * Esto es la métrica central del producto — "desvío adicional", no "distancia desde casa"
 * (sección 63 del master prompt).
 */
export async function computeCheapestInsertion(
  routeProvider: RouteProvider,
  baseWaypoints: LatLng[],
  baseRoute: RouteResult,
  candidate: LatLng,
  transportMode: TransportMode
): Promise<Deviation> {
  let best: { route: RouteResult; waypoints: LatLng[] } | null = null;

  for (let i = 1; i < baseWaypoints.length; i++) {
    const candidateWaypoints = [
      ...baseWaypoints.slice(0, i),
      candidate,
      ...baseWaypoints.slice(i),
    ];
    const route = await routeProvider.computeRoute(candidateWaypoints, transportMode);
    if (!best || route.distanceMeters < best.route.distanceMeters) {
      best = { route, waypoints: candidateWaypoints };
    }
  }

  if (!best) {
    throw new Error("No se pudo calcular una inserción — ruta base inválida");
  }

  return {
    additionalDistanceMeters: Math.max(0, best.route.distanceMeters - baseRoute.distanceMeters),
    additionalTimeSeconds: Math.max(0, best.route.durationSeconds - baseRoute.durationSeconds),
    waypoints: best.waypoints,
  };
}

/**
 * Desvío combinado de insertar varios comercios en la misma ruta. Usa inserción codiciosa
 * secuencial (cada comercio se inserta en su mejor posición dado lo ya insertado) — es una
 * aproximación de TSP, no la solución exacta, suficiente para 1-3 paradas (sección 64).
 */
export async function computeComboDeviation(
  routeProvider: RouteProvider,
  baseWaypoints: LatLng[],
  baseRoute: RouteResult,
  candidates: LatLng[],
  transportMode: TransportMode
): Promise<Deviation> {
  let currentWaypoints = baseWaypoints;

  for (const candidate of candidates) {
    const currentRoute = await routeProvider.computeRoute(currentWaypoints, transportMode);
    const insertion = await computeCheapestInsertion(
      routeProvider,
      currentWaypoints,
      currentRoute,
      candidate,
      transportMode
    );
    currentWaypoints = insertion.waypoints;
  }

  const finalRoute = await routeProvider.computeRoute(currentWaypoints, transportMode);

  return {
    additionalDistanceMeters: Math.max(0, finalRoute.distanceMeters - baseRoute.distanceMeters),
    additionalTimeSeconds: Math.max(0, finalRoute.durationSeconds - baseRoute.durationSeconds),
    waypoints: currentWaypoints,
  };
}
