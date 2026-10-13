import { prisma } from "@depaso/database";
import { resetPasswordRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { createPrismaAuthProvider } from "@/lib/auth/authProvider";
import { peekResetUserId, verifyResetToken } from "@/lib/auth/passwordReset";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/request";
import { revokeAllUserSessions } from "@/lib/auth/session";

const authProvider = createPrismaAuthProvider();
const RESET_RATE_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 };

/** `POST /api/auth/reset-password` — canjea el token del mail por una contraseña nueva. */
export async function POST(request: NextRequest) {
  if (!checkRateLimit(`reset:${getClientIp(request)}`, RESET_RATE_LIMIT.max, RESET_RATE_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = resetPasswordRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const invalid = () => NextResponse.json({ error: "INVALID_OR_EXPIRED_TOKEN" }, { status: 400 });

  const userId = peekResetUserId(token);
  if (!userId) return invalid();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) return invalid();
  if (!verifyResetToken(token, user.id, user.passwordHash)) return invalid();

  const passwordHash = await authProvider.hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  // Quien tuviera la sesión abierta con la contraseña vieja queda afuera.
  await revokeAllUserSessions(user.id);

  return NextResponse.json({ ok: true });
}
