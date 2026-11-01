import { sendEmail, type SendEmailResult } from "@/lib/integrations/email";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/** Manda el mail con el código para confirmar la cuenta. */
export function sendVerifyEmail(input: { to: string; displayName: string | null; code: string }): Promise<SendEmailResult> {
  const name = input.displayName ? (input.displayName.split(" ")[0] ?? "") : "";
  const greeting = name ? `Hola ${escapeHtml(name)}` : "Hola";
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1D1D1F;">
<div style="max-width:420px;margin:0 auto;background:#FFFFFF;border-radius:20px;padding:28px;">
  <p style="margin:0 0 4px;font-size:15px;color:#6E6E73;">DePaso</p>
  <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;">Confirmá tu mail</h1>
  <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#515154;">${greeting}. Escribí este código en la app para terminar de crear tu cuenta:</p>
  <p style="margin:0 0 20px;font-size:34px;letter-spacing:6px;font-weight:700;text-align:center;background:#F5F5F7;border-radius:14px;padding:16px 8px;">${input.code}</p>
  <p style="margin:0;font-size:13px;line-height:19px;color:#6E6E73;">Vale cerca de una hora. Si no creaste una cuenta en DePaso, ignorá este mail.</p>
</div></body></html>`;
  return sendEmail({
    to: input.to,
    subject: `${input.code} es tu código para confirmar DePaso`,
    text: `${name ? `Hola ${name}` : "Hola"}. Tu código para confirmar tu cuenta de DePaso es ${input.code}. Escribilo en la app (vale cerca de una hora). Si no creaste la cuenta, ignorá este mail.`,
    html,
  });
}
