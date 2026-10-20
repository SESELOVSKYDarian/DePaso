import { z } from "zod";
import { productFacetsSchema, productSearchResultSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const searchSchema = z.object({ results: z.array(productSearchResultSchema) });

export interface ProductFilters {
  /** Id de tipo de producto (`"gaseosa"`, `"vino"`…). */
  type?: string | undefined;
  brandId?: string | undefined;
}

function toQuery(q: string, filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filters.type) params.set("type", filters.type);
  if (filters.brandId) params.set("brandId", filters.brandId);
  return params.toString();
}

/** Búsqueda de catálogo y filtros — ver apps/api/app/api/products/{search,facets}. */
export function createProductsClient(client: DepasoApiClient) {
  return {
    search: (q: string, filters: ProductFilters = {}) =>
      client.get(`/api/products/search?${toQuery(q, filters)}`, searchSchema),
    facets: (q: string, filters: ProductFilters = {}) =>
      client.get(`/api/products/facets?${toQuery(q, filters)}`, productFacetsSchema),
  };
}
