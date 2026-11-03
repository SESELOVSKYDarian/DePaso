import type { AnnouncementResponse } from "@depaso/validation";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  active: boolean;
  emoji: string | null;
  thumbData: string | null;
  showPopup: boolean;
  pushedAt: Date | null;
  createdAt: Date;
}

/** Fila de la base → lo que ve la app (con la miniatura; la imagen grande va aparte, en la ventana emergente). */
export function toAnnouncementResponse(row: AnnouncementRow): AnnouncementResponse {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    active: row.active,
    emoji: row.emoji,
    thumbData: row.thumbData,
    showPopup: row.showPopup,
    pushedAt: row.pushedAt ? row.pushedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Columnas que se piden de la base para las listas: sin la imagen grande, que pesa. */
export const ANNOUNCEMENT_LIST_SELECT = {
  id: true,
  title: true,
  body: true,
  active: true,
  emoji: true,
  thumbData: true,
  showPopup: true,
  pushedAt: true,
  createdAt: true,
} as const;
