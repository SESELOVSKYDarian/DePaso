import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

interface RouteParams {
  params: Promise<{ id: string; memberUserId: string }>;
}

/** Dejar de compartir: el dueño quita a cualquiera; un miembro puede quitarse a sí mismo (salir de la lista). */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id, memberUserId } = await params;
  const list = await prisma.shoppingList.findUnique({ where: { id } });
  if (!list) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const isOwner = list.userId === current.userId;
  const isSelf = memberUserId === current.userId;
  if (!isOwner && !isSelf) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const { count } = await prisma.shoppingListMember.deleteMany({ where: { shoppingListId: id, userId: memberUserId } });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
