import { z } from "zod";
import { brandLogosResponseSchema, storeBranchResponseSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const branchesSchema = z.object({ branches: z.array(storeBranchResponseSchema) });

/** Catálogo de comercios de sólo lectura — ver apps/api/app/api/stores. */
export function createStoresClient(client: DepasoApiClient) {
  return {
    listBranches: () => client.post("/api/stores/branches", {}, branchesSchema),
    /** Logos de las cadenas, guardados en la base de datos. */
    listLogos: () => client.post("/api/stores/logos", {}, brandLogosResponseSchema),
  };
}
