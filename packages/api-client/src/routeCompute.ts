import {
  nearbyStoresResponseSchema,
  routeComputeResponseSchema,
  type NearbyStoresRequest,
  type RouteComputeRequest,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Ruteo real para el mapa (Fase 17) — ver apps/api/app/api/routes/compute. */
export function createRouteComputeClient(client: DepasoApiClient) {
  return {
    compute: (body: RouteComputeRequest) => client.post("/api/routes/compute", body, routeComputeResponseSchema),
    /** Comercios que quedan de paso sobre el recorrido, con el desvío de cada uno. */
    nearbyStores: (body: NearbyStoresRequest) =>
      client.post("/api/routes/nearby-stores", body, nearbyStoresResponseSchema),
  };
}
