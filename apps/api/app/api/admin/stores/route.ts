import { prisma } from "@depaso/database";
import { storeInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toStoreResponse } from "@/lib/catalog/catalogAdmin";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/admin/stores — el administrador crea un comercio (solo ADMIN). */
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

async function handleUpdate(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = storeInputSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const { count } = await prisma.store.updateMany({ where: { id }, data: parsed.data });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const store = await prisma.store.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { branches: true } } },
  });
  return NextResponse.json(toStoreResponse(store));
}

// PUT: los datos (incluido el id) llegan en el body JSON.
export const PUT = postWithParams(["id"], handleUpdate);

/** No permite borrar un comercio con sucursales — evita huérfanos de precios/reportes. */
async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const branchCount = await prisma.storeBranch.count({ where: { storeId: id } });
  if (branchCount > 0) {
    return NextResponse.json({ error: "STORE_HAS_BRANCHES" }, { status: 409 });
  }

  const { count } = await prisma.store.deleteMany({ where: { id } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE: los datos (incluido el id) llegan en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);
