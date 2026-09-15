import { prisma } from "@depaso/database";
import { priceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toPriceResponse } from "@/lib/catalogAdmin";

const include = { productVariant: true, storeBranch: true } as const;

/**
 * Carga manual de precios (Fase 12 — la ingestión automática real sigue NO DEFINIDA, ver
 * `docs/development/IMPLEMENTATION-PLAN.md`). `?productVariantId=`/`?storeBranchId=` filtran.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const productVariantId = request.nextUrl.searchParams.get("productVariantId") ?? undefined;
  const storeBranchId = request.nextUrl.searchParams.get("storeBranchId") ?? undefined;

  const prices = await prisma.price.findMany({
    where: { productVariantId, storeBranchId },
    include,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ prices: prices.map(toPriceResponse) });
}

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
