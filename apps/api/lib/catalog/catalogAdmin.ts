import { prisma } from "@depaso/database";
import type { MarketRegion, Price, ProductVariant, Store, StoreBranch } from "@depaso/database";
import type { PriceResponse, StoreBranchResponse, StoreResponse } from "@depaso/validation";

/** Comercio con la cantidad de sucursales que tiene. */
export function toStoreResponse(store: Store & { _count: { branches: number } }): StoreResponse {
  return { id: store.id, name: store.name, branchCount: store._count.branches };
}

/** Para leer una sucursal con su comercio y su región (de ahí sale la ciudad). */
export const branchInclude = { store: true, marketRegion: true } as const;

/** Región que corresponde a una ciudad (o la primera habilitada si no se indica). */
export async function resolveRegionId(city?: string): Promise<string | null> {
  const named = city ? await prisma.marketRegion.findFirst({ where: { name: city } }) : null;
  const region = named ?? (await prisma.marketRegion.findFirst({ where: { enabled: true }, orderBy: { name: "asc" } }));
  return region?.id ?? null;
}

/** Sucursal con su comercio; la ciudad sale de su región. */
export function toStoreBranchResponse(
  branch: StoreBranch & { store: Store; marketRegion: MarketRegion | null }
): StoreBranchResponse {
  return {
    id: branch.id,
    storeId: branch.storeId,
    storeName: branch.store.name,
    name: branch.name,
    address: branch.address,
    latitude: branch.latitude,
    longitude: branch.longitude,
    city: branch.marketRegion?.name ?? "",
  };
}

/** Precio con el nombre del producto y de la sucursal. */
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
