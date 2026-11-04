import { prisma } from "@depaso/database";
import { adPricesSchema, adKindSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { loadAdPrices } from "@/lib/ads/prices";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/** `POST /api/admin/ads/prices` — el administrador fija el precio base por día de cada formato. */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = adPricesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });

  for (const kind of adKindSchema.options) {
    const pricePerDay = parsed.data[kind];
    await prisma.adPrice.upsert({ where: { kind }, update: { pricePerDay }, create: { kind, pricePerDay } });
  }
  return NextResponse.json(await loadAdPrices());
}
