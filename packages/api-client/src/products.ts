import { z } from "zod";
import { productSearchResultSchema } from "@depaso/validation";
import type { DepasoApiClient } from "./client";

const searchSchema = z.object({ results: z.array(productSearchResultSchema) });

/** Búsqueda de catálogo — ver apps/api/app/api/products/search. */
export function createProductsClient(client: DepasoApiClient) {
  return {
    search: (q: string) => client.get(`/api/products/search?q=${encodeURIComponent(q)}`, searchSchema),
  };
}
