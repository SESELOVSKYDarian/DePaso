import {
  adResponseSchema,
  adsResponseSchema,
  type AdDecision,
  type AdRequestInput,
} from "@depaso/validation";
import { z } from "zod";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.boolean() });

/** Publicidad de comercios — ver apps/api/app/api/{merchant/ads,admin/ads}. */
export function createAdsClient(client: DepasoApiClient) {
  return {
    /** Para el comercio: pedir publicidad, ver sus pedidos y cancelar uno pendiente. */
    merchant: {
      create: (input: AdRequestInput) => client.post("/api/merchant/ads", input, adResponseSchema),
      list: () => client.post("/api/merchant/ads/list", {}, adsResponseSchema),
      cancel: (id: string) => client.delete("/api/merchant/ads", { id }, okSchema),
    },
    /** Para el administrador: ver los pedidos con lo que ofrece cada comercio y resolverlos. */
    admin: {
      list: () => client.post("/api/admin/ads/list", {}, adsResponseSchema),
      decide: (id: string, decision: AdDecision) => client.put("/api/admin/ads", { id, ...decision }, adResponseSchema),
    },
  };
}
