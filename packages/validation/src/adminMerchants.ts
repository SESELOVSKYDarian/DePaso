import { z } from "zod";
import { adKindSchema } from "./ads";

/** Un comercio habilitado en la app, tal como lo ve el administrador. */
export const adminMerchantSchema = z.object({
  branchId: z.string(),
  storeName: z.string(),
  branchName: z.string(),
  address: z.string(),
  ownerName: z.string().nullable(),
  ownerEmail: z.string(),
  /** `true` si el comercio está habilitado (sus precios y su publicidad se ven). */
  enabled: z.boolean(),
  /** Publicidades que tiene vigentes ahora. */
  activeAds: z.array(z.object({ id: z.string(), kind: adKindSchema, title: z.string(), endsAt: z.string() })),
  /** Pedidos de publicidad que esperan una respuesta. */
  pendingAds: z.number(),
});
export type AdminMerchant = z.infer<typeof adminMerchantSchema>;

export const adminMerchantsResponseSchema = z.object({ merchants: z.array(adminMerchantSchema) });
export type AdminMerchantsResponse = z.infer<typeof adminMerchantsResponseSchema>;

/** Búsqueda opcional por nombre, dirección o mail. */
export const adminMerchantsQuerySchema = z.object({ query: z.string().trim().max(80).optional() });

/** Habilitar o deshabilitar un comercio. */
export const adminMerchantToggleSchema = z.object({ enabled: z.boolean() });