import {
  geocodeResponseSchema,
  placeSearchResponseSchema,
  reverseGeocodeResponseSchema,
  type GeocodeRequest,
  type PlaceSearchRequest,
  type ReverseGeocodeRequest,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Geocodificación real (Fase 28) — ver apps/api/app/api/geocode. */
export function createGeocodeClient(client: DepasoApiClient) {
  return {
    forward: (body: GeocodeRequest) => client.post("/api/geocode", body, geocodeResponseSchema),
    /** Sugerencias de lugares mientras se escribe (comercios, calles, barrios). */
    search: (body: PlaceSearchRequest) => client.post("/api/geocode/search", body, placeSearchResponseSchema),
    reverse: (body: ReverseGeocodeRequest) =>
      client.post("/api/geocode/reverse", body, reverseGeocodeResponseSchema),
  };
}
