import { prisma } from "@depaso/database";
import { adRequestInputSchema, MAX_ACTIVE_ADS } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { loadProductNames, toAdResponse } from "@/lib/ads/ads";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { postWithParams } from "@/lib/http/postAdapter";

/** `POST /api/merchant/ads` — el comercio pide publicidad: qué, cuánto ofrece y por cuántos días. */
export async function POST(request: NextRequest) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!checkRateLimit(`ad-request:${merchant.userId}`, 10, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const parsed = adRequestInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  const { productId, message, imageData, videoUrl, ...rest } = parsed.data;

  // tope de publicidades a la vez: las que esperan respuesta más las que siguen vigentes
  const inUse = await prisma.adRequest.count({
    where: { userId: merchant.userId, OR: [{ status: "PENDING" }, { status: "APPROVED", endsAt: { gte: new Date() } }] },
  });
  if (inUse >= MAX_ACTIVE_ADS) return NextResponse.json({ error: "AD_LIMIT_REACHED", max: MAX_ACTIVE_ADS }, { status: 422 });

  // un producto destacado tiene que ser uno que el comercio vende (con precio en su sucursal)
  if (rest.kind === "FEATURED_PRODUCT") {
    const sells = await prisma.price.findFirst({
      where: { storeBranchId: merchant.branchId, productVariant: { productId } },
      select: { id: true },
    });
    if (!sells) return NextResponse.json({ error: "PRODUCT_NOT_SOLD" }, { status: 422 });
  }

  const created = await prisma.adRequest.create({
    data: {
      ...rest,
      message: message || null,
      productId: rest.kind === "FEATURED_PRODUCT" ? (productId ?? null) : null,
      imageData: rest.kind === "IMAGE" ? (imageData ?? null) : null,
      videoUrl: rest.kind === "VIDEO" ? (videoUrl ?? null) : null,
      userId: merchant.userId,
      storeBranchId: merchant.branchId,
    },
  });
  return NextResponse.json(toAdResponse(created, { productNames: await loadProductNames([created]) }), { status: 201 });
}

/** `DELETE /api/merchant/ads` — el comercio cancela un pedido que todavía no se resolvió. */
async function handleCancel(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;

  const { count } = await prisma.adRequest.updateMany({
    where: { id, userId: merchant.userId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  if (count === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// DELETE: el id llega en el body JSON.
export const DELETE = postWithParams(["id"], handleCancel);
