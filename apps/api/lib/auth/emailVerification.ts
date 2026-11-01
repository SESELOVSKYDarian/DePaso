import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Código de 8 dígitos para confirmar el mail de una cuenta nueva, sin tabla propia.
 *
 * Es un HMAC sobre el usuario y su email con una ventana de 10 minutos; se aceptan la actual
 * y las 5 anteriores (≈ 1 hora). Al cambiar el email el código deja de servir.
 */
const WINDOW_MS = 10 * 60 * 1000;
const WINDOWS_ACCEPTED = 6;

function secret(): string {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value) throw new Error("AUTH_SESSION_SECRET no está configurada");
  return value;
}

function codeForWindow(userId: string, email: string, windowIndex: number): string {
  const digest = createHmac("sha256", secret()).update(`verify-email|${userId}|${email}|${windowIndex}`).digest();
  return String(digest.readUInt32BE(0) % 100_000_000).padStart(8, "0");
}

/** Código vigente ahora, para mandar por mail. */
export function createEmailCode(userId: string, email: string, now = Date.now()): string {
  return codeForWindow(userId, email, Math.floor(now / WINDOW_MS));
}

/** Revisa si el código es válido (ventana actual o las anteriores), en tiempo constante. */
export function verifyEmailCode(code: string, userId: string, email: string, now = Date.now()): boolean {
  if (!/^\d{8}$/.test(code)) return false;
  const current = Math.floor(now / WINDOW_MS);
  const received = Buffer.from(code);
  let valid = false;
  for (let offset = 0; offset < WINDOWS_ACCEPTED; offset += 1) {
    if (timingSafeEqual(Buffer.from(codeForWindow(userId, email, current - offset)), received)) valid = true;
  }
  return valid;
}
