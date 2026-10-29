import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toPriceResponse } from "@/lib/catalog/catalogAdmin";
import { postAsQuery } from "@/lib/http/postAdapter";

const include = { productVariant: true, storeBranch: true } as const;

/**
 * Carga manual de precios (Fase 12 — la ingestión automática real sigue NO DEFINIDA, ver
 * `docs/development/IMPLEMENTATION-PLAN.md`). `?productVariantId=`/`?storeBranchId=` filtran.
 */
async function handle(request: NextRequest) {
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

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
