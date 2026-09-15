import { z } from "zod";
import {
  priceResponseSchema,
  storeBranchResponseSchema,
  storeResponseSchema,
  type PriceInput,
  type PriceUpdate,
  type StoreBranchInput,
  type StoreBranchUpdate,
  type StoreInput,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });
const storesSchema = z.object({ stores: z.array(storeResponseSchema) });
const branchesSchema = z.object({ branches: z.array(storeBranchResponseSchema) });
const pricesSchema = z.object({ prices: z.array(priceResponseSchema) });

/** CRUD de catálogo para `apps/admin` (Fase 11/12) — sólo cuentas con `role: "ADMIN"`. */
export function createAdminCatalogClient(client: DepasoApiClient) {
  return {
    stores: {
      list: () => client.get("/api/admin/stores", storesSchema),
      create: (body: StoreInput) => client.post("/api/admin/stores", body, storeResponseSchema),
      update: (id: string, body: Partial<StoreInput>) =>
        client.patch(`/api/admin/stores/${id}`, body, storeResponseSchema),
      remove: (id: string) => client.delete(`/api/admin/stores/${id}`, okSchema),
    },
    branches: {
      list: (storeId?: string) =>
        client.get(`/api/admin/store-branches${storeId ? `?storeId=${storeId}` : ""}`, branchesSchema),
      create: (body: StoreBranchInput) =>
        client.post("/api/admin/store-branches", body, storeBranchResponseSchema),
      update: (id: string, body: StoreBranchUpdate) =>
        client.patch(`/api/admin/store-branches/${id}`, body, storeBranchResponseSchema),
      remove: (id: string) => client.delete(`/api/admin/store-branches/${id}`, okSchema),
    },
    prices: {
      list: (filter?: { productVariantId?: string; storeBranchId?: string }) => {
        const params = new URLSearchParams();
        if (filter?.productVariantId) params.set("productVariantId", filter.productVariantId);
        if (filter?.storeBranchId) params.set("storeBranchId", filter.storeBranchId);
        const qs = params.toString();
        return client.get(`/api/admin/prices${qs ? `?${qs}` : ""}`, pricesSchema);
      },
      create: (body: PriceInput) => client.post("/api/admin/prices", body, priceResponseSchema),
      update: (id: string, body: PriceUpdate) =>
        client.patch(`/api/admin/prices/${id}`, body, priceResponseSchema),
    },
  };
}
