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
      client.post("/api/lists/update", { id, ...body }, shoppingListResponseSchema),
    remove: (id: string) => client.post("/api/lists/delete", { id }, okSchema),
    addItem: (listId: string, body: ShoppingListItemInput) =>
      client.post(`/api/lists/${listId}/items`, body, shoppingListResponseSchema),
    updateItem: (listId: string, itemId: string, body: ShoppingListItemUpdate) =>
      client.post("/api/lists/items/update", { id: listId, itemId, ...body }, shoppingListResponseSchema),
    share: (listId: string, body: ShoppingListShareInput) =>
      client.post(`/api/lists/${listId}/members`, body, shoppingListResponseSchema),
    removeMember: (listId: string, memberUserId: string) =>
      client.post("/api/lists/members/delete", { id: listId, memberUserId }, okSchema),
    removeItem: (listId: string, itemId: string) =>
      client.post("/api/lists/items/delete", { id: listId, itemId }, shoppingListResponseSchema),
  };
}
