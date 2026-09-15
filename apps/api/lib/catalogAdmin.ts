import type { Price, ProductVariant, Store, StoreBranch } from "@depaso/database";
import type { PriceResponse, StoreBranchResponse, StoreResponse } from "@depaso/validation";

export function toStoreResponse(store: Store & { _count: { branches: number } }): StoreResponse {
  return { id: store.id, name: store.name, branchCount: store._count.branches };
}

export function toStoreBranchResponse(branch: StoreBranch & { store: Store }): StoreBranchResponse {
  return {
    id: branch.id,
    storeId: branch.storeId,
    storeName: branch.store.name,
    name: branch.name,
    address: branch.address,
    latitude: branch.latitude,
    longitude: branch.longitude,
    city: branch.city,
  };
}

export function toPriceResponse(
  price: Price & { productVariant: ProductVariant; storeBranch: StoreBranch }
): PriceResponse {
  return {
    id: price.id,
    productVariantId: price.productVariantId,
    productVariantName: price.productVariant.name,
    storeBranchId: price.storeBranchId,
    storeBranchName: price.storeBranch.name,
    price: Number(price.price),
    currency: price.currency,
    sourceType: price.sourceType,
    sourceReference: price.sourceReference,
    confidence: price.confidence,
    status: price.status,
    reportedAt: price.reportedAt.toISOString(),
    updatedAt: price.updatedAt.toISOString(),
  };
}
