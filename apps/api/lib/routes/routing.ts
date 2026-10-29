import type { RouteProvider } from "@depaso/domain";
import type { TransportMode } from "@depaso/types";
import { createMapboxRouteProvider } from "@depaso/data-sources-mapbox";
import { createMockRouteProvider } from "@depaso/optimization";

/**
 * Resuelve el `RouteProvider` real desde `MAPBOX_ACCESS_TOKEN` (Fase 17, misma cuenta que
 * el geocoding de Fase 28). Mapbox Directions no tiene perfil de transporte público — para
 * `PUBLIC_TRANSPORT` se usa `MockRouteProvider` aunque el token esté configurado, en vez de
 * aproximarlo con un perfil que no es transporte público real. Sin token, siempre
 * `MockRouteProvider` (mismo comportamiento que antes de esta fase, el motor sigue
 * pudiendo correr sin API keys).
 */
export function getRouteProvider(transportMode: TransportMode): RouteProvider {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token || transportMode === "PUBLIC_TRANSPORT") {
    return createMockRouteProvider();
  }
  return createMapboxRouteProvider(token);
}
