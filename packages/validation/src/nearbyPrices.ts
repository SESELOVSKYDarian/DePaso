import { z } from "zod";

/** Pedido: dónde se está y qué producto se necesita en otro comercio. */
export const nearbyPricesInputSchema = z.object({
  productId: z.string().min(1),
  /** Si se conoce, se prefieren los precios de esa misma presentación (mismo tamaño). */
  productVariantId: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** El comercio donde ya se está: no se ofrece de nuevo. */
  excludeBranchId: z.string().optional(),
  /** Hasta qué distancia se busca, en metros. */
  radiusMeters: z.number().int().min(200).max(10_000).default(3000),
});
export type NearbyPricesInput = z.input<typeof nearbyPricesInputSchema>;

/** Un comercio cercano que tiene el producto, con su precio y a qué distancia queda. */
export const nearbyPriceSchema = z.object({
  branchId: z.string(),
  storeName: z.string(),
  branchName: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  unitPrice: z.number(),
  distanceMeters: z.number(),
});
export type NearbyPrice = z.infer<typeof nearbyPriceSchema>;

/** Las mejores opciones, la recomendada primero. */
export const nearbyPricesResponseSchema = z.object({ options: z.array(nearbyPriceSchema) });
export type NearbyPricesResponse = z.infer<typeof nearbyPricesResponseSchema>;