import { communityFeedResponseSchema, type CommunityFeedScope } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

/** Feed de reportes de precio — ver apps/api/app/api/community/feed. */
export function createCommunityClient(client: DepasoApiClient) {
  return {
    feed: (scope: CommunityFeedScope) =>
      client.post("/api/community/feed", { scope }, communityFeedResponseSchema),
  };
}
