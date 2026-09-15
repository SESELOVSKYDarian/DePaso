import { prisma } from "@depaso/database";
import { priceUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toPriceResponse } from "@/lib/catalogAdmin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const include = { productVariant: true, storeBranch: true } as const;

/**
 * Actualizar un precio existente. Regla obligatoria (BUSINESS-RULES.md p.7): "nunca
 * sobreescribir sin histórico" — cada cambio deja una fila en `PriceHistory` con el motivo,
 * dentro de la misma transacción que el update.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = priceUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { changeReason, ...rest } = parsed.data;

  const existing = await prisma.price.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const price = await prisma.$transaction(async (tx) => {
    const updated = await tx.price.update({
      where: { id },
      data: rest,
      include,
    });
    await tx.priceHistory.create({
      data: {
        priceId: id,
        productVariantId: existing.productVariantId,
        storeBranchId: existing.storeBranchId,
        amount: existing.price,
        status: existing.status,
        changeReason,
      },
    });
    return updated;
  });

  return NextResponse.json(toPriceResponse(price));
}
