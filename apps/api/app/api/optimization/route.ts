import { prisma } from "@depaso/database";
import { distanceToPathMeters, optimizeWithRanking, type StoreCandidateInput } from "@depaso/optimization";
import { optimizationRunRequestSchema } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { runInBackground } from "@/lib/http/background";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { persistOptimizationRun } from "@/lib/optimization/persistRun";
import { applyPaymentPromos, loadPromoContext, promoDiscountForStops } from "@/lib/promos/applyPromos";
import { buildPlanRoute, type BranchInfo } from "@/lib/routes/planRoute";
import { getRouteProvider } from "@/lib/routes/routing";

// Varias rutas de Mapbox por plan: con el límite por defecto la función se cortaba.
export const maxDuration = 60;

/**
 * Top 3 con datos reales. El frontend sólo aporta la lista elegida y el recorrido efímero;
 * precios, sucursales y preferencias se resuelven del lado servidor, sin aceptar un precio
 * o una preferencia manipulada desde el dispositivo.
 */
export async function POST(request: NextRequest) {
  const startedAt = performance.now();
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

  const queriesMs = Math.round(performance.now() - startedAt);
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
    // Las promos de los medios de pago entran al ranking: gana lo más barato DESPUÉS de descuentos.
    const promoContext = await loadPromoContext(current.userId);
    const { plans, ranking } = await optimizeWithRanking(
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
        promoDiscount: (stops) => promoDiscountForStops(promoContext, stops),
        ...(parsed.data.tierLimitsMeters ? { tierLimitsMeters: parsed.data.tierLimitsMeters } : {}),
      },
      getRouteProvider(parsed.data.transportMode)
    );
    // El registro para el admin se guarda después de responder: son ~20 escrituras que no tiene por qué esperar el usuario.
    runInBackground(() => persistOptimizationRun(current.userId, parsed.data.shoppingListId, parsed.data.transportMode, plans));
    // `debugScore` es deliberadamente interno; nunca cruza el límite HTTP.
    const branchInfo = new Map<string, BranchInfo>();
    for (const price of prices) {
      const branch = price.storeBranch;
      branchInfo.set(branch.id, { latitude: branch.latitude, longitude: branch.longitude, address: branch.address });
    }
    const publicPlans = plans.map((planResult: (typeof plans)[number]) => {
      const { debugScore: _debugScore, ...plan } = planResult;
      // Recorrido con las paradas de compra metidas, y qué tan lejos queda cada una del camino.
      const planned = buildPlanRoute(parsed.data.routeContext.waypoints, plan.stops, branchInfo);
      // Nombres de lo que no se consigue a este nivel: la app explica por qué el total es menor.
      const missingProductNames = plan.missingProductIds.map((id) => names.get(id) ?? "Producto");
      return { ...plan, stops: planned.stops, routeWaypoints: planned.routeWaypoints, missingProductNames };
    });
    // Para cada producto de la lista: las sucursales donde está más barato (precio por unidad,
    // sin promos) y qué tan lejos quedan del recorrido. Es la pestaña "Mejores precios".
    const routePath = parsed.data.routeContext.waypoints;
    const bestPrices = list.items.map((item: (typeof list.items)[number]) => {
      const offers = [...candidateMap.values()]
        .flatMap((store) =>
          store.offers
            .filter((offer) => offer.productId === item.productId)
            .map((offer) => ({
              storeBranchId: store.storeBranchId,
              storeName: store.storeName,
              branchName: store.branchName,
              address: branchInfo.get(store.storeBranchId)?.address ?? "",
              price: offer.price,
              distanceFromRouteMeters: Math.round(distanceToPathMeters(store.location, routePath)),
            })),
        )
        .sort((a, b) => a.price - b.price || a.distanceFromRouteMeters - b.distanceFromRouteMeters)
        .slice(0, 3);
      return { productId: item.productId, productName: names.get(item.productId) ?? "Producto", quantity: item.quantity, offers };
    });

    // Tiempos por etapa en los registros de Vercel, para saber dónde se va el tiempo si vuelve a tardar.
    console.info("optimization timing", { queriesMs, engineAndRoutesMs: Math.round(performance.now() - startedAt) - queriesMs, products: list.items.length, branches: candidateMap.size });
    const rankingWithAddress = ranking.map((entry) => ({
      storeBranchId: entry.storeBranchId,
      storeName: entry.storeName,
      branchName: entry.branchName,
      address: branchInfo.get(entry.storeBranchId)?.address ?? "",
      latitude: entry.location.latitude,
      longitude: entry.location.longitude,
      totalCost: entry.totalCost,
      promoSavings: entry.promoSavings,
      coveredCount: entry.coveredCount,
      missingCount: entry.missingCount,
      distanceFromRouteMeters: entry.distanceFromRouteMeters,
    }));
    // Para que la app explique si hay promos o por qué no: sin medios de pago cargados no se descuenta nada.
    const paymentMethodCount = await prisma.userPaymentMethod.count({ where: { userId: current.userId } });
    return NextResponse.json({
      hasPaymentMethods: paymentMethodCount > 0,
      plans: await applyPaymentPromos(publicPlans, current.userId, new Date(), promoContext),
      ranking: rankingWithAddress,
      bestPrices,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "OPTIMIZATION_FAILED" },
      { status: 422 }
    );
  }
}
