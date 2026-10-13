/**
 * Feed de actividad: los precios que la comunidad reportó (pestaña "Comunidad") y los que
 * reportó la propia persona (pestaña "Actividad"). Nunca expone quién reportó.
 */
import { z } from "zod";

export const communityFeedScopeSchema = z.enum(["community", "mine"]);
export type CommunityFeedScope = z.infer<typeof communityFeedScopeSchema>;

export const communityFeedQuerySchema = z.object({
  scope: communityFeedScopeSchema.default("community"),
});

export const communityFeedItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  brandName: z.string().nullable(),
  /** Tamaño/unidad legible, p. ej. "1 L". */
  sizeLabel: z.string().nullable(),
  storeName: z.string(),
  branchName: z.string(),
  reportedPrice: z.number(),
  requiresPromotion: z.boolean(),
  promotionNote: z.string().nullable(),
  createdAt: z.string(),
  /** `true` si lo reportó la persona que consulta. */
  isMine: z.boolean(),
  /** `HIDDEN`: moderación lo ocultó; sólo se informa en "mine". */
  status: z.enum(["VISIBLE", "HIDDEN"]),
});
export type CommunityFeedItem = z.infer<typeof communityFeedItemSchema>;

export const communityFeedResponseSchema = z.object({
  items: z.array(communityFeedItemSchema),
});
export type CommunityFeedResponse = z.infer<typeof communityFeedResponseSchema>;
