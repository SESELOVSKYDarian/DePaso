import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listAccessWhere, listInclude, toListResponse, toListSummary } from "@/lib/lists/lists";
import { postAsQuery } from "@/lib/http/postAdapter";

/** Listas de compra (Fase 9): las propias y las que otros usuarios compartieron. `userId` sale siempre de la sesión (sección 81). */
async function handle(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const lists = await prisma.shoppingList.findMany({
    where: listAccessWhere(current.userId),
    include: { user: true, _count: { select: { items: true, members: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ lists: lists.map((list: (typeof lists)[number]) => toListSummary(list, current.userId)) });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
