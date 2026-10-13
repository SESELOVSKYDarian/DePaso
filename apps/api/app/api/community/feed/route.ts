import { prisma } from "@depaso/database";
import { communityFeedQuerySchema, type CommunityFeedItem } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { prettifyBrandName, prettifyProductName } from "@/lib/productNames";

const COMMUNITY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 30;
const HIDING_EVENTS = ["REPORT_HIDDEN", "REPORT_REJECTED"] as const;

function sizeLabel(unit: string, size: number): string | null {
  if (!(size > 0)) return null;
  const rounded = Number.isInteger(size) ? String(size) : String(Math.round(size * 100) / 100);
  return `${rounded} ${unit}`;
}

/**
 * `GET /api/community/feed?scope=community|mine`
 *
 * - `community`: reportes de los últimos 14 días hechos de buena fe y sin ocultar por
 *   moderación, de cualquier persona (anónimos).
 * - `mine`: todos los reportes propios, con su estado.
 */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = communityFeedQuerySchema.safeParse({
    scope: request.nextUrl.searchParams.get("scope") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }
  const { scope } = parsed.data;

  const reports = await prisma.priceReport.findMany({
    where:
      scope === "mine"
        ? { userId: current.userId }
        : {
            createdAt: { gte: new Date(Date.now() - COMMUNITY_WINDOW_MS) },
            goodFaithDeclared: true,
            moderationEvents: { none: { type: { in: [...HIDING_EVENTS] } } },
          },
    orderBy: { createdAt: "desc" },
    take: MAX_ITEMS,
    include: {
      storeBranch: { select: { name: true, store: { select: { name: true } } } },
      moderationEvents: { where: { type: { in: [...HIDING_EVENTS] } }, select: { id: true }, take: 1 },
    },
  });
  if (reports.length === 0) return NextResponse.json({ items: [] });

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: [...new Set(reports.map((report) => report.productVariantId))] } },
    select: {
      id: true,
      unit: true,
      unitSize: true,
      product: { select: { name: true, brand: { select: { name: true } } } },
    },
  });
  const variantById = new Map(variants.map((variant) => [variant.id, variant]));

  const items: CommunityFeedItem[] = reports.flatMap((report) => {
    const variant = variantById.get(report.productVariantId);
    if (!variant) return [];
    return [
      {
        id: report.id,
        productName: prettifyProductName(variant.product.name),
        brandName: prettifyBrandName(variant.product.brand?.name),
        sizeLabel: sizeLabel(variant.unit, variant.unitSize),
        storeName: report.storeBranch.store.name,
        branchName: report.storeBranch.name,
        reportedPrice: Number(report.reportedPrice),
        requiresPromotion: report.requiresPromotion,
        promotionNote: report.promotionNote,
        createdAt: report.createdAt.toISOString(),
        isMine: report.userId === current.userId,
        status: report.moderationEvents.length > 0 ? "HIDDEN" : "VISIBLE",
      },
    ];
  });

  return NextResponse.json({ items });
}
