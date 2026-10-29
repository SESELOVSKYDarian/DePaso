import { z } from "zod";

/** Cambio de precio reciente de un producto que está en alguna lista del usuario. */
export const homePriceChangeSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  storeName: z.string(),
  previousPrice: z.number(),
  currentPrice: z.number(),
  /** Positivo = subió, negativo = bajó. */
  changePercent: z.number(),
});

/** Promo de banco/billetera que rige hoy. `mine` = el usuario tiene ese medio de pago. */
export const homePromoSchema = z.object({
  id: z.string(),
  retailer: z.string(),
  label: z.string(),
  discountPercent: z.number(),
  capAmount: z.number().nullable(),
  mine: z.boolean(),
  big: z.boolean(),
});

/** Un producto sugerido en Inicio, con su precio más bajo y en qué comercio está. */
export const homeProductSchema = z.object({
  productId: z.string(),
  name: z.string(),
  brandName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  storeName: z.string(),
  /** Precio más bajo vigente. */
  price: z.number(),
  /** Promedio de todos sus precios (para ver cuánto se ahorra). */
  averagePrice: z.number(),
  /** Cuánto por debajo del promedio está el precio más bajo, en %. */
  savingPercent: z.number(),
});

/** Resumen de la lista activa del usuario. */
export const homeListSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  itemCount: z.number(),
  /** Algunos productos de ejemplo. */
  previewItems: z.array(z.object({ name: z.string(), quantity: z.number() })),
  /** Lo que costaría la lista comprando cada producto en el comercio más barato. */
  cheapestTotal: z.number().nullable(),
  /** Cuántos productos de la lista tienen precio (para saber si el total es parcial). */
  pricedItems: z.number(),
});

export const homeFeedResponseSchema = z.object({
  priceChanges: z.array(homePriceChangeSchema),
  promos: z.array(homePromoSchema),
  /** Lista activa del usuario (`null` si todavía no tiene productos). */
  listSummary: homeListSummarySchema.nullable().default(null),
  /** Productos que hoy están bien por debajo de su precio promedio. */
  cheapToday: z.array(homeProductSchema).default([]),
  /** Los productos más buscados, con su mejor precio. */
  popular: z.array(homeProductSchema).default([]),
  /** Cuántos productos de las listas se miraron: 0 = todavía no hay nada que seguir. */
  watchedProducts: z.number(),
});

export type HomePriceChange = z.infer<typeof homePriceChangeSchema>;
export type HomePromo = z.infer<typeof homePromoSchema>;
export type HomeProduct = z.infer<typeof homeProductSchema>;
export type HomeListSummary = z.infer<typeof homeListSummarySchema>;
export type HomeFeedResponse = z.infer<typeof homeFeedResponseSchema>;
