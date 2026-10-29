import { ApiError } from "@depaso/api-client";
import * as Location from "expo-location";
import { geocodeClient, mapConfigClient, routeContextClient } from "@/lib/apiClient";

export const GEOCODING_NOT_CONFIGURED_MESSAGE =
  "La geocodificación real todavía no está configurada — ver docs/development/GEOCODING-SETUP.md.";

/** Geocoding real vía `apps/api` (Fase 28) — ver `apps/mobile/app/places/form.tsx`, mismo
 * criterio: `Location.geocodeAsync` no funciona en Expo Web. */
export async function geocodeAddress(address: string) {
  try {
    return await geocodeClient.forward({ address });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export const MAR_DEL_PLATA = { latitude: -38.0055, longitude: -57.5426 };
