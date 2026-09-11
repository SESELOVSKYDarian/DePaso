/**
 * Sesiones sobre Prisma. Se guarda un hash SHA-256 del token, no el token — un dump de la
 * tabla `sessions` no alcanza para robar sesiones activas (mismo criterio que el hash de
 * password: defensa en profundidad, sección 81).
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@depaso/database";
import { SESSION_TTL_DAYS, type AuthSession } from "@depaso/domain";

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<AuthSession> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  return { userId, token, expiresAt: expiresAt.toISOString() };
}

export async function verifySession(token: string): Promise<AuthSession | null> {
  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  return { userId: session.userId, token, expiresAt: session.expiresAt.toISOString() };
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
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
