/**
 * Preferencias de producto/comercio (Fase 10). Consumidas hoy por `@depaso/optimization`
 * (sección 87) — esto sólo agrega el CRUD que faltaba para que el usuario las configure.
 */
import { z } from "zod";

export const productPreferenceTypeSchema = z.enum(["EXACT", "PREFERRED", "ANY"]);
export const storePreferenceTypeSchema = z.enum(["REQUIRED", "PREFERRED"]);

export const productPreferenceInputSchema = z.object({
  productId: z.string().min(1),
  type: productPreferenceTypeSchema,
  preferredBrandId: z.string().min(1).nullable().optional(),
});
export type ProductPreferenceInput = z.infer<typeof productPreferenceInputSchema>;

export const productPreferenceResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  type: productPreferenceTypeSchema,
  preferredBrandId: z.string().nullable(),
});
export type ProductPreferenceResponse = z.infer<typeof productPreferenceResponseSchema>;

export const storePreferenceInputSchema = z.object({
  category: z.string().trim().min(1).max(60),
  type: storePreferenceTypeSchema,
  storeBranchId: z.string().min(1),
});
export type StorePreferenceInput = z.infer<typeof storePreferenceInputSchema>;

export const storePreferenceResponseSchema = z.object({
  id: z.string(),
  category: z.string(),
  type: storePreferenceTypeSchema,
  storeBranchId: z.string(),
  storeBranchName: z.string(),
  storeName: z.string(),
});
export type StorePreferenceResponse = z.infer<typeof storePreferenceResponseSchema>;
