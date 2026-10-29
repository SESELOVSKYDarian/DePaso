import { prisma } from "@depaso/database";
import { shoppingListItemUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listAccessWhere, listInclude, toListResponse } from "@/lib/lists/lists";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

async function handleUpdate(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, itemId } = await params;
  const list = await prisma.shoppingList.findFirst({ where: { id, ...listAccessWhere(current.userId) } });
  if (!list) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const json = await request.json().catch(() => null);
  const parsed = shoppingListItemUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const { count } = await prisma.shoppingListItem.updateMany({
    where: { id: itemId, shoppingListId: id },
    data: parsed.data,
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await prisma.shoppingList.update({ where: { id }, data: { updatedAt: new Date() } });

  const updated = await prisma.shoppingList.findUniqueOrThrow({ where: { id }, include: listInclude });
  return NextResponse.json(await toListResponse(updated, current.userId));
}

// PUT: los datos (incluido el id) llegan en el body JSON.
export const PUT = postWithParams(["id", "itemId"], handleUpdate);

async function handleDelete(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, itemId } = await params;
  const list = await prisma.shoppingList.findFirst({ where: { id, ...listAccessWhere(current.userId) } });
  if (!list) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const { count } = await prisma.shoppingListItem.deleteMany({ where: { id: itemId, shoppingListId: id } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await prisma.shoppingList.update({ where: { id }, data: { updatedAt: new Date() } });

  const updated = await prisma.shoppingList.findUniqueOrThrow({ where: { id }, include: listInclude });
  return NextResponse.json(await toListResponse(updated, current.userId));
}

// DELETE: los datos (incluido el id) llegan en el body JSON.
export const DELETE = postWithParams(["id", "itemId"], handleDelete);
