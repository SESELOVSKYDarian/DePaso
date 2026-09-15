/**
 * Ruteo real para el mapa del recorrido de hoy (Fase 17) — distinto del ruteo interno del
 * motor de optimización (packages/optimization sólo usa `RouteProvider` para puntuar
 * planes, nunca expone geometría). Acá el cliente sí necesita distancia/duración/polyline
 * reales para dibujar el mapa.
 */
import { z } from "zod";
import { latLngSchema } from "./optimize";

export const routeComputeRequestSchema = z.object({
  waypoints: z.array(latLngSchema).min(2).max(6),
  transportMode: z.enum(["CAR", "MOTORCYCLE", "BICYCLE", "WALK", "PUBLIC_TRANSPORT"]).default("CAR"),
});
export type RouteComputeRequest = z.input<typeof routeComputeRequestSchema>;

export const routeComputeResponseSchema = z.object({
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  /** `null` cuando el proveedor activo no da geometría (ej. `MockRouteProvider`, sin Mapbox configurado). */
  polyline: z.string().nullable(),
});
export type RouteComputeResponse = z.infer<typeof routeComputeResponseSchema>;
