import { z } from "zod";

/** Token público (`pk.*`) de Mapbox GL JS para el mapa visual (Fase 17). Un token `pk.*`
 * está pensado por Mapbox para viajar al cliente — no es un secreto como el que usan
 * geocoding/routing server-side, pero se sirve desde acá para no duplicar la variable de
 * entorno entre `apps/api` y `apps/mobile`. */
export const mapConfigResponseSchema = z.object({ token: z.string().nullable() });
export type MapConfigResponse = z.infer<typeof mapConfigResponseSchema>;
