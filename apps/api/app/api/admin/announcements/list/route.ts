import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { toAnnouncementResponse } from "@/lib/activity/announcements";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Todas las novedades (también las ocultas) para que el administrador las gestione. */
async function handle(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ announcements: rows.map(toAnnouncementResponse) });
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
