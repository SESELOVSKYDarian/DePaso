/**
 * Búsqueda de catálogo (Fase 8, sección 37 del master prompt — "tolerante a variaciones":
 * coincide por nombre de producto/variante o por `ProductAlias`). Sólo lectura: el catálogo
 * en sí (marcas/productos/variantes) se carga por seed/ingestión, no por esta API.
 */
import { z } from "zod";

export const productSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
});
export type ProductSearchQuery = z.infer<typeof productSearchQuerySchema>;

export const productVariantSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  unitSize: z.number(),
});
export type ProductVariantSummary = z.infer<typeof productVariantSummarySchema>;

export const productSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  brandName: z.string().nullable(),
  variants: z.array(productVariantSummarySchema),
});
export type ProductSearchResult = z.infer<typeof productSearchResultSchema>;
