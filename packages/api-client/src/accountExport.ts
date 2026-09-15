import { accountExportResponseSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Derecho de acceso (LEGAL.md p.14) — ver apps/api/app/api/account/export. */
export function createAccountExportClient(client: DepasoApiClient) {
  return {
    export: () => client.get("/api/account/export", accountExportResponseSchema),
  };
}
