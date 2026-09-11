import type { RouteProvider } from "@depaso/domain";
import type { TransportMode } from "@depaso/types";
import { haversineMeters } from "./geo";

/**
 * Velocidad promedio urbana por modo de transporte (m/s), usada sólo para estimar tiempo
 * a partir de distancia en el `MockRouteProvider`. Valores de referencia razonables para
 * Mar del Plata, no medidos — documentado como heurística MVP (sección 67 del master
 * prompt: sin API keys, el motor debe poder correr igual).
 */
export const SPEED_MPS_BY_TRANSPORT_MODE: Record<TransportMode, number> = {
  CAR: 11.1, // ~40 km/h
  MOTORCYCLE: 11.1,
  BICYCLE: 4.2, // ~15 km/h
  WALK: 1.3, // ~4.7 km/h
  PUBLIC_TRANSPORT: 6, // ~21.6 km/h efectivo, incluye paradas
};

/**
 * Proveedor de rutas sin dependencias externas: suma distancias en línea recta entre
 * waypoints consecutivos. No calcula calles reales — es un reemplazo funcional mientras no
 * haya integración con Google Routes / Mapbox (packages/domain#RouteProvider los enchufa
 * sin tocar el motor de optimización).
 */
export function createMockRouteProvider(): RouteProvider {
  return {
    async computeRoute(waypoints, transportMode) {
      if (waypoints.length < 2) {
        throw new Error("computeRoute requiere al menos 2 waypoints");
      }
      let distanceMeters = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        distanceMeters += haversineMeters(waypoints[i]!, waypoints[i + 1]!);
      }
      const speed = SPEED_MPS_BY_TRANSPORT_MODE[transportMode];
      const durationSeconds = distanceMeters / speed;
      return {
        distanceMeters,
        durationSeconds,
        orderedWaypoints: waypoints,
        polyline: null,
      };
    },
  };
}
