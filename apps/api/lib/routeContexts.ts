import type { SavedRouteContext } from "@depaso/database";
import type { RouteContextResponse } from "@depaso/validation";

export function toRouteContextResponse(context: SavedRouteContext): RouteContextResponse {
  return {
    id: context.id,
    name: context.name,
    waypointPlaceIds: context.waypointPlaceIds,
    createdAt: context.createdAt.toISOString(),
  };
}
