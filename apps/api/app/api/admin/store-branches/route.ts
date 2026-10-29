import { prisma } from "@depaso/database";
import { storeBranchInputSchema, storeBranchUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { branchInclude, resolveRegionId, toStoreBranchResponse } from "@/lib/catalog/catalogAdmin";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/admin/store-branches — el administrador crea una sucursal (solo ADMIN). */
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

  const { city, ...fields } = parsed.data;
  const branch = await prisma.storeBranch.create({
    data: { ...fields, marketRegionId: await resolveRegionId(city) },
    include: branchInclude,
  });
  return NextResponse.json(toStoreBranchResponse(branch), { status: 201 });
}

async function handleUpdate(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = storeBranchUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const { city, ...fields } = parsed.data;
  const { count } = await prisma.storeBranch.updateMany({
    where: { id },
    data: { ...fields, ...(city ? { marketRegionId: await resolveRegionId(city) } : {}) },
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const branch = await prisma.storeBranch.findUniqueOrThrow({ where: { id }, include: branchInclude });
  return NextResponse.json(toStoreBranchResponse(branch));
}

// PUT: los datos (incluido el id) llegan en el body JSON.
export const PUT = postWithParams(["id"], handleUpdate);

async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const { count } = await prisma.storeBranch.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE: los datos (incluido el id) llegan en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);
