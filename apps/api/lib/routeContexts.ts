import { asStringArray } from "./jsonArrays";
import type { SavedRouteContext } from "@depaso/database";
import { savedStopSchema, type RouteContextResponse } from "@depaso/validation";
import { z } from "zod";

function parseStops(raw: unknown): RouteContextResponse["stops"] {
  const parsed = z.array(savedStopSchema).safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function toRouteContextResponse(context: SavedRouteContext): RouteContextResponse {
  return {
    id: context.id,
    name: context.name,
    waypointPlaceIds: asStringArray(context.waypointPlaceIds),
    stops: parseStops(context.stops),
    createdAt: context.createdAt.toISOString(),
  };
}
