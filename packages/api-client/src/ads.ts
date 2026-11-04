import {
  adminMerchantsResponseSchema,
  adPricesSchema,
  adResponseSchema,
  adsResponseSchema,
  type AdDecision,
  type AdPrices,
  type AdReply,
  type AdRequestInput,
} from "@depaso/validation";
import { z } from "zod";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.boolean() });

/** Publicidad de comercios — ver apps/api/app/api/{merchant/ads,admin/ads}. */
export function createAdsClient(client: DepasoApiClient) {
  return {
    /** Precio base por día de cada formato (lo ven el comercio y el administrador). */
    prices: () => client.post("/api/ads/prices", {}, adPricesSchema),
    /** Para el comercio: pedir publicidad, ver sus pedidos y cancelar uno pendiente. */
    merchant: {
      create: (input: AdRequestInput) => client.post("/api/merchant/ads", input, adResponseSchema),
      list: () => client.post("/api/merchant/ads/list", {}, adsResponseSchema),
      cancel: (id: string) => client.delete("/api/merchant/ads", { id }, okSchema),
      /** Responder a la contraoferta del equipo: aceptar, rechazar o proponer otro monto. */
      reply: (id: string, reply: AdReply) => client.put("/api/merchant/ads", { id, ...reply }, adResponseSchema),
    },
    /** Para el administrador: ver los pedidos con lo que ofrece cada comercio y resolverlos. */
    admin: {
      list: () => client.post("/api/admin/ads/list", {}, adsResponseSchema),
      /** Todos los comercios de la app, con su estado y su publicidad. */
      merchants: (query?: string) => client.post("/api/admin/merchants/list", query ? { query } : {}, adminMerchantsResponseSchema),
      setMerchantEnabled: (branchId: string, enabled: boolean) => client.put("/api/admin/merchants", { id: branchId, enabled }, okSchema),
      setPrices: (prices: AdPrices) => client.post("/api/admin/ads/prices", prices, adPricesSchema),
      decide: (id: string, decision: AdDecision) => client.put("/api/admin/ads", { id, ...decision }, adResponseSchema),
    },
  };
}
