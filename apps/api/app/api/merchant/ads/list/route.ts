import { prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { loadProductNames, toAdResponse } from "@/lib/ads/ads";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { postAsQuery } from "@/lib/http/postAdapter";

export const dynamic = "force-dynamic";

/** Los pedidos de publicidad del comercio, los más nuevos primero. */
async function handle(request: NextRequest) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const rows = await prisma.adRequest.findMany({ where: { userId: merchant.userId }, orderBy: { createdAt: "desc" }, take: 50 });
  const productNames = await loadProductNames(rows);
  return NextResponse.json({ ads: rows.map((row: (typeof rows)[number]) => toAdResponse(row, { productNames })), pendingCount: 0 });
}

// Todos los endpoints son POST: los parametros llegan en el body.
export const POST = postAsQuery(handle);
