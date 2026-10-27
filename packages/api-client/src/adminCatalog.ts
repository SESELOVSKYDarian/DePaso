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
      list: () => client.post("/api/admin/stores/list", {}, storesSchema),
      create: (body: StoreInput) => client.post("/api/admin/stores", body, storeResponseSchema),
      update: (id: string, body: Partial<StoreInput>) =>
        client.post("/api/admin/stores/update", { id, ...body }, storeResponseSchema),
      remove: (id: string) => client.post("/api/admin/stores/delete", { id }, okSchema),
    },
    branches: {
      list: (storeId?: string) =>
        client.post("/api/admin/store-branches/list", storeId ? { storeId } : {}, branchesSchema),
      create: (body: StoreBranchInput) =>
        client.post("/api/admin/store-branches", body, storeBranchResponseSchema),
      update: (id: string, body: StoreBranchUpdate) =>
        client.post("/api/admin/store-branches/update", { id, ...body }, storeBranchResponseSchema),
      remove: (id: string) => client.post("/api/admin/store-branches/delete", { id }, okSchema),
    },
    prices: {
      list: (filter?: { productVariantId?: string; storeBranchId?: string }) => {
        const body: Record<string, string> = {};
        if (filter?.productVariantId) body.productVariantId = filter.productVariantId;
        if (filter?.storeBranchId) body.storeBranchId = filter.storeBranchId;
        return client.post("/api/admin/prices/list", body, pricesSchema);
      },
      create: (body: PriceInput) => client.post("/api/admin/prices", body, priceResponseSchema),
      update: (id: string, body: PriceUpdate) =>
        client.post("/api/admin/prices/update", { id, ...body }, priceResponseSchema),
    },
  };
}
