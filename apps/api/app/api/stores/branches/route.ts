import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toStoreBranchResponse } from "@/lib/catalogAdmin";

/**
 * Lectura pública de sucursales (cualquier usuario autenticado, no sólo ADMIN) — a
 * diferencia de `/api/admin/store-branches`, esto es catálogo de lectura para que el
 * usuario elija un comercio preferido (Fase 10) o, más adelante, lo vea en el mapa (Fase 17).
 * No expone nada que un CRUD de escritura necesite proteger.
 */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const branches = await prisma.storeBranch.findMany({
    include: { store: true },
    orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
    take: 500,
  });
  return NextResponse.json({ branches: branches.map(toStoreBranchResponse) });
}
