import { prisma } from "@depaso/database";
import { announcementInputSchema, announcementUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { toAnnouncementResponse } from "@/lib/activity/announcements";
import { runInBackground } from "@/lib/http/background";
import { notifyUsers } from "@/lib/push/notify";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/admin/announcements — el administrador publica una novedad. */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = announcementInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  const { sendPush, emoji, imageData, thumbData, ...rest } = parsed.data;
  let created = await prisma.announcement.create({
    data: { ...rest, emoji: emoji || null, imageData: imageData ?? null, thumbData: thumbData ?? null, authorId: admin.userId },
  });

  // como notificación al celular de todos los que tienen activas las novedades (después de responder)
  if (sendPush) {
    created = await prisma.announcement.update({ where: { id: created.id }, data: { pushedAt: new Date() } });
    const text = created.emoji ? `${created.emoji} ${created.title}` : created.title;
    runInBackground(() => notifyUsers({ category: "news", title: text, body: created.body.slice(0, 180), data: { type: "announcement", id: created.id } }));
  }
  return NextResponse.json(toAnnouncementResponse(created), { status: 201 });
}

/** PUT — cambia el texto o oculta/muestra la novedad. */
async function handleUpdate(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const parsed = announcementUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  const { count } = await prisma.announcement.updateMany({ where: { id }, data: parsed.data });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json(toAnnouncementResponse(await prisma.announcement.findUniqueOrThrow({ where: { id } })));
}

/** DELETE — borra la novedad. */
async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const { count } = await prisma.announcement.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// PUT y DELETE: el id llega en el body JSON.
export const PUT = postWithParams(["id"], handleUpdate);
export const DELETE = postWithParams(["id"], handleDelete);
