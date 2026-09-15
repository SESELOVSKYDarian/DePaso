import {
  geocodeResponseSchema,
  reverseGeocodeResponseSchema,
  type GeocodeRequest,
  type ReverseGeocodeRequest,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Geocodificación real (Fase 28) — ver apps/api/app/api/geocode. */
export function createGeocodeClient(client: DepasoApiClient) {
  return {
    forward: (body: GeocodeRequest) => client.post("/api/geocode", body, geocodeResponseSchema),
    reverse: (body: ReverseGeocodeRequest) =>
      client.post("/api/geocode/reverse", body, reverseGeocodeResponseSchema),
  };
}
