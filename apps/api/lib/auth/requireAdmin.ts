import type { NextRequest } from "next/server";
import { prisma } from "@depaso/database";
import { getCurrentUser } from "./currentUser";

export interface CurrentAdmin {
  userId: string;
}

/**
 * Gate de `apps/admin` (Fase 11/12). Reusa la misma sesión de `apps/api` (sección 81: nunca
 * un `userId` sin pasar por la sesión) y sólo agrega el chequeo de `role === "ADMIN"`.
 *
 * Brecha conocida, documentada en vez de simulada (docs/development/DECISIONS.md): la MFA
 * para administradores que pide docs/legal-functional/LEGAL.md (p.97) no está implementada
 * — no hay proveedor de MFA elegido todavía (NO DEFINIDO). No usar este admin con datos de
 * producción reales hasta resolverlo.
 */
export async function requireAdmin(request: NextRequest): Promise<CurrentAdmin | null> {
  const current = await getCurrentUser(request);
  if (!current) return null;

  const user = await prisma.user.findUnique({ where: { id: current.userId } });
  if (!user || user.deletedAt || user.role !== "ADMIN") return null;

  return { userId: current.userId };
}
