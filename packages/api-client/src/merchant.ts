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
    myRequest: () => client.post("/api/merchant/requests/list", {}, myMerchantRequestResponseSchema),
    submitRequest: (body: MerchantRequestInput) =>
      client.post("/api/merchant/requests", body, createdRequestSchema),
    branch: () => client.post("/api/merchant/branch", {}, merchantBranchEnvelopeSchema),
    /** Sucursales ya cargadas en DePaso que todavía no tienen comercio a cargo. */
    claimableBranches: (q: string) =>
      client.post("/api/merchant/claimable-branches", { q }, claimableBranchesResponseSchema),
    prices: {
      list: (query: MerchantPriceQuery = {}) => {
        const body: Record<string, string | number> = {};
        if (query.q) body.q = query.q;
        if (query.type) body.type = query.type;
        if (query.brandId) body.brandId = query.brandId;
        if (query.offset) body.offset = query.offset;
        return client.post("/api/merchant/prices/list", body, merchantPricesResponseSchema);
      },
      set: (body: MerchantPriceInput) =>
        client.post("/api/merchant/prices", body, merchantPriceResponseSchema),
      update: (id: string, price: number, displayName?: string) =>
        client.post(
          "/api/merchant/prices/update",
          displayName === undefined ? { id, price } : { id, price, displayName },
          merchantPriceResponseSchema,
        ),
      remove: (id: string) => client.post("/api/merchant/prices/delete", { id }, okSchema),
    },
    createProduct: (body: MerchantProductInput) =>
      client.post("/api/merchant/products", body, merchantPriceResponseSchema),
  };
}

/** Bandeja de solicitudes de comercio — sólo `role: "ADMIN"`. */
export function createAdminMerchantClient(client: DepasoApiClient) {
  return {
    list: (status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING") =>
      client.post("/api/admin/merchant-requests", { status }, adminMerchantRequestsResponseSchema),
    decide: (id: string, body: MerchantDecisionInput) =>
      client.post(`/api/admin/merchant-requests/${id}`, body, adminMerchantRequestResponseSchema),
  };
}
