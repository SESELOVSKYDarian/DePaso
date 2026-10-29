import type { AnnouncementResponse } from "@depaso/validation";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdAt: Date;
}

/** Fila de la base → lo que ve la app. */
export function toAnnouncementResponse(row: AnnouncementRow): AnnouncementResponse {
  return { id: row.id, title: row.title, body: row.body, active: row.active, createdAt: row.createdAt.toISOString() };
}
