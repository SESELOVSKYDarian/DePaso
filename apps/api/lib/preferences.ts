import type { ProductPreference, StoreBranch, Store, StorePreference } from "@depaso/database";
import type { ProductPreferenceResponse, StorePreferenceResponse } from "@depaso/validation";

export function toProductPreferenceResponse(
  pref: ProductPreference & { product: { name: string } }
): ProductPreferenceResponse {
  return {
    id: pref.id,
    productId: pref.productId,
    productName: pref.product.name,
    type: pref.type,
    preferredBrandId: pref.preferredBrandId,
  };
}

export function toStorePreferenceResponse(
  pref: StorePreference & { storeBranch: StoreBranch & { store: Store } }
): StorePreferenceResponse {
  return {
    id: pref.id,
    category: pref.category,
    type: pref.type,
    storeBranchId: pref.storeBranchId,
    storeBranchName: pref.storeBranch.name,
    storeName: pref.storeBranch.store.name,
  };
}
