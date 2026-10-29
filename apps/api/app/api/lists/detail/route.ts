import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listAccessWhere, listInclude, toListResponse } from "@/lib/lists/lists";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function handle(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const list = await prisma.shoppingList.findFirst({
    where: { id, ...listAccessWhere(current.userId) },
    include: listInclude,
  });
  if (!list) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json(await toListResponse(list, current.userId));
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["id"], handle);
