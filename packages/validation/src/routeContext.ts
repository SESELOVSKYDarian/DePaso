/**
 * Contexto de ruta guardado — "¿Por dónde vas a andar hoy?" (sección 33-35 del master
 * prompt). Sólo referencia `UserPlace` ya guardados (por eso `waypointPlaceIds`, no
 * direcciones sueltas) — un lugar temporal del día nunca se persiste acá salvo que el
 * usuario decida guardarlo primero como `UserPlace` (sección 31/34, "no convertir en
 * lugar guardado sin acción explícita").
 */
import { z } from "zod";

/** Una parada guardada con la ruta: se guarda completa, no sólo el id de un lugar. */
export const savedStopSchema = z.object({
  name: z.string().trim().min(1).max(80),
  address: z.string().trim().max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  emoji: z.string().max(8).default("📍"),
  /** Si la parada es un lugar guardado, su id (sólo informativo). */
  placeId: z.string().optional(),
});
export type SavedStop = z.infer<typeof savedStopSchema>;

export const routeContextInputSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    /** Rutas nuevas: las paradas completas, en orden (origen, paradas, destino). */
    stops: z.array(savedStopSchema).min(2).max(6).optional(),
    /** Rutas viejas: sólo ids de lugares guardados. */
    waypointPlaceIds: z.array(z.string().min(1)).max(6).default([]),
  })
  .refine((value) => value.stops !== undefined || value.waypointPlaceIds.length > 0, {
    message: "La ruta necesita paradas.",
  });
export type RouteContextInput = z.input<typeof routeContextInputSchema>;

export const routeContextResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  waypointPlaceIds: z.array(z.string()),
  /** Paradas completas (rutas nuevas); `null` en rutas viejas. */
  stops: z.array(savedStopSchema).nullable().default(null),
  createdAt: z.string(),
});
export type RouteContextResponse = z.infer<typeof routeContextResponseSchema>;
