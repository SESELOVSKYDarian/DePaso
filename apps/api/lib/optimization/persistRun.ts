import { prisma } from "@depaso/database";
import type { OptimizationPlanResult } from "@depaso/optimization";
import type { TransportMode } from "@depaso/types";

/**
 * Deja registro de la corrida para la vista de admin "Optimization runs" (Fase 20) — antes
 * este endpoint calculaba y respondía sin dejar rastro, aunque el schema (`OptimizationRun`
 * y afines) ya estaba modelado desde Fase 1. Best-effort a propósito: si la escritura falla,
 * no debe romper la respuesta del Top 3 al usuario (lo importante para el usuario ya se
 * calculó bien).
 */
export async function persistOptimizationRun(
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
          missingProducts: { create: [...new Set(plan.missingProductIds)].map((productId) => ({ productId })) },
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
