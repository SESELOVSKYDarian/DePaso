import type { LatLng, RouteProvider, RouteResult } from "@depaso/domain";
import type { TransportMode } from "@depaso/types";

const BASE_URL = "https://api.mapbox.com/directions/v5/mapbox";

export class MapboxRouteError extends Error {}

/**
 * Mapbox Directions no tiene perfil de moto ni de transporte público (sólo
 * `driving`/`walking`/`cycling`). `MOTORCYCLE` se aproxima con `driving` (documentado, no
 * silencioso). `PUBLIC_TRANSPORT` no tiene aproximación razonable — el caller debe usar
 * otro `RouteProvider` (ej. `MockRouteProvider`) para ese modo en vez de mentir con un
 * perfil que no es transporte público real.
 */
const PROFILE_BY_TRANSPORT_MODE: Partial<Record<TransportMode, string>> = {
  CAR: "driving",
  MOTORCYCLE: "driving",
  BICYCLE: "cycling",
  WALK: "walking",
};

interface MapboxDirectionsRoute {
  distance: number;
  duration: number;
  geometry: string;
}

interface MapboxDirectionsResponse {
  routes: MapboxDirectionsRoute[];
}

/**
 * Ruteo real vía Mapbox Directions API (Fase 17) — misma cuenta/token que el geocoding de
 * Fase 28 (100.000 requests/mes gratis, sin tarjeta). Implementa `RouteProvider`
 * (`packages/domain/src/providers.ts`), pensada desde Fase 1 exactamente para este swap
 * sin tocar `@depaso/optimization`.
 */
export function createMapboxRouteProvider(accessToken: string): RouteProvider {
  async function computeRoute(waypoints: LatLng[], transportMode: TransportMode): Promise<RouteResult> {
    if (waypoints.length < 2) {
      throw new MapboxRouteError("computeRoute requiere al menos 2 waypoints");
    }
    const profile = PROFILE_BY_TRANSPORT_MODE[transportMode];
    if (!profile) {
      throw new MapboxRouteError(
        `Mapbox Directions no soporta el modo ${transportMode} (sin perfil de transporte público)`
      );
    }

    const coordinates = waypoints.map((w) => `${w.longitude},${w.latitude}`).join(";");
    const url = `${BASE_URL}/${profile}/${coordinates}?geometries=polyline&overview=full&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new MapboxRouteError(`Mapbox Directions -> HTTP ${response.status}`);
    }
    const json = (await response.json()) as MapboxDirectionsResponse;
    const route = json.routes[0];
    if (!route) {
      throw new MapboxRouteError("Mapbox no encontró una ruta para esos puntos");
    }

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      orderedWaypoints: waypoints,
      polyline: route.geometry,
    };
  }

  return { computeRoute };
}
