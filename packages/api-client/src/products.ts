import { z } from "zod";
import { productFacetsSchema, productSearchResultSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const searchSchema = z.object({ results: z.array(productSearchResultSchema) });

export interface ProductFilters {
  /** Id de tipo de producto (`"gaseosa"`, `"vino"`…). */
  type?: string | undefined;
  brandId?: string | undefined;
}

function toBody(q: string, filters: ProductFilters): Record<string, string> {
  const body: Record<string, string> = {};
  if (q) body.q = q;
  if (filters.type) body.type = filters.type;
  if (filters.brandId) body.brandId = filters.brandId;
  return body;
}

/** Búsqueda de catálogo y filtros — ver apps/api/app/api/products/{search,facets}. */
export function createProductsClient(client: DepasoApiClient) {
  return {
    search: (q: string, filters: ProductFilters = {}) =>
      client.post("/api/products/search", toBody(q, filters), searchSchema),
    facets: (q: string, filters: ProductFilters = {}) =>
      client.post("/api/products/facets", toBody(q, filters), productFacetsSchema),
  };
}
