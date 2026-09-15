import {
  optimizationRunResponseSchema,
  type OptimizationRunRequest,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Ejecuta el Top 3 con datos que el servidor obtiene de la cuenta autenticada. */
export function createOptimizationClient(client: DepasoApiClient) {
  return {
    run: (body: OptimizationRunRequest) =>
      client.post("/api/optimization", body, optimizationRunResponseSchema),
  };
}
