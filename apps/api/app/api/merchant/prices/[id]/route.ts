import { Prisma, prisma } from "@depaso/database";
import { merchantPriceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { merchantPriceInclude, toMerchantPriceResponse } from "@/lib/merchant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = merchantPriceInputSchema.pick({ price: true });

/** Cambia el monto de un precio propio; el valor anterior queda en `PriceHistory`. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.price.findUnique({ where: { id } });
  if (!existing || existing.storeBranchId !== merchant.branchId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.priceHistory.create({
      data: {
        priceId: id,
        productVariantId: existing.productVariantId,
        storeBranchId: existing.storeBranchId,
        amount: existing.price,
        status: existing.status,
        changeReason: "Actualizado por el comercio",
      },
    });
    return tx.price.update({
      where: { id },
      data: {
        price: parsed.data.price,
        sourceType: "MERCHANT",
        confidence: "HIGH",
        status: "VERIFIED",
        reportedAt: new Date(),
      },
      include: merchantPriceInclude,
    });
  });

  return NextResponse.json(toMerchantPriceResponse(updated));
}

/** Da de baja un precio propio: no se borra (regla de histórico), pasa a STALE y deja de ofrecerse. */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.price.findUnique({ where: { id } });
  if (!existing || existing.storeBranchId !== merchant.branchId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.priceHistory.create({
      data: {
        priceId: id,
        productVariantId: existing.productVariantId,
        storeBranchId: existing.storeBranchId,
        amount: existing.price,
        status: existing.status,
        changeReason: "Dado de baja por el comercio",
      },
    });
    await tx.price.update({ where: { id }, data: { status: "STALE" } });
  });

  return NextResponse.json({ ok: true });
}
