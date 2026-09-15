import type { GeocodingProvider } from "@depaso/domain";
import type { LatLng } from "@depaso/domain";

const BASE_URL = "https://api.mapbox.com/search/geocode/v6";

export class MapboxGeocodingError extends Error {}

interface MapboxFeature {
  geometry: { coordinates: [number, number] }; // [longitude, latitude]
  properties: { full_address?: string; place_formatted?: string; name: string };
}

interface MapboxFeatureCollection {
  features: MapboxFeature[];
}

/**
 * Geocoding real vía Mapbox (Fase 28) — "Temporary geocoding", el tier gratuito (100.000
 * requests/mes, sin tarjeta de crédito), confirmado contra la documentación oficial de
 * Mapbox. Ver docs/development/GEOCODING-SETUP.md para cómo conseguir el token.
 *
 * Implementa `GeocodingProvider` (`packages/domain/src/providers.ts`) — esa interfaz ya
 * existía desde Fase 1 pensada exactamente para este swap, sin tocar el resto del backend.
 */
export function createMapboxGeocodingProvider(accessToken: string): GeocodingProvider {
  async function geocode(address: string): Promise<LatLng> {
    const url = `${BASE_URL}/forward?q=${encodeURIComponent(address)}&limit=1&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new MapboxGeocodingError(`Mapbox forward geocoding -> HTTP ${response.status}`);
    }
    const json = (await response.json()) as MapboxFeatureCollection;
    const first = json.features[0];
    if (!first) {
      throw new MapboxGeocodingError(`No se encontró la dirección: ${address}`);
    }
    const [longitude, latitude] = first.geometry.coordinates;
    return { latitude, longitude };
  }

  async function reverseGeocode(point: LatLng): Promise<string> {
    const url = `${BASE_URL}/reverse?longitude=${point.longitude}&latitude=${point.latitude}&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new MapboxGeocodingError(`Mapbox reverse geocoding -> HTTP ${response.status}`);
    }
    const json = (await response.json()) as MapboxFeatureCollection;
    const first = json.features[0];
    if (!first) {
      throw new MapboxGeocodingError(`No se encontró una dirección para ${point.latitude},${point.longitude}`);
    }
    return first.properties.full_address ?? first.properties.place_formatted ?? first.properties.name;
  }

  return { geocode, reverseGeocode };
}
