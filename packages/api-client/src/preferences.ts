import { z } from "zod";
import {
  productPreferenceResponseSchema,
  storePreferenceResponseSchema,
  type ProductPreferenceInput,
  type StorePreferenceInput,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });
const productPrefsSchema = z.object({ preferences: z.array(productPreferenceResponseSchema) });
const storePrefsSchema = z.object({ preferences: z.array(storePreferenceResponseSchema) });

/** Preferencias de producto/comercio — ver apps/api/app/api/preferences. */
export function createPreferencesClient(client: DepasoApiClient) {
  return {
    products: {
      list: () => client.get("/api/preferences/products", productPrefsSchema),
      set: (body: ProductPreferenceInput) =>
        client.post("/api/preferences/products", body, productPreferenceResponseSchema),
      remove: (productId: string) => client.delete(`/api/preferences/products/${productId}`, okSchema),
    },
    stores: {
      list: () => client.get("/api/preferences/stores", storePrefsSchema),
      set: (body: StorePreferenceInput) =>
        client.post("/api/preferences/stores", body, storePreferenceResponseSchema),
      remove: (id: string) => client.delete(`/api/preferences/stores/${id}`, okSchema),
    },
  };
}
