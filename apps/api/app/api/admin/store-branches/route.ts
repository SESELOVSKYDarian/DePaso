import { prisma } from "@depaso/database";
import { storeBranchInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toStoreBranchResponse } from "@/lib/catalogAdmin";

/** CRUD de sucursales (Fase 11). `?storeId=` filtra por comercio. */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const storeId = request.nextUrl.searchParams.get("storeId");
  const branches = await prisma.storeBranch.findMany({
    where: storeId ? { storeId } : undefined,
    include: { store: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json({ branches: branches.map(toStoreBranchResponse) });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = storeBranchInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { id: parsed.data.storeId } });
  if (!store) return NextResponse.json({ error: "STORE_NOT_FOUND" }, { status: 400 });

  const branch = await prisma.storeBranch.create({ data: parsed.data, include: { store: true } });
  return NextResponse.json(toStoreBranchResponse(branch), { status: 201 });
}
