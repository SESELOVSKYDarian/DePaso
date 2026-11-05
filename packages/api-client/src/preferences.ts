import { z } from "zod";
import {
  customProductPreferenceResponseSchema,
  customStorePreferenceResponseSchema,
  productPreferenceResponseSchema,
  storePreferenceResponseSchema,
  type CustomProductPreferenceInput,
  type CustomStorePreferenceInput,
  type ProductPreferenceInput,
  type StorePreferenceInput,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });
const productPrefsSchema = z.object({ preferences: z.array(productPreferenceResponseSchema) });
const storePrefsSchema = z.object({ preferences: z.array(storePreferenceResponseSchema) });
const customProductPrefsSchema = z.object({ preferences: z.array(customProductPreferenceResponseSchema) });
const customStorePrefsSchema = z.object({ preferences: z.array(customStorePreferenceResponseSchema) });

/** Preferencias de producto/comercio — ver apps/api/app/api/preferences. */
export function createPreferencesClient(client: DepasoApiClient) {
  return {
    products: {
      list: () => client.post("/api/preferences/products/list", {}, productPrefsSchema),
      set: (body: ProductPreferenceInput) =>
        client.post("/api/preferences/products", body, productPreferenceResponseSchema),
      remove: (productId: string) => client.delete("/api/preferences/products", { productId }, okSchema),
    },
    stores: {
      list: () => client.post("/api/preferences/stores/list", {}, storePrefsSchema),
      set: (body: StorePreferenceInput) =>
        client.post("/api/preferences/stores", body, storePreferenceResponseSchema),
      remove: (id: string) => client.delete("/api/preferences/stores", { id }, okSchema),
    },
    /** Productos que no están en el catálogo: la persona los nombra a mano. */
    customProducts: {
      list: () => client.post("/api/preferences/custom-products/list", {}, customProductPrefsSchema),
      create: (body: CustomProductPreferenceInput) => client.post("/api/preferences/custom-products", body, customProductPreferenceResponseSchema),
      remove: (id: string) => client.delete("/api/preferences/custom-products", { id }, okSchema),
    },
    /** Comercios que no están en la lista: la persona los marca en el mapa. */
    customStores: {
      list: () => client.post("/api/preferences/custom-stores/list", {}, customStorePrefsSchema),
      create: (body: CustomStorePreferenceInput) => client.post("/api/preferences/custom-stores", body, customStorePreferenceResponseSchema),
      remove: (id: string) => client.delete("/api/preferences/custom-stores", { id }, okSchema),
    },
  };
}
