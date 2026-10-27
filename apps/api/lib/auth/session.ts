/**
 * Sesiones: access token JWT (corto) + refresh token opaco (largo).
 * En la tabla `sessions` se guarda el hash SHA-256 del refresh token, no el token: un dump
 * de la tabla no alcanza para robar sesiones. El access token lleva `sid` para poder
 * revocarlo al instante (logout) aunque todavía no haya vencido.
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@depaso/database";
import { ACCESS_TOKEN_TTL_MINUTES, SESSION_TTL_DAYS, type AuthSession } from "@depaso/domain";
import { signAccessToken, verifyAccessToken } from "./jwt";

const ACCESS_TTL_MS = ACCESS_TOKEN_TTL_MINUTES * 60 * 1000;
const REFRESH_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildAccessToken(userId: string, sessionId: string) {
  const expiresAt = new Date(Date.now() + ACCESS_TTL_MS);
  const token = signAccessToken({ sub: userId, sid: sessionId, exp: Math.floor(expiresAt.getTime() / 1000) });
  return { token, expiresAt };
}

export async function createSession(userId: string): Promise<AuthSession> {
  const refreshToken = randomBytes(32).toString("base64url");
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  const row = await prisma.session.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiresAt },
  });

  const access = buildAccessToken(userId, row.id);
  return {
    userId,
    token: access.token,
    expiresAt: access.expiresAt.toISOString(),
    refreshToken,
    refreshExpiresAt: refreshExpiresAt.toISOString(),
  };
}

/** Valida el access token (firma + vencimiento) y que la sesión no esté revocada. */
export async function verifySession(token: string): Promise<AuthSession | null> {
  const payload = verifyAccessToken(token);
  if (!payload) return null;

  const row = await prisma.session.findUnique({ where: { id: payload.sid } });
  if (!row || row.revokedAt || row.userId !== payload.sub || row.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  return { userId: payload.sub, token, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

/**
 * Canjea un refresh token por un par nuevo. El refresh viejo se revoca (rotación): si
 * alguien lo reusa, el canje falla.
 */
export async function refreshSession(refreshToken: string): Promise<AuthSession | null> {
  const row = await prisma.session.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) return null;

  const revoked = await prisma.session.updateMany({
    where: { id: row.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (revoked.count === 0) return null;

  return createSession(row.userId);
}

/** Logout: revoca la sesión a la que pertenece el access token. */
export async function revokeSession(token: string): Promise<void> {
  const payload = verifyAccessToken(token);
  if (!payload) return;
  await prisma.session.updateMany({
    where: { id: payload.sid, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Revoca todas las sesiones activas de un usuario — usado al eliminar la cuenta. */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
