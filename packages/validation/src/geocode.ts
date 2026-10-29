/**
 * Geocodificación real (Fase 28) — ver docs/development/GEOCODING-SETUP.md.
 */
import { z } from "zod";

export const geocodeRequestSchema = z.object({
  address: z.string().trim().min(1).max(300),
});
export type GeocodeRequest = z.infer<typeof geocodeRequestSchema>;

export const geocodeResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});
export type GeocodeResponse = z.infer<typeof geocodeResponseSchema>;

export const reverseGeocodeRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type ReverseGeocodeRequest = z.infer<typeof reverseGeocodeRequestSchema>;

export const reverseGeocodeResponseSchema = z.object({
  address: z.string(),
});
export type ReverseGeocodeResponse = z.infer<typeof reverseGeocodeResponseSchema>;

/** Buscador de lugares con autocompletado (comercios, calles, barrios). */
export const placeSearchRequestSchema = z.object({
  q: z.string().trim().min(2).max(100),
  /** Posición del usuario (opcional): los resultados más cercanos salen primero. */
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type PlaceSearchRequest = z.infer<typeof placeSearchRequestSchema>;

export const placeSuggestionSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  kind: z.enum(["poi", "address", "neighborhood", "place"]),
});
export type PlaceSuggestionResponse = z.infer<typeof placeSuggestionSchema>;

export const placeSearchResponseSchema = z.object({ results: z.array(placeSuggestionSchema) });
export type PlaceSearchResponse = z.infer<typeof placeSearchResponseSchema>;
