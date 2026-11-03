import { z } from "zod";

/** Novedad publicada por un administrador. */
export const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  /** Visible para los usuarios; el admin puede ocultarla sin borrarla. */
  active: z.boolean(),
  /** Emoji o ícono corto que acompaña al anuncio. */
  emoji: z.string().nullable().default(null),
  /** Miniatura de la imagen (la imagen grande solo viaja en la ventana emergente). */
  thumbData: z.string().nullable().default(null),
  /** Si se muestra como ventana emergente al abrir la app. */
  showPopup: z.boolean().default(false),
  /** Cuándo se mandó como notificación al celular (null = no se mandó). */
  pushedAt: z.string().nullable().default(null),
  createdAt: z.string(),
});
export type AnnouncementResponse = z.infer<typeof announcementSchema>;

export const announcementsResponseSchema = z.object({ announcements: z.array(announcementSchema) });
export type AnnouncementsResponse = z.infer<typeof announcementsResponseSchema>;

/** Imagen ya comprimida como data URI. El tope evita cuerpos enormes (el servidor corta en 1 MB). */
const imageDataUri = z
  .string()
  .max(700_000, "La imagen es muy pesada.")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Imagen inválida.");
const thumbDataUri = z
  .string()
  .max(60_000, "La miniatura es muy pesada.")
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Miniatura inválida.");

/** Lo que escribe el administrador al publicar. */
export const announcementInputSchema = z.object({
  title: z.string().trim().min(3, "El título es muy corto.").max(120),
  body: z.string().trim().min(3, "Escribí el mensaje.").max(2000),
  /** Emoji o ícono corto (hasta 8 caracteres). */
  emoji: z.string().trim().max(8).optional(),
  /** Imagen grande para la ventana emergente. */
  imageData: imageDataUri.optional(),
  /** Miniatura para las listas; si falta, se usa solo el emoji. */
  thumbData: thumbDataUri.optional(),
  /** Mostrarla como ventana emergente al abrir la app. */
  showPopup: z.boolean().default(false),
  /** Mandarla además como notificación al celular de todos. */
  sendPush: z.boolean().default(false),
});
export type AnnouncementInput = z.input<typeof announcementInputSchema>;

/** Cambios de una novedad: texto, imagen o mostrarla/ocultarla. */
export const announcementUpdateSchema = announcementInputSchema
  .omit({ sendPush: true, emoji: true, imageData: true, thumbData: true })
  .partial()
  .extend({
    active: z.boolean().optional(),
    emoji: z.string().trim().max(8).nullable().optional(),
    imageData: imageDataUri.nullable().optional(),
    thumbData: thumbDataUri.nullable().optional(),
  });
export type AnnouncementUpdate = z.infer<typeof announcementUpdateSchema>;

/** Anuncio para la ventana emergente de la app: con la imagen grande. */
export const announcementPopupSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  emoji: z.string().nullable(),
  imageData: z.string().nullable(),
  createdAt: z.string(),
});
export type AnnouncementPopup = z.infer<typeof announcementPopupSchema>;
export const announcementPopupResponseSchema = z.object({ announcement: announcementPopupSchema.nullable() });
export type AnnouncementPopupResponse = z.infer<typeof announcementPopupResponseSchema>;

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
