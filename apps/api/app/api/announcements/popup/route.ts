import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Un anuncio sin fecha de vencimiento solo vale unos días como ventana: después ya es noticia vieja. */
const POPUP_WINDOW_DAYS = 14;

/**
 * El anuncio más nuevo marcado como "ventana emergente" (con su imagen grande). La app decide si
 * ya se lo mostró a la persona: acá solo se dice cuál es el vigente.
 */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const now = new Date();
  const since = new Date(now.getTime() - POPUP_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const row = await prisma.announcement.findFirst({
    where: {
      active: true,
      showPopup: true,
      // con vencimiento rige hasta esa fecha; sin vencimiento, los últimos días
      OR: [{ expiresAt: { gt: now } }, { expiresAt: null, createdAt: { gte: since } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return NextResponse.json({ announcement: null });

  return NextResponse.json({
    announcement: {
      id: row.id,
      title: row.title,
      body: row.body,
      emoji: row.emoji,
      imageData: row.imageData,
      createdAt: row.createdAt.toISOString(),
    },
  });
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
