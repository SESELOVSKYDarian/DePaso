import { z } from "zod";

/** Novedad publicada por un administrador. */
export const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  /** Visible para los usuarios; el admin puede ocultarla sin borrarla. */
  active: z.boolean(),
  createdAt: z.string(),
});
export type AnnouncementResponse = z.infer<typeof announcementSchema>;

export const announcementsResponseSchema = z.object({ announcements: z.array(announcementSchema) });
export type AnnouncementsResponse = z.infer<typeof announcementsResponseSchema>;

/** Lo que escribe el administrador al publicar. */
export const announcementInputSchema = z.object({
  title: z.string().trim().min(3, "El título es muy corto.").max(120),
  body: z.string().trim().min(3, "Escribí el mensaje.").max(2000),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

/** Cambios de una novedad: texto o mostrarla/ocultarla. */
export const announcementUpdateSchema = announcementInputSchema.partial().extend({ active: z.boolean().optional() });
export type AnnouncementUpdate = z.infer<typeof announcementUpdateSchema>;

/** Tipos de aviso personal de la pestaña "Para vos". */
export const activityItemTypeSchema = z.enum(["LIST_SHARED", "PRICE_DROP", "CHEAP_NEARBY"]);
export type ActivityItemType = z.infer<typeof activityItemTypeSchema>;

export const activityItemSchema = z.object({
  id: z.string(),
  type: activityItemTypeSchema,
  title: z.string(),
  detail: z.string(),
  /** Cuándo pasó (los avisos de precio son del momento y no traen fecha). */
  at: z.string().nullable(),
  /** Si es una lista compartida, a cuál abrir. */
  listId: z.string().nullable(),
});
export type ActivityItem = z.infer<typeof activityItemSchema>;

export const activityFeedResponseSchema = z.object({ items: z.array(activityItemSchema) });
export type ActivityFeedResponse = z.infer<typeof activityFeedResponseSchema>;
