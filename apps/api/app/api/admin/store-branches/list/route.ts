import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { branchInclude, toStoreBranchResponse } from "@/lib/catalogAdmin";
import { postAsQuery } from "@/lib/http/postAdapter";

/** CRUD de sucursales (Fase 11). `?storeId=` filtra por comercio. */
async function handle(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const storeId = request.nextUrl.searchParams.get("storeId");
  const branches = await prisma.storeBranch.findMany({
    where: storeId ? { storeId } : undefined,
    include: branchInclude,
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json({ branches: branches.map(toStoreBranchResponse) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
