import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createEmailCode } from "@/lib/auth/emailVerification";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { sendVerifyEmail } from "@/lib/auth/verifyEmailMail";
import { isEmailConfigured } from "@/lib/integrations/email";

// máximo 5 mails por hora por cuenta: alcanza para reenviar y no sirve para mandar spam
const SEND_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

/** `POST /api/auth/email/send-code` — manda (o reenvía) el código para confirmar el mail de la cuenta actual. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(`verify-send:${current.userId}`, SEND_LIMIT.max, SEND_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  if (!isEmailConfigured()) return NextResponse.json({ error: "EMAIL_NOT_CONFIGURED" }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id: current.userId } });
  if (!user || user.deletedAt) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true });

  const result = await sendVerifyEmail({
    to: user.email,
    displayName: user.displayName,
    code: createEmailCode(user.id, user.email),
  });
  if (result !== "sent") return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
