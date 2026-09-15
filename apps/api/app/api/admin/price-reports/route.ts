import { prisma } from "@depaso/database";
import type { AdminPriceReportResponse } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/** Reportes comunitarios para revisión de moderación (Fase 20, FLOWS.md "Flujo de moderación y apelación" p.8). */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const reports = await prisma.priceReport.findMany({
    include: {
      user: { select: { email: true } },
      storeBranch: { include: { store: { select: { name: true } } } },
      moderationEvents: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const productVariants = await prisma.productVariant.findMany({
    where: { id: { in: [...new Set(reports.map((r) => r.productVariantId))] } },
    include: { product: { select: { name: true } } },
  });
  const productNameByVariant = new Map(productVariants.map((v) => [v.id, v.product.name]));

  const body: { reports: AdminPriceReportResponse[] } = {
    reports: reports.map((r) => ({
      id: r.id,
      userEmail: r.user.email,
      productName: productNameByVariant.get(r.productVariantId) ?? "(producto desconocido)",
      storeName: r.storeBranch.store.name,
      branchName: r.storeBranch.name,
      reportedPrice: Number(r.reportedPrice),
      requiresPromotion: r.requiresPromotion,
      promotionNote: r.promotionNote,
      hasEvidence: r.photoEvidenceUrl != null,
      createdAt: r.createdAt.toISOString(),
      moderationEvents: r.moderationEvents.map((e) => ({
        id: e.id,
        type: e.type,
        reason: e.reason,
        createdAt: e.createdAt.toISOString(),
        createdByAdminId: e.createdByAdminId,
      })),
    })),
  };
  return NextResponse.json(body);
}
