import { prisma } from "@depaso/database";
import type { AccountExportResponse } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

/**
 * Derecho de acceso — "Descargar/solicitar datos" (LEGAL.md p.14). Auto-servicio e
 * inmediato: a esta escala no hace falta cola de soporte para cumplir el plazo de 10 días
 * corridos, y un export instantáneo es estrictamente mejor para el titular que uno
 * encolado. Junta las categorías bajo `userId` del inventario de LEGAL.md p.5.
 */
export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const userId = current.userId;
  const [user, profile, consents, places, savedRouteContexts, shoppingLists, productPreferences, storePreferences, priceReports, trustScore] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.userConsent.findMany({ where: { userId } }),
      prisma.userPlace.findMany({ where: { userId } }),
      prisma.savedRouteContext.findMany({ where: { userId } }),
      prisma.shoppingList.findMany({ where: { userId }, include: { items: true } }),
      prisma.productPreference.findMany({ where: { userId } }),
      prisma.storePreference.findMany({ where: { userId } }),
      prisma.priceReport.findMany({ where: { userId } }),
      prisma.userTrustScore.findUnique({ where: { userId } }),
    ]);

  if (!user || user.deletedAt) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body: AccountExportResponse = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      marketingOptIn: profile?.marketingOptIn ?? false,
      ageConfirmed18Plus: profile?.ageConfirmed18Plus ?? false,
      createdAt: user.createdAt.toISOString(),
    },
    consents: consents.map((c: (typeof consents)[number]) => ({
      type: c.type,
      documentVersion: c.documentVersion,
      accepted: c.accepted,
      acceptedAt: c.acceptedAt.toISOString(),
    })),
    places: places.map((p: (typeof places)[number]) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      address: p.address,
      isFavorite: p.isFavorite,
      createdAt: p.createdAt.toISOString(),
    })),
    savedRouteContexts: savedRouteContexts.map((r: (typeof savedRouteContexts)[number]) => ({
      id: r.id,
      name: r.name,
      waypointPlaceIds: r.waypointPlaceIds,
      createdAt: r.createdAt.toISOString(),
    })),
    shoppingLists: shoppingLists.map((l: (typeof shoppingLists)[number]) => ({
      id: l.id,
      name: l.name,
      createdAt: l.createdAt.toISOString(),
      items: l.items.map((i: (typeof l.items)[number]) => ({ productId: i.productId, quantity: i.quantity, note: i.note })),
    })),
    productPreferences: productPreferences.map((p: (typeof productPreferences)[number]) => ({
      productId: p.productId,
      type: p.type,
      preferredBrandId: p.preferredBrandId,
    })),
    storePreferences: storePreferences.map((p: (typeof storePreferences)[number]) => ({
      category: p.category,
      type: p.type,
      storeBranchId: p.storeBranchId,
    })),
    priceReports: priceReports.map((r: (typeof priceReports)[number]) => ({
      id: r.id,
      productVariantId: r.productVariantId,
      storeBranchId: r.storeBranchId,
      reportedPrice: Number(r.reportedPrice),
      requiresPromotion: r.requiresPromotion,
      createdAt: r.createdAt.toISOString(),
    })),
    trustScore: trustScore
      ? {
          score: trustScore.score,
          reportsSubmitted: trustScore.reportsSubmitted,
          reportsConfirmed: trustScore.reportsConfirmed,
        }
      : null,
  };

  return NextResponse.json(body);
}
