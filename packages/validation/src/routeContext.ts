/**
 * Contexto de ruta guardado — "¿Por dónde vas a andar hoy?" (sección 33-35 del master
 * prompt). Sólo referencia `UserPlace` ya guardados (por eso `waypointPlaceIds`, no
 * direcciones sueltas) — un lugar temporal del día nunca se persiste acá salvo que el
 * usuario decida guardarlo primero como `UserPlace` (sección 31/34, "no convertir en
 * lugar guardado sin acción explícita").
 */
import { z } from "zod";

export const routeContextInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  waypointPlaceIds: z.array(z.string().min(1)).min(1).max(6),
});
export type RouteContextInput = z.infer<typeof routeContextInputSchema>;

export const routeContextResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  waypointPlaceIds: z.array(z.string()),
  createdAt: z.string(),
});
export type RouteContextResponse = z.infer<typeof routeContextResponseSchema>;
