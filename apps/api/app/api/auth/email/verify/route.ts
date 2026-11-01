import { prisma } from "@depaso/database";
import { verifyEmailRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { ensureAdminRole } from "@/lib/auth/adminEmails";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { verifyEmailCode } from "@/lib/auth/emailVerification";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { toUserPayload } from "@/lib/auth/userPayload";

// 8 dígitos: con 10 intentos por hora adivinarlo es impráctico
const VERIFY_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 };

/** `POST /api/auth/email/verify` — confirma el mail de la cuenta actual con el código de 8 dígitos. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(`verify-code:${current.userId}`, VERIFY_LIMIT.max, VERIFY_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = verifyEmailRequestSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

  let user = await prisma.user.findUnique({ where: { id: current.userId }, include: { profile: true } });
  if (!user || user.deletedAt) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  if (!user.emailVerifiedAt) {
    if (!verifyEmailCode(parsed.data.code, user.id, user.email)) {
      return NextResponse.json({ error: "INVALID_CODE" }, { status: 400 });
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      include: { profile: true },
    });
  }

  const role = await ensureAdminRole(user);
  return NextResponse.json(toUserPayload(user, user.profile?.marketingOptIn ?? false, role));
}
