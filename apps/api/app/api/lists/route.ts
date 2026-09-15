import { prisma } from "@depaso/database";
import { shoppingListInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toListResponse, toListSummary } from "@/lib/lists";

/** Listas de compra (Fase 9). `userId` sale siempre de la sesión (sección 81). */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const lists = await prisma.shoppingList.findMany({
    where: { userId: current.userId },
    include: { _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ lists: lists.map(toListSummary) });
}

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
    include: { items: true },
  });

  return NextResponse.json(await toListResponse(list), { status: 201 });
}
