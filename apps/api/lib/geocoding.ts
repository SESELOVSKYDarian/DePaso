import type { GeocodingProvider } from "@depaso/domain";
import { createMapboxGeocodingProvider } from "@depaso/data-sources-mapbox";

/**
 * Resuelve el `GeocodingProvider` real desde `MAPBOX_ACCESS_TOKEN` (Fase 28, ver
 * docs/development/GEOCODING-SETUP.md). `null` si no está configurado — el caller responde
 * `503 GEOCODING_NOT_CONFIGURED` en vez de romper, mismo criterio que el resto de
 * integraciones opcionales del proyecto (Google/Apple Sign-In, email de recuperación).
 */
export function getGeocodingProvider(): GeocodingProvider | null {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;
  return createMapboxGeocodingProvider(token);
}
