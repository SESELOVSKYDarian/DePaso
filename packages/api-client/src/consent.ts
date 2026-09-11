import { z } from "zod";
import type { ConsentRequest } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });

/** Consentimientos posteriores al registro (ej. ubicación) — ver apps/api/app/api/consents. */
export function createConsentClient(client: DepasoApiClient) {
  return {
    submit: (body: ConsentRequest) => client.post("/api/consents", body, okSchema),
  };
}
