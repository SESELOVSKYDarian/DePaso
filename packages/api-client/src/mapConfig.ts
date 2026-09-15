import { mapConfigResponseSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Token público de Mapbox para el mapa visual (Fase 17) — ver apps/api/app/api/config/mapbox-token. */
export function createMapConfigClient(client: DepasoApiClient) {
  return {
    getMapboxToken: () => client.get("/api/config/mapbox-token", mapConfigResponseSchema),
  };
}
