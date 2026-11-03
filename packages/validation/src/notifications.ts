import { z } from "zod";

/** Token de Expo Push que manda el celular: `ExponentPushToken[...]` o `ExpoPushToken[...]`. */
export const registerPushTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(10)
    .max(255)
    .regex(/^Expo(nent)?PushToken\[.+\]$/, "Token de notificaciones inválido."),
  platform: z.enum(["ios", "android", "web"]),
});
export type RegisterPushTokenRequest = z.infer<typeof registerPushTokenSchema>;

export const unregisterPushTokenSchema = z.object({ token: z.string().trim().min(10).max(255) });
export type UnregisterPushTokenRequest = z.infer<typeof unregisterPushTokenSchema>;

/** Qué avisos quiere recibir la persona en el celular. */
export const notificationSettingsSchema = z.object({
  /** Novedades y anuncios del equipo. */
  news: z.boolean(),
  /** Ofertas y bajas de precio de tus listas. */
  offers: z.boolean(),
  /** Alguien compartió una lista con vos. */
  lists: z.boolean(),
  /** Aviso al empezar tu recorrido. */
  routes: z.boolean(),
});
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const notificationSettingsUpdateSchema = notificationSettingsSchema.partial();
export type NotificationSettingsUpdate = z.infer<typeof notificationSettingsUpdateSchema>;

/** Valores de entrada cuando todavía no se eligió nada: todo activo. */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = { news: true, offers: true, lists: true, routes: true };
