import { prisma } from "@depaso/database";
import { productPreferenceInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { toProductPreferenceResponse } from "@/lib/preferences";

/** Preferencias de producto (Fase 10, sección 87 — consumidas por `@depaso/optimization`). */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const prefs = await prisma.productPreference.findMany({
    where: { userId: current.userId },
    include: { product: { select: { name: true } } },
  });

  return NextResponse.json({ preferences: prefs.map(toProductPreferenceResponse) });
}

/** Una preferencia por producto (`@@unique([userId, productId])`) — crea o reemplaza. */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = productPreferenceInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 400 });

  const pref = await prisma.productPreference.upsert({
    where: { userId_productId: { userId: current.userId, productId: parsed.data.productId } },
    create: { ...parsed.data, preferredBrandId: parsed.data.preferredBrandId ?? null, userId: current.userId },
    update: { type: parsed.data.type, preferredBrandId: parsed.data.preferredBrandId ?? null },
    include: { product: { select: { name: true } } },
  });

  return NextResponse.json(toProductPreferenceResponse(pref), { status: 201 });
}
