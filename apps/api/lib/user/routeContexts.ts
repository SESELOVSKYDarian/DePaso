import type { SavedRouteContext, SavedRouteStop } from "@depaso/database";
import type { RouteContextResponse } from "@depaso/validation";

export const routeContextInclude = { stops: { orderBy: { position: "asc" } } } as const;

export function toRouteContextResponse(context: SavedRouteContext & { stops: SavedRouteStop[] }): RouteContextResponse {
  return {
    id: context.id,
    name: context.name,
    waypointPlaceIds: context.stops.flatMap((stop) => (stop.placeId ? [stop.placeId] : [])),
    stops: context.stops.map((stop) => ({
      name: stop.name,
      address: stop.address,
      latitude: stop.latitude,
      longitude: stop.longitude,
      emoji: stop.emoji,
      ...(stop.placeId ? { placeId: stop.placeId } : {}),
    })),
    createdAt: context.createdAt.toISOString(),
  };
}
