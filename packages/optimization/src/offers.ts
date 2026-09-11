import type { ConfidenceLevel } from "@depaso/types";
import type {
  PlanStop,
  ShoppingListInput,
  StoreCandidateInput,
  UserPreferencesInput,
} from "./types";

const CONFIDENCE_SCORE: Record<ConfidenceLevel, number> = {
  HIGH: 1,
  MEDIUM: 0.6,
  LOW: 0.2,
};

export interface ResolvedCombo {
  stops: PlanStop[];
  totalProductCost: number;
  missingProductIds: string[];
  /** Cantidad de items con preferencia PREFERRED que terminaron en una marca distinta. */
  brokenPreferredCount: number;
  priceConfidence: ConfidenceLevel;
  avgConfidenceScore: number;
}

/**
 * Asigna cada producto de la lista al comercio de la combinación con la oferta elegible
 * más barata. Preferencia EXACT filtra ofertas de otra marca ANTES de elegir precio — nunca
 * se reemplaza silenciosamente Coca-Cola por Pepsi (Caso C, sección 39/87 del master
 * prompt). Si ningún comercio de la combinación tiene oferta elegible, el producto va a
 * `missingProductIds` (no se fuerza a comprarlo en otro lado).
 */
export function resolveComboOffers(
  combo: StoreCandidateInput[],
  shoppingList: ShoppingListInput,
  preferences: UserPreferencesInput
): ResolvedCombo {
  const stopsByBranch = new Map<string, PlanStop>();
  for (const [index, store] of combo.entries()) {
    stopsByBranch.set(store.storeBranchId, {
      storeBranchId: store.storeBranchId,
      storeName: store.storeName,
      branchName: store.branchName,
      order: index,
      items: [],
    });
  }

  const missingProductIds: string[] = [];
  let totalProductCost = 0;
  let brokenPreferredCount = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  for (const item of shoppingList.items) {
    const pref = preferences.productPreferences.find((p) => p.productId === item.productId);

    type Candidate = { store: StoreCandidateInput; offer: StoreCandidateInput["offers"][number] };
    const eligible: Candidate[] = [];
    for (const store of combo) {
      for (const offer of store.offers) {
        if (offer.productId !== item.productId) continue;
        if (pref?.type === "EXACT" && offer.brandId !== pref.preferredBrandId) continue;
        eligible.push({ store, offer });
      }
    }

    if (eligible.length === 0) {
      missingProductIds.push(item.productId);
      continue;
    }

    const chosen = eligible.reduce((cheapest, current) =>
      current.offer.price < cheapest.offer.price ? current : cheapest
    );

    const stop = stopsByBranch.get(chosen.store.storeBranchId)!;
    stop.items.push({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: chosen.offer.price,
    });

    totalProductCost += chosen.offer.price * item.quantity;
    confidenceSum += CONFIDENCE_SCORE[chosen.offer.confidence];
    confidenceCount += 1;

    if (pref?.type === "PREFERRED" && pref.preferredBrandId && chosen.offer.brandId !== pref.preferredBrandId) {
      brokenPreferredCount += 1;
    }
  }

  const avgConfidenceScore = confidenceCount > 0 ? confidenceSum / confidenceCount : 1;
  const priceConfidence: ConfidenceLevel =
    avgConfidenceScore >= 0.8 ? "HIGH" : avgConfidenceScore >= 0.5 ? "MEDIUM" : "LOW";

  return {
    stops: Array.from(stopsByBranch.values()).filter((stop) => stop.items.length > 0),
    totalProductCost,
    missingProductIds,
    brokenPreferredCount,
    priceConfidence,
    avgConfidenceScore,
  };
}
