import { z } from "zod";
import {
  userPlaceResponseSchema,
  type UserPlaceInput,
  type UserPlaceUpdate,
} from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.literal(true) });
const placesListSchema = z.object({ places: z.array(userPlaceResponseSchema) });

/** Lugares guardados — ver apps/api/app/api/places. */
export function createPlacesClient(client: DepasoApiClient) {
  return {
    list: () => client.get("/api/places", placesListSchema),
    create: (body: UserPlaceInput) => client.post("/api/places", body, userPlaceResponseSchema),
    update: (id: string, body: UserPlaceUpdate) =>
      client.patch(`/api/places/${id}`, body, userPlaceResponseSchema),
    remove: (id: string) => client.delete(`/api/places/${id}`, okSchema),
  };
}
