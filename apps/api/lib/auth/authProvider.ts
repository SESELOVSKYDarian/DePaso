import type { AuthProvider } from "@depaso/domain";
import { hashPassword, verifyPassword } from "./password";
import { createSession, revokeSession, verifySession } from "./session";

/**
 * Implementación de referencia de `AuthProvider` (docs/development/DECISIONS.md,
 * 2026-09-11): hash propio + sesión propia sobre Prisma. Swapear a un proveedor externo
 * más adelante significa escribir otra implementación de esta misma interfaz, sin tocar
 * los route handlers que la consumen.
 */
export function createPrismaAuthProvider(): AuthProvider {
  return { hashPassword, verifyPassword, createSession, verifySession, revokeSession };
}
