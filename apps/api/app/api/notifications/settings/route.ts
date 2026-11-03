import { prisma } from "@depaso/database";
import { DEFAULT_NOTIFICATION_SETTINGS, notificationSettingsUpdateSchema, type NotificationSettings } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

async function readSettings(userId: string): Promise<NotificationSettings> {
  const row = await prisma.notificationSettings.findUnique({ where: { userId } });
  if (!row) return DEFAULT_NOTIFICATION_SETTINGS;
  return { news: row.news, offers: row.offers, lists: row.lists, routes: row.routes };
}

/** `POST /api/notifications/settings` — qué avisos del celular tiene activos la persona. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json(await readSettings(current.userId));
}

/** `PUT /api/notifications/settings` — activa o apaga una o más categorías. */
export async function PUT(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = notificationSettingsUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  await prisma.notificationSettings.upsert({
    where: { userId: current.userId },
    update: parsed.data,
    create: { userId: current.userId, ...parsed.data },
  });
  return NextResponse.json(await readSettings(current.userId));
}
