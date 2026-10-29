import { prisma } from "@depaso/database";
import { shoppingListUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listAccessWhere, listInclude, toListResponse } from "@/lib/lists/lists";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Renombrar o archivar: sólo el dueño. */
async function handle(request: NextRequest, { params }: RouteParams) {
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

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["id"], handle);
