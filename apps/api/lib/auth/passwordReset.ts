import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token de recuperación de contraseña sin tabla propia.
 *
 * Formato: `base64url({uid, exp}).firma`, con la firma = HMAC-SHA256 sobre el payload y el
 * hash de contraseña vigente del usuario. Al cambiar la contraseña el hash cambia y el token
 * deja de validar: sirve una sola vez y no hace falta guardarlo.
 */

const RESET_TTL_MS = 30 * 60 * 1000;

function secret(): string {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value) throw new Error("AUTH_SESSION_SECRET no está configurada");
  return value;
}

function sign(payload: string, passwordHash: string): string {
  return createHmac("sha256", secret()).update(`${payload}.${passwordHash}`).digest("base64url");
}

export function createResetToken(userId: string, passwordHash: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: now + RESET_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload, passwordHash)}`;
}

/** Lee el `uid` sin validar la firma — sólo para saber a qué usuario pedirle el hash. */
export function peekResetUserId(token: string): string | null {
  const [payload] = token.split(".");
  if (!payload) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid?: unknown };
    return typeof parsed.uid === "string" ? parsed.uid : null;
  } catch {
    return null;
  }
}

export function verifyResetToken(token: string, userId: string, passwordHash: string, now = Date.now()): boolean {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload, passwordHash));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid?: unknown; exp?: unknown };
    return parsed.uid === userId && typeof parsed.exp === "number" && parsed.exp > now;
  } catch {
    return false;
  }
}
