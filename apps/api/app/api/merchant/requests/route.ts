import { prisma } from "@depaso/database";
import { merchantRequestInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { toMerchantRequestResponse } from "@/lib/merchant";

/** Última solicitud del usuario actual (o `null` si nunca pidió ser comercio). */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const latest = await prisma.merchantRequest.findFirst({
    where: { userId: current.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ request: latest ? toMerchantRequestResponse(latest) : null });
}

/** Un usuario común pide pasar a rol comercio; queda PENDING hasta que un admin resuelva. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!checkRateLimit(`merchant-request:${current.userId}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const parsed = merchantRequestInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: current.userId } });
  if (!user || user.deletedAt) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "USER") return NextResponse.json({ error: "ROLE_NOT_ELIGIBLE" }, { status: 409 });

  const pending = await prisma.merchantRequest.findFirst({ where: { userId: user.id, status: "PENDING" } });
  if (pending) return NextResponse.json({ error: "ALREADY_PENDING" }, { status: 409 });

  const created = await prisma.merchantRequest.create({
    data: { ...parsed.data, phone: parsed.data.phone ?? null, note: parsed.data.note ?? null, userId: user.id },
  });
  return NextResponse.json({ request: toMerchantRequestResponse(created) }, { status: 201 });
}
