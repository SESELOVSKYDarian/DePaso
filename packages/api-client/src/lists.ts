import { z } from "zod";
import {
  shoppingListResponseSchema,
  shoppingListSummarySchema,
  type ShoppingListInput,
  type ShoppingListItemInput,
  type ShoppingListItemUpdate,
  type ShoppingListShareInput,
  type ShoppingListUpdate,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });
const listsSchema = z.object({ lists: z.array(shoppingListSummarySchema) });

/** Listas de compra — ver apps/api/app/api/lists. */
export function createListsClient(client: DepasoApiClient) {
  return {
    list: () => client.post("/api/lists/list", {}, listsSchema),
    get: (id: string) => client.post("/api/lists/detail", { id }, shoppingListResponseSchema),
    create: (body: ShoppingListInput) => client.post("/api/lists", body, shoppingListResponseSchema),
    update: (id: string, body: ShoppingListUpdate) =>
      client.put("/api/lists", { id, ...body }, shoppingListResponseSchema),
    remove: (id: string) => client.delete("/api/lists", { id }, okSchema),
    addItem: (listId: string, body: ShoppingListItemInput) =>
      client.post(`/api/lists/${listId}/items`, body, shoppingListResponseSchema),
    updateItem: (listId: string, itemId: string, body: ShoppingListItemUpdate) =>
      client.put("/api/lists/items", { id: listId, itemId, ...body }, shoppingListResponseSchema),
    share: (listId: string, body: ShoppingListShareInput) =>
      client.post(`/api/lists/${listId}/members`, body, shoppingListResponseSchema),
    removeMember: (listId: string, memberUserId: string) =>
      client.delete("/api/lists/members", { id: listId, memberUserId }, okSchema),
    removeItem: (listId: string, itemId: string) =>
      client.delete("/api/lists/items", { id: listId, itemId }, shoppingListResponseSchema),
  };
}
