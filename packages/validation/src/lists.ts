/**
 * Listas de compra (Fase 9). Una lista es sólo de su dueño — `userId` sale siempre de la
 * sesión, nunca del body (mismo criterio que `UserPlace`, sección 81).
 */
import { z } from "zod";

export const shoppingListInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
});
export type ShoppingListInput = z.infer<typeof shoppingListInputSchema>;

export const shoppingListUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  /** `true` archiva, `false` desarchiva. */
  archived: z.boolean().optional(),
});
export type ShoppingListUpdate = z.infer<typeof shoppingListUpdateSchema>;

export const shoppingListItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
  note: z.string().trim().max(140).optional(),
});
/** `z.input` — `quantity` tiene default. */
export type ShoppingListItemInput = z.input<typeof shoppingListItemInputSchema>;

export const shoppingListItemUpdateSchema = z.object({
  quantity: z.number().int().min(1).max(99).optional(),
  note: z.string().trim().max(140).nullable().optional(),
});
export type ShoppingListItemUpdate = z.infer<typeof shoppingListItemUpdateSchema>;

export const shoppingListItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  category: z.string(),
  quantity: z.number(),
  note: z.string().nullable(),
});
export type ShoppingListItemResponse = z.infer<typeof shoppingListItemResponseSchema>;

export const shoppingListResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(shoppingListItemResponseSchema),
});
export type ShoppingListResponse = z.infer<typeof shoppingListResponseSchema>;

export const shoppingListSummarySchema = shoppingListResponseSchema.omit({ items: true }).extend({
  itemCount: z.number(),
});
export type ShoppingListSummary = z.infer<typeof shoppingListSummarySchema>;
