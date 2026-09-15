import { prisma } from "@depaso/database";
import { shoppingListItemInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toListResponse } from "@/lib/lists";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Agregar un producto a una lista (Fase 9, viene de resultados de `/api/products/search`). */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const list = await prisma.shoppingList.findFirst({ where: { id, userId: current.userId } });
  if (!list) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const json = await request.json().catch(() => null);
  const parsed = shoppingListItemInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 400 });

  await prisma.shoppingListItem.create({
    data: { shoppingListId: id, productId: parsed.data.productId, quantity: parsed.data.quantity, note: parsed.data.note },
  });

  const updated = await prisma.shoppingList.findUniqueOrThrow({ where: { id }, include: { items: true } });
  return NextResponse.json(await toListResponse(updated), { status: 201 });
}
