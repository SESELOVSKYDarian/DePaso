/**
 * Comercios que quedan "de paso" sobre el recorrido de hoy: cada uno con cuánto hay que
 * desviarse del camino para pasar por ahí. Alimenta los pines del mapa.
 */
import { z } from "zod";
import { latLngSchema } from "./optimize";

export const nearbyStoresRequestSchema = z.object({
  waypoints: z.array(latLngSchema).min(2).max(6),
  /** Polyline (precisión 5) de la ruta real: con ella el desvío es mucho más preciso. */
  polyline: z.string().max(60_000).nullish(),
  /** Desvío máximo a mostrar. Por defecto 1,5 km: más que eso ya no es "de paso". */
  maxDetourMeters: z.number().int().min(200).max(5000).default(1500),
  limit: z.number().int().min(1).max(60).default(30),
});
export type NearbyStoresRequest = z.input<typeof nearbyStoresRequestSchema>;

export const nearbyStoreSchema = z.object({
  branchId: z.string(),
  storeName: z.string(),
  branchName: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  /** Metros extra de recorrido para pasar por el comercio y seguir (ida y vuelta al camino). */
  detourMeters: z.number().nonnegative(),
  detourSeconds: z.number().nonnegative(),
  /** Qué tan lejos queda del camino, en línea recta. */
  distanceFromRouteMeters: z.number().nonnegative(),
});
export type NearbyStore = z.infer<typeof nearbyStoreSchema>;

export const nearbyStoresResponseSchema = z.object({
  stores: z.array(nearbyStoreSchema),
});
export type NearbyStoresResponse = z.infer<typeof nearbyStoresResponseSchema>;
