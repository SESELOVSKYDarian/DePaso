import { z } from "zod";
import { productPreferenceTypeSchema, storePreferenceTypeSchema } from "./preferences";

/** Un producto que no está en el catálogo: la persona escribe cómo se llama. */
export const customProductPreferenceInputSchema = z.object({
  name: z.string().trim().min(2, "Escribí el nombre del producto.").max(120),
  type: productPreferenceTypeSchema,
});
export type CustomProductPreferenceInput = z.infer<typeof customProductPreferenceInputSchema>;

export const customProductPreferenceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: productPreferenceTypeSchema,
});
export type CustomProductPreferenceResponse = z.infer<typeof customProductPreferenceResponseSchema>;

/** Un comercio que no está en la lista: la persona le pone nombre y lo marca en el mapa. */
export const customStorePreferenceInputSchema = z.object({
  category: z.string().trim().min(1).max(60),
  type: storePreferenceTypeSchema,
  name: z.string().trim().min(2, "Escribí el nombre del comercio.").max(120),
  address: z.string().trim().max(255).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type CustomStorePreferenceInput = z.infer<typeof customStorePreferenceInputSchema>;

export const customStorePreferenceResponseSchema = z.object({
  id: z.string(),
  category: z.string(),
  type: storePreferenceTypeSchema,
  name: z.string(),
  address: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});
export type CustomStorePreferenceResponse = z.infer<typeof customStorePreferenceResponseSchema>;