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

/** Cambia el monto (y, si viene, el nombre propio) de un precio de la sucursal; el valor anterior queda en `PriceHistory`. */
async function handle(request: NextRequest, { params }: RouteParams) {
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

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["id"], handle);
