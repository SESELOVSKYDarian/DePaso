import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toStoreResponse } from "@/lib/catalogAdmin";
import { postAsQuery } from "@/lib/http/postAdapter";

/** CRUD de comercios (Fase 11) — sólo ADMIN, ver `lib/auth/requireAdmin.ts`. */
async function handle(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const stores = await prisma.store.findMany({
    include: { _count: { select: { branches: true } } },
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json({ stores: stores.map(toStoreResponse) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
