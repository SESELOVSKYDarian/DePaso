import { prisma } from "@depaso/database";
import { adReplySchema, adRequestInputSchema, MAX_ACTIVE_ADS, minAdAmount } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { loadProductNames, toAdResponse } from "@/lib/ads/ads";
import { loadAdPrices } from "@/lib/ads/prices";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { postWithParams } from "@/lib/http/postAdapter";
import { notifyAdmins } from "@/lib/push/notifyAdmins";

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

  // el monto no puede ser menor al precio base por día que fijó el administrador
  const prices = await loadAdPrices();
  const minimum = minAdAmount(rest.kind, rest.durationDays, prices);
  if (rest.offeredAmount < minimum) return NextResponse.json({ error: "AMOUNT_TOO_LOW", minimum }, { status: 422 });

  // tope de publicidades a la vez: las que esperan respuesta más las que siguen vigentes
  const inUse = await prisma.adRequest.count({
    where: { userId: merchant.userId, OR: [{ status: { in: ["PENDING", "COUNTER"] } }, { status: "APPROVED", endsAt: { gte: new Date() } }] },
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
      imageData: rest.kind === "IMAGE" || rest.kind === "BANNER" ? (imageData ?? null) : null,
      videoUrl: rest.kind === "VIDEO" ? (videoUrl ?? null) : null,
      userId: merchant.userId,
      storeBranchId: merchant.branchId,
    },
  });
  notifyAdmins({
    title: "Nuevo pedido de publicidad",
    body: `"${created.title}": ofrecen $${Math.round(Number(created.offeredAmount)).toLocaleString("es-AR")} por ${created.durationDays} días.`,
    data: { type: "ad-admin" },
  });
  return NextResponse.json(toAdResponse(created, { productNames: await loadProductNames([created]) }), { status: 201 });
}

/**
 * `PUT /api/merchant/ads` — el comercio responde a la contraoferta del equipo: la acepta (queda
 * aprobada con ese monto), la rechaza o propone otro monto (vuelve a esperar al administrador).
 */
async function handleReply(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;

  const parsed = adReplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  const { reply, amount } = parsed.data;

  const existing = await prisma.adRequest.findFirst({ where: { id, userId: merchant.userId } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (existing.status !== "COUNTER") return NextResponse.json({ error: "NOT_WAITING_REPLY" }, { status: 409 });

  const now = new Date();
  let data;
  if (reply === "ACCEPT") {
    data = {
      status: "APPROVED" as const,
      agreedAmount: existing.counterAmount ?? existing.offeredAmount,
      reviewedAt: now,
      startsAt: now,
      endsAt: new Date(now.getTime() + existing.durationDays * 24 * 60 * 60 * 1000),
    };
  } else if (reply === "DECLINE") {
    data = { status: "CANCELLED" as const, counterAmount: null };
  } else {
    const minimum = minAdAmount(existing.kind, existing.durationDays, await loadAdPrices());
    if ((amount ?? 0) < minimum) return NextResponse.json({ error: "AMOUNT_TOO_LOW", minimum }, { status: 422 });
    data = { status: "PENDING" as const, offeredAmount: amount ?? 0, counterAmount: null };
  }

  const updated = await prisma.adRequest.update({ where: { id }, data });
  const name = merchant.displayName ?? "Un comercio";
  notifyAdmins({
    title: reply === "ACCEPT" ? "Aceptaron tu propuesta" : reply === "DECLINE" ? "Rechazaron tu propuesta" : "Nueva propuesta de monto",
    body:
      reply === "PROPOSE"
        ? `${name} propone $${Math.round(amount ?? 0).toLocaleString("es-AR")} por "${updated.title}".`
        : `${name}: "${updated.title}".`,
    data: { type: "ad-admin" },
  });
  return NextResponse.json(toAdResponse(updated, { productNames: await loadProductNames([updated]) }));
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

// PUT y DELETE: el id llega en el body JSON.
export const PUT = postWithParams(["id"], handleReply);
export const DELETE = postWithParams(["id"], handleCancel);
