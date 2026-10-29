import nodemailer from "nodemailer";

/**
 * Envío de mails transaccionales por SMTP (nodemailer).
 *
 * Variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` y opcional
 * `SMTP_SECURE` (`true` para TLS directo, típico del puerto 465). Sin ellas `sendEmail`
 * devuelve `not_configured`.
 */
export type SendEmailResult = "sent" | "not_configured" | "failed";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/** Lee la configuración SMTP del entorno; null si falta algo. */
function readConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 465) || 465;
  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureEnv ? secureEnv === "true" : port === 465;
  const from = process.env.SMTP_FROM?.trim() || user;
  return { host, port, secure, user, pass, from };
}

/** `true` si el servidor puede mandar mails. */
export function isEmailConfigured(): boolean {
  return readConfig() !== null;
}

/** Manda un mail (texto y HTML). */
export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<SendEmailResult> {
  const config = readConfig();
  if (!config) return "not_configured";

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    await transporter.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return "sent";
  } catch (error) {
    console.error("smtp send failed", error);
    return "failed";
  }
}
