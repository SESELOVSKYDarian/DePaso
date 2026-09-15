import { z } from "zod";
import { storeBranchResponseSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const branchesSchema = z.object({ branches: z.array(storeBranchResponseSchema) });

/** Catálogo de comercios de sólo lectura — ver apps/api/app/api/stores. */
export function createStoresClient(client: DepasoApiClient) {
  return {
    listBranches: () => client.get("/api/stores/branches", branchesSchema),
  };
}
