import { Prisma, prisma } from "@depaso/database";
import { merchantDecisionInputSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { toAdminMerchantRequestResponse } from "@/lib/merchant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Aprueba o rechaza una solicitud. Aprobar cambia el rol del usuario a MERCHANT y crea su
 * `Store` + `StoreBranch` propios (con la dirección y coordenadas de la solicitud) en una
 * sola transacción.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const parsed = merchantDecisionInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.merchantRequest.findUnique({ where: { id }, include: { user: true } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (existing.status !== "PENDING") return NextResponse.json({ error: "ALREADY_RESOLVED" }, { status: 409 });

  const { decision, reason } = parsed.data;

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const resolved = await tx.merchantRequest.update({
      where: { id },
      data:
        decision === "APPROVE"
          ? { status: "APPROVED", reviewedById: admin.userId, reviewedAt: new Date() }
          : { status: "REJECTED", reviewedById: admin.userId, reviewedAt: new Date(), rejectionReason: reason ?? null },
      include: { user: true },
    });

    if (decision === "APPROVE") {
      await tx.user.update({ where: { id: existing.userId }, data: { role: "MERCHANT" } });
      const store = await tx.store.create({ data: { name: existing.businessName } });
      await tx.storeBranch.create({
        data: {
          storeId: store.id,
          name: existing.businessName,
          address: existing.address,
          latitude: existing.latitude,
          longitude: existing.longitude,
          ownerUserId: existing.userId,
        },
      });
    }
    return resolved;
  });

  return NextResponse.json(toAdminMerchantRequestResponse(updated));
}
