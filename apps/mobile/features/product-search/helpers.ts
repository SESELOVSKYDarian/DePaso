import { PRODUCT_TYPE_GROUPS, PRODUCT_TYPE_LABELS } from "@depaso/domain";
import type { ProductFacets, ProductSearchResult } from "@depaso/validation";
import { productsClient } from "@/lib/apiClient";
import { IconName, SearchKey } from "./types";

export const EMPTY_FACETS: ProductFacets = { types: [], brands: [] };

export const GROUP_ICONS: Record<string, IconName> = {
  bebidas: "water-outline",
  alcohol: "wine-outline",
  infusiones: "cafe-outline",
  lacteos: "egg-outline",
  almacen: "basket-outline",
  dulces: "ice-cream-outline",
  carnes: "restaurant-outline",
  limpieza: "sparkles-outline",
  personal: "body-outline",
  bebes: "happy-outline",
  hogar: "home-outline",
};

export const resultsCache = new Map<string, Promise<ProductSearchResult[]>>();

export const facetsCache = new Map<string, Promise<ProductFacets>>();

export const keyOf = ({ q, type, brandId }: SearchKey) => [q, type ?? "", brandId ?? ""].join("|");

export function cachedSearch(key: SearchKey): Promise<ProductSearchResult[]> {
  const id = keyOf(key);
  let hit = resultsCache.get(id);
  if (!hit) {
    hit = productsClient.search(key.q, { type: key.type, brandId: key.brandId }).then((r) => r.results);
    hit.catch(() => resultsCache.delete(id));
    resultsCache.set(id, hit);
  }
  return hit;
}

export function cachedFacets(key: SearchKey): Promise<ProductFacets> {
  const id = keyOf({ q: key.q, type: key.type });
  let hit = facetsCache.get(id);
  if (!hit) {
    hit = productsClient.facets(key.q, { type: key.type });
    hit.catch(() => facetsCache.delete(id));
    facetsCache.set(id, hit);
  }
  return hit;
}

export const groupOfType = (typeId: string) => PRODUCT_TYPE_GROUPS.find((group) => group.typeIds.includes(typeId)) ?? null;

/** "Gallo · 1 kg": marca y tamaño; la categoría sólo si es una de verdad (SEPA no categoriza). */
export function describeProduct(product: ProductSearchResult): string {
  const variant = product.variants[0];
  const parts: string[] = [];
  if (product.brandName) parts.push(product.brandName);
  if (variant && variant.unitSize > 0) parts.push(`${variant.unitSize}${variant.unit}`);
  if (parts.length === 0 && !/^sin categorizar/i.test(product.category)) parts.push(product.category);
  return parts.join(" · ");
}
