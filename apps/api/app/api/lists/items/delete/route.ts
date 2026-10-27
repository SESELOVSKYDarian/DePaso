import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listAccessWhere, listInclude, toListResponse } from "@/lib/lists";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

async function handle(request: NextRequest, { params }: RouteParams) {
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

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["id", "itemId"], handle);
