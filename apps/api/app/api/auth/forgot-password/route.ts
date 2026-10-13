import { prisma } from "@depaso/database";
import { forgotPasswordRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { createResetCode, createResetToken } from "@/lib/auth/passwordReset";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/request";
import { isEmailConfigured, sendEmail } from "@/lib/email";

const FORGOT_RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function resetEmailHtml(input: { name: string; code: string; link: string }): string {
  const greeting = input.name ? `Hola ${input.name}` : "Hola";
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1D1D1F;">
<div style="max-width:420px;margin:0 auto;background:#FFFFFF;border-radius:20px;padding:28px;">
  <p style="margin:0 0 4px;font-size:15px;color:#6E6E73;">DePaso</p>
  <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;">Elegí una contraseña nueva</h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#515154;">${greeting}. Escribí este código en la app, en la pantalla donde pediste el cambio:</p>
  <p style="margin:0 0 20px;font-size:34px;letter-spacing:6px;font-weight:700;text-align:center;background:#F5F5F7;border-radius:14px;padding:16px 8px;">${input.code}</p>
  <p style="margin:0 0 20px;font-size:13px;line-height:19px;color:#6E6E73;">Vale unos 30 minutos y se usa una sola vez. Si preferís, también podés <a href="${input.link}" style="color:#1D1D1F;">cambiarla desde el navegador</a>.</p>
  <p style="margin:0;font-size:13px;line-height:19px;color:#6E6E73;">Si no lo pediste vos, ignorá este mail: tu contraseña sigue siendo la misma.</p>
</div></body></html>`;
}

/**
 * `POST /api/auth/forgot-password` — manda un mail con un código de 8 dígitos (para escribir
 * en la app) y un link de respaldo. Responde igual exista o no el email (no revela qué
 * cuentas hay, sección 81); la única diferencia visible es 503 cuando el servidor no tiene
 * mail configurado.
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
    const code = createResetCode(user.id, user.passwordHash);
    const token = createResetToken(user.id, user.passwordHash);
    const link = `${request.nextUrl.origin}/reset-password?token=${encodeURIComponent(token)}`;
    const name = user.displayName ? (user.displayName.split(" ")[0] ?? "") : "";
    const result = await sendEmail({
      to: user.email,
      subject: `${code} es tu código de DePaso`,
      text: `Hola${name ? ` ${name}` : ""}. Tu código para elegir una contraseña nueva es ${code}. Escribilo en la app (vale unos 30 minutos y se usa una sola vez). También podés cambiarla desde el navegador: ${link}. Si no lo pediste vos, ignorá este mail.`,
      html: resetEmailHtml({ name: escapeHtml(name), code, link }),
    });
    if (result === "failed") {
      return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
