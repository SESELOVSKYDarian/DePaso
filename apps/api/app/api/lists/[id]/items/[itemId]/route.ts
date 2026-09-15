import { prisma } from "@depaso/database";
import { shoppingListItemUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toListResponse } from "@/lib/lists";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, itemId } = await params;
  const list = await prisma.shoppingList.findFirst({ where: { id, userId: current.userId } });
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

  const updated = await prisma.shoppingList.findUniqueOrThrow({ where: { id }, include: { items: true } });
  return NextResponse.json(await toListResponse(updated));
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, itemId } = await params;
  const list = await prisma.shoppingList.findFirst({ where: { id, userId: current.userId } });
  if (!list) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const { count } = await prisma.shoppingListItem.deleteMany({ where: { id: itemId, shoppingListId: id } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const updated = await prisma.shoppingList.findUniqueOrThrow({ where: { id }, include: { items: true } });
  return NextResponse.json(await toListResponse(updated));
}
