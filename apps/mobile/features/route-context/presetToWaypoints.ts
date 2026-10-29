import type { RouteContextResponse, UserPlaceResponse } from "@depaso/validation";
import { PLACE_TYPE_META } from "@/lib/placeTypes";
import type { TodayWaypoint } from "@/lib/routeContext/TodayRouteContext";

/** Convierte una ruta guardada con nombre en las paradas del recorrido de hoy. */
export function presetToWaypoints(preset: RouteContextResponse, places: UserPlaceResponse[]): TodayWaypoint[] {
  if (preset.stops && preset.stops.length > 0) {
    return preset.stops.map((stop, index) => ({
      key: stop.placeId ?? `saved-${preset.id}-${index}`,
      ...(stop.placeId ? { placeId: stop.placeId } : {}),
      name: stop.name,
      address: stop.address,
      latitude: stop.latitude,
      longitude: stop.longitude,
      emoji: stop.emoji,
    }));
  }
  // rutas viejas: solo tienen ids de lugares guardados
  return preset.waypointPlaceIds
    .map((id) => places.find((place) => place.id === id))
    .filter((place): place is UserPlaceResponse => place !== undefined)
    .map((place) => ({
      key: place.id,
      placeId: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      emoji: PLACE_TYPE_META[place.type].emoji,
    }));
}
