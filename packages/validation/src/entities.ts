/**
 * Schemas de entidades base. Cobertura parcial en este pase (UserPlace, UserConsent) como
 * patrón de referencia — el resto de entidades de @depaso/types se schematiza a medida
 * que se implementen sus fases (ver docs/development/PROGRESS.md).
 */
import { z } from "zod";

export const placeTypeSchema = z.enum(["HOME", "WORK", "STUDY", "GYM", "FAMILY", "CUSTOM"]);

export const userPlaceInputSchema = z.object({
  name: z.string().min(1).max(80),
  type: placeTypeSchema,
  address: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isFavorite: z.boolean().default(false),
});

export type UserPlaceInput = z.infer<typeof userPlaceInputSchema>;

export const userPlaceUpdateSchema = userPlaceInputSchema.partial();
export type UserPlaceUpdate = z.infer<typeof userPlaceUpdateSchema>;

export const userPlaceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: placeTypeSchema,
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  isFavorite: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserPlaceResponse = z.infer<typeof userPlaceResponseSchema>;

export const consentTypeSchema = z.enum(["TERMS", "PRIVACY", "LOCATION", "MARKETING"]);

export const userConsentInputSchema = z.object({
  type: consentTypeSchema,
  documentVersion: z.string().min(1),
  accepted: z.boolean(),
});

export type UserConsentInput = z.infer<typeof userConsentInputSchema>;
