import { prisma } from "@depaso/database";
import { shoppingListInputSchema, shoppingListUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listInclude, toListResponse } from "@/lib/lists/lists";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/lists — crea una lista de compras vacía para el usuario. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = shoppingListInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const list = await prisma.shoppingList.create({
    data: { ...parsed.data, userId: current.userId },
    include: listInclude,
  });

  return NextResponse.json(await toListResponse(list, current.userId), { status: 201 });
}

/** Renombrar o archivar: sólo el dueño. */
async function handleUpdate(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = shoppingListUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { archived, ...rest } = parsed.data;

  // updateMany con userId en el where (no findFirst+update) — mismo criterio que
  // `UserPlace`: dueño y escritura confirmados en una sola operación atómica.
  const { count } = await prisma.shoppingList.updateMany({
    where: { id, userId: current.userId },
    data: {
      ...rest,
      ...(archived === undefined ? {} : { archivedAt: archived ? new Date() : null }),
    },
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const list = await prisma.shoppingList.findUniqueOrThrow({ where: { id }, include: listInclude });
  return NextResponse.json(await toListResponse(list, current.userId));
}

// PUT: los datos (incluido el id) llegan en el body JSON.
export const PUT = postWithParams(["id"], handleUpdate);

/** Borrar: sólo el dueño. Un miembro se sale con `DELETE /api/lists/members`. */
async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.shoppingList.deleteMany({ where: { id, userId: current.userId } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE: los datos (incluido el id) llegan en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);
