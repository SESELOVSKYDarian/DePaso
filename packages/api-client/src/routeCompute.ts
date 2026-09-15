import { routeComputeResponseSchema, type RouteComputeRequest } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Ruteo real para el mapa (Fase 17) — ver apps/api/app/api/routes/compute. */
export function createRouteComputeClient(client: DepasoApiClient) {
  return {
    compute: (body: RouteComputeRequest) => client.post("/api/routes/compute", body, routeComputeResponseSchema),
  };
}
