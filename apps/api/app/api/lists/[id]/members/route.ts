import { prisma } from "@depaso/database";
import { shoppingListShareInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { listInclude, toListResponse } from "@/lib/lists";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Compartir la lista con otra persona por email (sólo el dueño). La persona tiene que tener
 * cuenta en DePaso: no se envían invitaciones a direcciones sin cuenta.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(`list-share:${current.userId}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const { id } = await params;
  const list = await prisma.shoppingList.findFirst({ where: { id, userId: current.userId } });
  if (!list) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const parsed = shoppingListShareInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!invitee || invitee.deletedAt) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  if (invitee.id === current.userId) return NextResponse.json({ error: "CANNOT_SHARE_WITH_SELF" }, { status: 400 });

  await prisma.shoppingListMember.upsert({
    where: { shoppingListId_userId: { shoppingListId: id, userId: invitee.id } },
    create: { shoppingListId: id, userId: invitee.id },
    update: {},
  });

  const updated = await prisma.shoppingList.findUniqueOrThrow({ where: { id }, include: listInclude });
  return NextResponse.json(await toListResponse(updated, current.userId), { status: 201 });
}
