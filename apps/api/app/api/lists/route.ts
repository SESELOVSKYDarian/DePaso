import { prisma } from "@depaso/database";
import { shoppingListInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listAccessWhere, listInclude, toListResponse, toListSummary } from "@/lib/lists/lists";

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
