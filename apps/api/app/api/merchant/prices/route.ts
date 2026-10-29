import { Prisma, prisma } from "@depaso/database";
import { merchantPriceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { merchantPriceInclude, toMerchantPriceResponse } from "@/lib/merchant/merchant";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = merchantPriceInputSchema.pick({ price: true, displayName: true });

/** Publica (o actualiza) el precio de una variante del catálogo en la sucursal propia. */
export async function POST(request: NextRequest) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = merchantPriceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { productVariantId, price } = parsed.data;
  const displayName = parsed.data.displayName?.trim() || null;

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
      ...(parsed.data.displayName !== undefined ? { displayName } : {}),
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
        amount: existing.price,
        status: existing.status,
        changeReason: "Actualizado por el comercio",
      },
    });
    return tx.price.update({ where: { id: existing.id }, data, include: merchantPriceInclude });
  });

  return NextResponse.json(toMerchantPriceResponse(saved), { status: 201 });
}

/** Cambia el monto (y, si viene, el nombre propio) de un precio de la sucursal; el valor anterior queda en `PriceHistory`. */
async function handleUpdate(request: NextRequest, { params }: RouteParams) {
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
        ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName.trim() || null } : {}),
      },
      include: merchantPriceInclude,
    });
  });

  return NextResponse.json(toMerchantPriceResponse(updated));
}

// PUT: los datos (incluido el id) llegan en el body JSON.
export const PUT = postWithParams(["id"], handleUpdate);

/** Da de baja un precio propio: no se borra (regla de histórico), pasa a STALE y deja de ofrecerse. */
async function handleDelete(request: NextRequest, { params }: RouteParams) {
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
        amount: existing.price,
        status: existing.status,
        changeReason: "Dado de baja por el comercio",
      },
    });
    await tx.price.update({ where: { id }, data: { status: "STALE" } });
  });

  return NextResponse.json({ ok: true });
}

// DELETE: los datos (incluido el id) llegan en el body JSON.
export const DELETE = postWithParams(["id"], handleDelete);
