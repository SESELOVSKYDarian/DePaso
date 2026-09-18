import { Prisma, prisma } from "@depaso/database";
import { merchantPriceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { merchantPriceInclude, toMerchantPriceResponse } from "@/lib/merchant";

/** Precios vigentes de la sucursal del comercio (los dados de baja quedan como STALE y no se listan). */
export async function GET(request: NextRequest) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const prices = await prisma.price.findMany({
    where: { storeBranchId: merchant.branchId, status: { not: "STALE" } },
    include: merchantPriceInclude,
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ prices: prices.map(toMerchantPriceResponse) });
}

/** Publica (o actualiza) el precio de una variante del catálogo en la sucursal propia. */
export async function POST(request: NextRequest) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = merchantPriceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { productVariantId, price } = parsed.data;

  const variant = await prisma.productVariant.findUnique({ where: { id: productVariantId } });
  if (!variant) return NextResponse.json({ error: "PRODUCT_VARIANT_NOT_FOUND" }, { status: 400 });

  const saved = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.price.findFirst({
      where: { productVariantId, storeBranchId: merchant.branchId },
      orderBy: { updatedAt: "desc" },
    });
    const data = {
      price,
      sourceType: "MERCHANT" as const,
      confidence: "HIGH" as const,
      status: "VERIFIED" as const,
      reportedAt: new Date(),
    };
    if (!existing) {
      return tx.price.create({
        data: { productVariantId, storeBranchId: merchant.branchId, ...data },
        include: merchantPriceInclude,
      });
    }
    await tx.priceHistory.create({
      data: {
        priceId: existing.id,
        productVariantId,
        storeBranchId: merchant.branchId,
        amount: existing.price,
        status: existing.status,
        changeReason: "Actualizado por el comercio",
      },
    });
    return tx.price.update({ where: { id: existing.id }, data, include: merchantPriceInclude });
  });

  return NextResponse.json(toMerchantPriceResponse(saved), { status: 201 });
}
