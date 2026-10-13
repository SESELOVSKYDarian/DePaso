/**
 * Envío de mails transaccionales vía Resend (https://resend.com), por HTTP.
 * Requiere `RESEND_API_KEY` y `EMAIL_FROM` (por ejemplo `DePaso <no-reply@tudominio.com>`,
 * con el dominio verificado en Resend). Sin ellas `sendEmail` devuelve `not_configured`.
 */
export type SendEmailResult = "sent" | "not_configured" | "failed";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return "not_configured";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html, text: input.text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error("resend rejected email", response.status, await response.text().catch(() => ""));
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("resend request failed", error);
    return "failed";
  }
}
