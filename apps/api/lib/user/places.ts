import type { UserPlace } from "@depaso/database";
import type { UserPlaceResponse } from "@depaso/validation";

export function toPlaceResponse(place: UserPlace): UserPlaceResponse {
  return {
    id: place.id,
    name: place.name,
    type: place.type,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    isFavorite: place.isFavorite,
    createdAt: place.createdAt.toISOString(),
    updatedAt: place.updatedAt.toISOString(),
  };
}
