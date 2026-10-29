import { ApiError } from "@depaso/api-client";
import * as Location from "expo-location";
import { geocodeClient } from "@/lib/apiClient";

export const GEOCODING_NOT_CONFIGURED_MESSAGE =
  "La geocodificación real todavía no está configurada — ver docs/development/GEOCODING-SETUP.md.";

/**
 * Geocoding real vía `apps/api` (Fase 28) — no `Location.geocodeAsync` directo. Esa API
 * nativa no tiene implementación en Expo Web (siempre falla ahí) y depende del geocoder
 * del SO en dispositivo real; pasar por el servidor funciona igual en los tres.
 */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    return await geocodeClient.forward({ address });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null; // dirección no encontrada, no un error de config
    throw err;
  }
}
