import { prisma } from "@depaso/database";
import { forgotPasswordRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { createResetToken } from "@/lib/auth/passwordReset";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/request";
import { isEmailConfigured, sendEmail } from "@/lib/email";

const FORGOT_RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * `POST /api/auth/forgot-password` — manda un link para elegir una contraseña nueva.
 * Responde igual exista o no el email (no revela qué cuentas hay, sección 81); la única
 * diferencia visible es 503 cuando el servidor no tiene mail configurado.
 */
export async function POST(request: NextRequest) {
  if (!checkRateLimit(`forgot:${getClientIp(request)}`, FORGOT_RATE_LIMIT.max, FORGOT_RATE_LIMIT.windowMs)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = forgotPasswordRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "EMAIL_NOT_CONFIGURED" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && !user.deletedAt) {
    const token = createResetToken(user.id, user.passwordHash);
    const link = `${request.nextUrl.origin}/reset-password?token=${encodeURIComponent(token)}`;
    const name = user.displayName ? escapeHtml(user.displayName.split(" ")[0] ?? "") : "";
    const result = await sendEmail({
      to: user.email,
      subject: "Elegí una contraseña nueva para DePaso",
      text: `Hola${name ? ` ${name}` : ""}. Para elegir una contraseña nueva entrá a ${link} (vale 30 minutos). Si no lo pediste vos, ignorá este mail.`,
      html: `<p>Hola${name ? ` ${name}` : ""}.</p><p>Para elegir una contraseña nueva entrá acá (el link vale 30 minutos):</p><p><a href="${link}">Cambiar mi contraseña</a></p><p>Si no lo pediste vos, ignorá este mail: tu contraseña sigue siendo la misma.</p>`,
    });
    if (result === "failed") {
      return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
