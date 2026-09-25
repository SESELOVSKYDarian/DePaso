import { prisma } from "@depaso/database";
import { optimizeShoppingList, type OptimizationPlanResult, type StoreCandidateInput } from "@depaso/optimization";
import type { TransportMode } from "@depaso/types";
import { optimizationRunRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { applyPaymentPromos } from "@/lib/applyPromos";
import { getRouteProvider } from "@/lib/routing";

/**
 * Deja registro de la corrida para la vista de admin "Optimization runs" (Fase 20) — antes
 * este endpoint calculaba y respondía sin dejar rastro, aunque el schema (`OptimizationRun`
 * y afines) ya estaba modelado desde Fase 1. Best-effort a propósito: si la escritura falla,
 * no debe romper la respuesta del Top 3 al usuario (lo importante para el usuario ya se
 * calculó bien).
 */
async function persistOptimizationRun(
  userId: string,
  shoppingListId: string,
  transportMode: TransportMode,
  plans: OptimizationPlanResult[]
): Promise<void> {
  try {
    const run = await prisma.optimizationRun.create({
      data: { userId, shoppingListId, mode: "BALANCED", transportMode },
    });

    for (const [index, plan] of plans.entries()) {
      const created = await prisma.optimizationPlan.create({
        data: {
          optimizationRunId: run.id,
          rank: index + 1,
          label: plan.label,
          totalProductCost: plan.totalProductCost,
          estimatedTravelCost: plan.estimatedTravelCost,
          estimatedEffectiveCost: plan.estimatedEffectiveCost,
          additionalDistanceMeters: plan.additionalDistanceMeters,
          additionalTimeSeconds: plan.additionalTimeSeconds,
          numberOfStops: plan.numberOfStops,
          missingProductIds: plan.missingProductIds,
          priceConfidence: plan.priceConfidence,
          estimatedSavings: plan.estimatedSavings,
          explanation: plan.explanation,
        },
      });

      for (const stop of plan.stops) {
        const createdStop = await prisma.optimizationPlanStop.create({
          data: { optimizationPlanId: created.id, order: stop.order, storeBranchId: stop.storeBranchId },
        });
        const itemsWithVariant = stop.items.filter((item: (typeof stop.items)[number]) => item.productVariantId);
        if (itemsWithVariant.length > 0) {
          await prisma.optimizationPlanItem.createMany({
            data: itemsWithVariant.map((item: (typeof itemsWithVariant)[number]) => ({
              optimizationPlanStopId: createdStop.id,
              productId: item.productId,
              productVariantId: item.productVariantId!,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          });
        }
      }
    }
  } catch (error) {
    console.error("No se pudo persistir OptimizationRun (no afecta la respuesta al usuario):", error);
  }
}

/**
 * Top 3 con datos reales. El frontend sólo aporta la lista elegida y el recorrido efímero;
 * precios, sucursales y preferencias se resuelven del lado servidor, sin aceptar un precio
 * o una preferencia manipulada desde el dispositivo.
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = optimizationRunRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  }

  const list = await prisma.shoppingList.findFirst({
    where: {
      id: parsed.data.shoppingListId,
      archivedAt: null,
      OR: [{ userId: current.userId }, { members: { some: { userId: current.userId } } }],
    },
    include: { items: true },
  });
  if (!list) return NextResponse.json({ error: "LIST_NOT_FOUND" }, { status: 404 });
  if (list.items.length === 0) return NextResponse.json({ error: "EMPTY_LIST" }, { status: 422 });

  const productIds = [...new Set(list.items.map((item: (typeof list.items)[number]) => item.productId))];
  const [products, productPreferences, storePreferences, prices] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
    prisma.productPreference.findMany({ where: { userId: current.userId, productId: { in: productIds } } }),
    prisma.storePreference.findMany({ where: { userId: current.userId } }),
    prisma.price.findMany({
      where: {
        status: { in: ["VERIFIED", "COMMUNITY_CONFIRMED"] },
        productVariant: { productId: { in: productIds } },
        storeBranch: { status: "ACTIVE" },
      },
      include: {
        productVariant: { include: { product: { select: { id: true, brandId: true } } } },
        storeBranch: { include: { store: { select: { name: true } } } },
      },
      orderBy: [{ reportedAt: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  const names = new Map(products.map((product: (typeof products)[number]) => [product.id, product.name]));
  if (names.size !== productIds.length) {
    return NextResponse.json({ error: "LIST_CONTAINS_UNKNOWN_PRODUCT" }, { status: 422 });
  }

  // Una oferta vigente por producto/sucursal: el query llega ordenado por observación más
  // reciente, de modo que no se mezcla un precio viejo con uno nuevo de la misma tienda.
  const candidateMap = new Map<string, StoreCandidateInput>();
  const offeredProductKeys = new Set<string>();
  for (const price of prices) {
    const productId = price.productVariant.product.id;
    const offerKey = `${price.storeBranchId}:${productId}`;
    if (offeredProductKeys.has(offerKey)) continue;
    offeredProductKeys.add(offerKey);

    const branch = price.storeBranch;
    const existing = candidateMap.get(branch.id) ?? {
      storeBranchId: branch.id,
      storeName: branch.store.name,
      branchName: branch.name,
      location: { latitude: branch.latitude, longitude: branch.longitude },
      offers: [],
    };
    existing.offers.push({
      productId,
      productVariantId: price.productVariant.id,
      brandId: price.productVariant.product.brandId,
      price: Number(price.price),
      confidence: price.confidence,
      sourceType: price.sourceType,
      reportedAt: price.reportedAt.toISOString(),
    });
    candidateMap.set(branch.id, existing);
  }

  if (candidateMap.size === 0) {
    return NextResponse.json({ error: "NO_CURRENT_PRICES" }, { status: 422 });
  }

  try {
    const plans = await optimizeShoppingList(
      {
        shoppingList: {
          items: list.items.map((item: (typeof list.items)[number]) => ({
            productId: item.productId,
            productName: names.get(item.productId)!,
            quantity: item.quantity,
          })),
        },
        routeContext: parsed.data.routeContext,
        preferences: {
          productPreferences: productPreferences.map((pref: (typeof productPreferences)[number]) => ({
            productId: pref.productId,
            type: pref.type,
            ...(pref.preferredBrandId ? { preferredBrandId: pref.preferredBrandId } : {}),
          })),
          storePreferences: storePreferences.map((pref: (typeof storePreferences)[number]) => ({
            category: pref.category,
            type: pref.type,
            storeBranchId: pref.storeBranchId,
          })),
        },
        storeCandidates: [...candidateMap.values()],
        transportMode: parsed.data.transportMode,
        mode: "BALANCED",
      },
      getRouteProvider(parsed.data.transportMode)
    );
    await persistOptimizationRun(current.userId, parsed.data.shoppingListId, parsed.data.transportMode, plans);
    // `debugScore` es deliberadamente interno; nunca cruza el límite HTTP.
    const publicPlans = plans.map((planResult: (typeof plans)[number]) => {
      const { debugScore: _debugScore, ...plan } = planResult;
      return plan;
    });
    return NextResponse.json({ plans: await applyPaymentPromos(publicPlans, current.userId) });
  } catch (error) {
    return NextResponse.json(
      { error: "OPTIMIZATION_FAILED", message: error instanceof Error ? error.message : "unknown" },
      { status: 422 }
    );
  }
}
