import { homeFeedResponseSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Novedades de Inicio — ver apps/api/app/api/home/feed. */
export function createHomeClient(client: DepasoApiClient) {
  return {
    feed: () => client.post("/api/home/feed", {}, homeFeedResponseSchema),
  };
}
