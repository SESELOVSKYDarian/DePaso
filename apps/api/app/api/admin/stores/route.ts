import { prisma } from "@depaso/database";
import { storeInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toStoreResponse } from "@/lib/catalogAdmin";

/** CRUD de comercios (Fase 11) — sólo ADMIN, ver `lib/auth/requireAdmin.ts`. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const stores = await prisma.store.findMany({
    include: { _count: { select: { branches: true } } },
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json({ stores: stores.map(toStoreResponse) });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = storeInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const store = await prisma.store.create({
    data: parsed.data,
    include: { _count: { select: { branches: true } } },
  });
  return NextResponse.json(toStoreResponse(store), { status: 201 });
}
