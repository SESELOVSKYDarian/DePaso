import { prisma } from "@depaso/database";
import type { AdminUserResponse } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/**
 * Vista de usuarios (Fase 20) — sólo lectura. No hay cambio de rol self-service acá a
 * propósito: escalar a ADMIN sin la MFA que pide LEGAL.md (p.97, NO DEFINIDO todavía) sería
 * agrandar una brecha ya documentada, no cerrarla. Para eso sigue existiendo el script
 * `packages/database/scripts/promote-admin.mjs`, fuera del alcance HTTP.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const users = await prisma.user.findMany({
    include: { trustScore: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const body: { users: AdminUserResponse[] } = {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      deletedAt: u.deletedAt?.toISOString() ?? null,
      trustScore: u.trustScore
        ? {
            score: u.trustScore.score,
            reportsSubmitted: u.trustScore.reportsSubmitted,
            reportsConfirmed: u.trustScore.reportsConfirmed,
          }
        : null,
    })),
  };
  return NextResponse.json(body);
}
