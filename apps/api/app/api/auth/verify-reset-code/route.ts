import { prisma } from "@depaso/database";
import { verifyResetCodeRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { verifyResetCode } from "@/lib/auth/passwordReset";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/request";

const IP_LIMIT = { max: 20, windowMs: 60 * 60 * 1000 };
/** Comparte el contador de intentos por email con `reset-password`. */
const CODE_ATTEMPTS = { max: 8, windowMs: 30 * 60 * 1000 };

/**
 * `POST /api/auth/verify-reset-code` - paso 2 de la recuperación: confirma que el código del
 * mail es válido sin cambiar la contraseña, para que la app recién habilite la pantalla de
 * "contraseña nueva" cuando el código es correcto. No consume el código.
 */
export async function POST(request: NextRequest) {
  if (!checkRateLimit(`verify-reset:${getClientIp(request)}`, IP_LIMIT.max, IP_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const parsed = verifyResetCodeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { email, code } = parsed.data;

  if (!checkRateLimit(`reset-code:${email}`, CODE_ATTEMPTS.max, CODE_ATTEMPTS.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || !verifyResetCode(code, user.id, user.passwordHash)) {
    return NextResponse.json({ error: "INVALID_OR_EXPIRED_TOKEN" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
