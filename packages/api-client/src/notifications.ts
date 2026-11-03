import {
  notificationSettingsSchema,
  type NotificationSettingsUpdate,
  type RegisterPushTokenRequest,
} from "@depaso/validation";
import { z } from "zod";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.boolean() });

/** Notificaciones del celular — ver apps/api/app/api/notifications/{token,settings}. */
export function createNotificationsClient(client: DepasoApiClient) {
  return {
    /** El celular registra su token de Expo Push. */
    registerToken: (body: RegisterPushTokenRequest) => client.post("/api/notifications/token", body, okSchema),
    /** El celular deja de recibir avisos. */
    unregisterToken: (token: string) => client.delete("/api/notifications/token", { token }, okSchema),
    /** Qué avisos tiene activos la persona. */
    settings: () => client.post("/api/notifications/settings", {}, notificationSettingsSchema),
    /** Activa o apaga categorías. */
    updateSettings: (body: NotificationSettingsUpdate) => client.put("/api/notifications/settings", body, notificationSettingsSchema),
  };
}
