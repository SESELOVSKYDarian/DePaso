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

export const homeFeedResponseSchema = z.object({
  priceChanges: z.array(homePriceChangeSchema),
  promos: z.array(homePromoSchema),
  /** Cuántos productos de las listas se miraron: 0 = todavía no hay nada que seguir. */
  watchedProducts: z.number(),
});

export type HomePriceChange = z.infer<typeof homePriceChangeSchema>;
export type HomePromo = z.infer<typeof homePromoSchema>;
export type HomeFeedResponse = z.infer<typeof homeFeedResponseSchema>;
