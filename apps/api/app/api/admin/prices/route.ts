import { prisma, Prisma } from "@depaso/database";
import { priceInputSchema, priceUpdateSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toPriceResponse } from "@/lib/catalog/catalogAdmin";
import { postWithParams } from "@/lib/http/postAdapter";

const include = { productVariant: true, storeBranch: true } as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/admin/prices — el administrador carga un precio nuevo (solo ADMIN). */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const json = await request.json().catch(() => null);
  const parsed = priceInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const [variant, branch] = await Promise.all([
    prisma.productVariant.findUnique({ where: { id: parsed.data.productVariantId } }),
    prisma.storeBranch.findUnique({ where: { id: parsed.data.storeBranchId } }),
  ]);
  if (!variant) return NextResponse.json({ error: "PRODUCT_VARIANT_NOT_FOUND" }, { status: 400 });
  if (!branch) return NextResponse.json({ error: "STORE_BRANCH_NOT_FOUND" }, { status: 400 });

  const price = await prisma.price.create({
    data: { ...parsed.data, sourceReference: parsed.data.sourceReference ?? null },
    include,
  });

  return NextResponse.json(toPriceResponse(price), { status: 201 });
}

/**
 * Actualizar un precio existente. Regla obligatoria (BUSINESS-RULES.md p.7): "nunca
 * sobreescribir sin histórico" — cada cambio deja una fila en `PriceHistory` con el motivo,
 * dentro de la misma transacción que el update.
 */
async function handleUpdate(request: NextRequest, { params }: RouteParams) {
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

  const price = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.price.update({
      where: { id },
      data: rest,
      include,
    });
    await tx.priceHistory.create({
      data: {
        priceId: id,
        amount: existing.price,
        status: existing.status,
        changeReason,
      },
    });
    return updated;
  });

  return NextResponse.json(toPriceResponse(price));
}

// PUT: los datos (incluido el id) llegan en el body JSON.
export const PUT = postWithParams(["id"], handleUpdate);
