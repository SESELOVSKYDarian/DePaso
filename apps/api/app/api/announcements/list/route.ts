import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { toAnnouncementResponse } from "@/lib/activity/announcements";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Novedades publicadas por el equipo (solo las activas), las más nuevas primero. */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rows = await prisma.announcement.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 30 });
  return NextResponse.json({ announcements: rows.map(toAnnouncementResponse) });
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
