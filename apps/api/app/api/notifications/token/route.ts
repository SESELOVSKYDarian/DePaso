import { prisma } from "@depaso/database";
import { registerPushTokenSchema, unregisterPushTokenSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkRateLimit } from "@/lib/auth/rateLimit";

/**
 * `POST /api/notifications/token` — el celular registra su token de notificaciones. Si el token ya
 * existía (por ejemplo, otra cuenta entró en el mismo celular) pasa a la cuenta actual.
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(`push-token:${current.userId}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const parsed = registerPushTokenSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  await prisma.pushToken.upsert({
    where: { token: parsed.data.token },
    update: { userId: current.userId, platform: parsed.data.platform },
    create: { userId: current.userId, token: parsed.data.token, platform: parsed.data.platform },
  });
  return NextResponse.json({ ok: true });
}

/** `DELETE /api/notifications/token` — el celular deja de recibir avisos (cierre de sesión o los apagó). */
export async function DELETE(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = unregisterPushTokenSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

  // solo borra el token si es de la cuenta actual
  await prisma.pushToken.deleteMany({ where: { token: parsed.data.token, userId: current.userId } });
  return NextResponse.json({ ok: true });
}
