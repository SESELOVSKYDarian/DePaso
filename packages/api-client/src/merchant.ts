import { z } from "zod";
import {
  adminMerchantRequestResponseSchema,
  adminMerchantRequestsResponseSchema,
  merchantBranchEnvelopeSchema,
  merchantPriceResponseSchema,
  merchantPricesResponseSchema,
  merchantRequestResponseSchema,
  myMerchantRequestResponseSchema,
  type MerchantDecisionInput,
  type MerchantPriceInput,
  type MerchantProductInput,
  type MerchantRequestInput,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const createdRequestSchema = z.object({ request: merchantRequestResponseSchema });
const okSchema = z.object({ ok: z.literal(true) });

/** Flujo de comercio, lado usuario/comercio — ver apps/api/app/api/merchant. */
export function createMerchantClient(client: DepasoApiClient) {
  return {
    myRequest: () => client.get("/api/merchant/requests", myMerchantRequestResponseSchema),
    submitRequest: (body: MerchantRequestInput) =>
      client.post("/api/merchant/requests", body, createdRequestSchema),
    branch: () => client.get("/api/merchant/branch", merchantBranchEnvelopeSchema),
    prices: {
      list: () => client.get("/api/merchant/prices", merchantPricesResponseSchema),
      set: (body: MerchantPriceInput) =>
        client.post("/api/merchant/prices", body, merchantPriceResponseSchema),
      update: (id: string, price: number) =>
        client.patch(`/api/merchant/prices/${id}`, { price }, merchantPriceResponseSchema),
      remove: (id: string) => client.delete(`/api/merchant/prices/${id}`, okSchema),
    },
    createProduct: (body: MerchantProductInput) =>
      client.post("/api/merchant/products", body, merchantPriceResponseSchema),
  };
}

/** Bandeja de solicitudes de comercio — sólo `role: "ADMIN"`. */
export function createAdminMerchantClient(client: DepasoApiClient) {
  return {
    list: (status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING") =>
      client.get(`/api/admin/merchant-requests?status=${status}`, adminMerchantRequestsResponseSchema),
    decide: (id: string, body: MerchantDecisionInput) =>
      client.post(`/api/admin/merchant-requests/${id}`, body, adminMerchantRequestResponseSchema),
  };
}
