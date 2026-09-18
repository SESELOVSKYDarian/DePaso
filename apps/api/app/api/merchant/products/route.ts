import { Prisma, prisma } from "@depaso/database";
import { merchantProductInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { merchantPriceInclude, normalizeName, toMerchantPriceResponse } from "@/lib/merchant";

/**
 * Alta de un producto que todavía no está en el catálogo, junto con su primer precio en la
 * sucursal del comercio. Si ya existe un producto con ese nombre normalizado y la misma
 * presentación (unidad + tamaño), se reutiliza en vez de duplicarlo.
 */
export async function POST(request: NextRequest) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = merchantProductInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { name, category, brandName, unit, unitSize, price } = parsed.data;
  const normalizedName = normalizeName(name);

  const saved = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const brand = brandName
      ? await tx.brand.upsert({ where: { name: brandName }, update: {}, create: { name: brandName } })
      : null;

    let product = await tx.product.findFirst({ where: { normalizedName, brandId: brand?.id ?? null } });
    if (!product) {
      product = await tx.product.create({
        data: { name, normalizedName, category, brandId: brand?.id ?? null },
      });
    }

    let variant = await tx.productVariant.findFirst({ where: { productId: product.id, unit, unitSize } });
    if (!variant) {
      variant = await tx.productVariant.create({
        data: { productId: product.id, name: `${name} ${unitSize}${unit}`, unit, unitSize },
      });
    }

    const existing = await tx.price.findFirst({
      where: { productVariantId: variant.id, storeBranchId: merchant.branchId },
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
        data: { productVariantId: variant.id, storeBranchId: merchant.branchId, ...data },
        include: merchantPriceInclude,
      });
    }
    await tx.priceHistory.create({
      data: {
        priceId: existing.id,
        productVariantId: variant.id,
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
