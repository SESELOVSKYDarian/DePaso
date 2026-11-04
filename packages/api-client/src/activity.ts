import {
  activityFeedResponseSchema,
  activitySummarySchema,
  announcementPopupResponseSchema,
  announcementSchema,
  announcementsResponseSchema,
  type AnnouncementInput,
  type AnnouncementUpdate,
} from "@depaso/validation";
import { z } from "zod";
import type { DepasoApiClient } from "./client";

const okSchema = z.object({ ok: z.boolean() });

/** Actividad: novedades del equipo y avisos personales — ver apps/api/app/api/{announcements,activity,admin/announcements}. */
export function createActivityClient(client: DepasoApiClient) {
  return {
    /** Novedades que publica el equipo (solo las activas). */
    announcements: () => client.post("/api/announcements/list", {}, announcementsResponseSchema),
    /** El anuncio vigente para mostrar como ventana emergente al abrir la app (o `null`). */
    popup: () => client.post("/api/announcements/popup", {}, announcementPopupResponseSchema),
    /** Avisos para este usuario: listas compartidas, bajas de precio y ofertas cerca. */
    feed: () => client.post("/api/activity/feed", {}, activityFeedResponseSchema),
    /** Los numeritos de la app: lo que espera respuesta en Actividad y en Administración. */
    summary: () => client.post("/api/activity/summary", {}, activitySummarySchema),
    /** Para administradores: todas las novedades y su gestión. */
    admin: {
      list: () => client.post("/api/admin/announcements/list", {}, announcementsResponseSchema),
      create: (input: AnnouncementInput) => client.post("/api/admin/announcements", input, announcementSchema),
      update: (id: string, input: AnnouncementUpdate) => client.put("/api/admin/announcements", { id, ...input }, announcementSchema),
      remove: (id: string) => client.delete("/api/admin/announcements", { id }, okSchema),
    },
  };
}
