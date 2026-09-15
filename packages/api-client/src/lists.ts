import { z } from "zod";
import {
  shoppingListResponseSchema,
  shoppingListSummarySchema,
  type ShoppingListInput,
  type ShoppingListItemInput,
  type ShoppingListItemUpdate,
  type ShoppingListUpdate,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });
const listsSchema = z.object({ lists: z.array(shoppingListSummarySchema) });

/** Listas de compra — ver apps/api/app/api/lists. */
export function createListsClient(client: DepasoApiClient) {
  return {
    list: () => client.get("/api/lists", listsSchema),
    get: (id: string) => client.get(`/api/lists/${id}`, shoppingListResponseSchema),
    create: (body: ShoppingListInput) => client.post("/api/lists", body, shoppingListResponseSchema),
    update: (id: string, body: ShoppingListUpdate) =>
      client.patch(`/api/lists/${id}`, body, shoppingListResponseSchema),
    remove: (id: string) => client.delete(`/api/lists/${id}`, okSchema),
    addItem: (listId: string, body: ShoppingListItemInput) =>
      client.post(`/api/lists/${listId}/items`, body, shoppingListResponseSchema),
    updateItem: (listId: string, itemId: string, body: ShoppingListItemUpdate) =>
      client.patch(`/api/lists/${listId}/items/${itemId}`, body, shoppingListResponseSchema),
    removeItem: (listId: string, itemId: string) =>
      client.delete(`/api/lists/${listId}/items/${itemId}`, shoppingListResponseSchema),
  };
}
