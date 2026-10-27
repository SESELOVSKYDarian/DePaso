/**
 * JWT HS256 mínimo, sin dependencias (node:crypto). Sólo se usa para el access token.
 * El refresh token NO es JWT: es un valor al azar que se guarda hasheado en `sessions`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface AccessPayload {
  /** userId */
  sub: string;
  /** id de la fila de `sessions` (permite revocar el access token al hacer logout) */
  sid: string;
  /** vencimiento, en segundos desde epoch */
  exp: number;
}

function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error("AUTH_SESSION_SECRET no está configurada");
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function signAccessToken(payload: AccessPayload): string {
  const head = encode({ alg: "HS256", typ: "JWT" });
  const body = encode(payload);
  return `${head}.${body}.${sign(`${head}.${body}`)}`;
}

/** Devuelve el payload si la firma es válida y no venció; si no, null. */
export function verifyAccessToken(token: string): AccessPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head, body, signature] = parts as [string, string, string];

  // comparo la firma en tiempo constante
  const expected = Buffer.from(sign(`${head}.${body}`));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AccessPayload;
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
