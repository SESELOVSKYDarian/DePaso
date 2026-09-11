/**
 * Interfaces de proveedores externos. Ningún consumidor de dominio debe acoplarse a un
 * proveedor concreto (Google Maps, Mapbox, scraping de precios, etc.) — sección 67/84 del
 * master prompt. Implementaciones reales son trabajo de fases posteriores; por ahora sólo
 * existe `MockRouteProvider` / `MockGeocodingProvider` en @depaso/optimization, para poder
 * probar el motor sin API keys.
 */

import type { TransportMode } from "@depaso/types";
import type { LatLng, RouteResult } from "./geo";

export interface GeocodingProvider {
  geocode(address: string): Promise<LatLng>;
  reverseGeocode(point: LatLng): Promise<string>;
}

export interface RouteProvider {
  computeRoute(waypoints: LatLng[], transportMode: TransportMode): Promise<RouteResult>;
}

export interface MapProvider {
  geocoding: GeocodingProvider;
  routing: RouteProvider;
}

/**
 * Fase 84 del master prompt (no implementado en este pase): OfficialPriceProvider /
 * StorePriceProvider / CommunityPriceProvider / MockPriceProvider implementan esta interfaz.
 */
export interface PriceProvider {
  fetchPrices(productVariantId: string, storeBranchId: string): Promise<unknown>;
}
