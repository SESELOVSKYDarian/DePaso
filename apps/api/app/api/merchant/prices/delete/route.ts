import { Prisma, prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { postWithParams } from "@/lib/http/postAdapter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Da de baja un precio propio: no se borra (regla de histórico), pasa a STALE y deja de ofrecerse. */
async function handle(request: NextRequest, { params }: RouteParams) {
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

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postWithParams(["id"], handle);
