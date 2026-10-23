import { z } from "zod";
import {
  adminMerchantRequestResponseSchema,
  adminMerchantRequestsResponseSchema,
  claimableBranchesResponseSchema,
  merchantBranchEnvelopeSchema,
  merchantPriceResponseSchema,
  merchantPricesResponseSchema,
  merchantRequestResponseSchema,
  myMerchantRequestResponseSchema,
  type MerchantDecisionInput,
  type MerchantPriceQuery,
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
    /** Sucursales ya cargadas en DePaso que todavía no tienen comercio a cargo. */
    claimableBranches: (q: string) =>
      client.get(`/api/merchant/claimable-branches?q=${encodeURIComponent(q)}`, claimableBranchesResponseSchema),
    prices: {
      list: (query: MerchantPriceQuery = {}) => {
        const params = new URLSearchParams();
        if (query.q) params.set("q", query.q);
        if (query.type) params.set("type", query.type);
        if (query.brandId) params.set("brandId", query.brandId);
        if (query.offset) params.set("offset", String(query.offset));
        const suffix = params.toString();
        return client.get(`/api/merchant/prices${suffix ? `?${suffix}` : ""}`, merchantPricesResponseSchema);
      },
      set: (body: MerchantPriceInput) =>
        client.post("/api/merchant/prices", body, merchantPriceResponseSchema),
      update: (id: string, price: number, displayName?: string) =>
        client.patch(
          `/api/merchant/prices/${id}`,
          displayName === undefined ? { price } : { price, displayName },
          merchantPriceResponseSchema,
        ),
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
