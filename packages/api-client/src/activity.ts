import {
  activityFeedResponseSchema,
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
    /** Avisos para este usuario: listas compartidas, bajas de precio y ofertas cerca. */
    feed: () => client.post("/api/activity/feed", {}, activityFeedResponseSchema),
    /** Para administradores: todas las novedades y su gestión. */
    admin: {
      list: () => client.post("/api/admin/announcements/list", {}, announcementsResponseSchema),
      create: (input: AnnouncementInput) => client.post("/api/admin/announcements", input, announcementSchema),
      update: (id: string, input: AnnouncementUpdate) => client.put("/api/admin/announcements", { id, ...input }, announcementSchema),
      remove: (id: string) => client.delete("/api/admin/announcements", { id }, okSchema),
    },
  };
}
