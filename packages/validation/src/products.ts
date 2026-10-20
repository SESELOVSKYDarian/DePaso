/**
 * Búsqueda de catálogo (Fase 8, sección 37 del master prompt — "tolerante a variaciones":
 * coincide por nombre de producto/variante o por `ProductAlias`). Sólo lectura: el catálogo
 * en sí (marcas/productos/variantes) se carga por seed/ingestión, no por esta API.
 */
import { z } from "zod";

/** Texto opcional, pero la búsqueda necesita al menos un criterio (texto, tipo o marca). */
export const productSearchQuerySchema = z
  .object({
    q: z.string().trim().max(80).default(""),
    /** Id de tipo de producto (`"gaseosa"`, `"vino"`…). */
    type: z.string().trim().min(1).max(40).optional(),
    brandId: z.string().uuid().optional(),
  })
  .refine((value) => value.q.length > 0 || value.type !== undefined || value.brandId !== undefined, {
    message: "Indicá un texto, un tipo o una marca.",
  });
export type ProductSearchQuery = z.infer<typeof productSearchQuerySchema>;

/** Igual que la búsqueda, pero sin criterios es válido: devuelve los tipos y marcas más grandes. */
export const productFacetsQuerySchema = z.object({
  q: z.string().trim().max(80).default(""),
  type: z.string().trim().min(1).max(40).optional(),
  brandId: z.string().uuid().optional(),
});

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
  /** Foto frontal (Open Food Facts) si se consiguió; `null` → la app muestra un ícono. */
  imageUrl: z.string().nullable().optional(),
  variants: z.array(productVariantSummarySchema),
});
export type ProductSearchResult = z.infer<typeof productSearchResultSchema>;

/** Opciones de filtro para una búsqueda, con cuántos productos tiene cada una. */
export const productFacetsSchema = z.object({
  types: z.array(z.object({ id: z.string(), label: z.string(), count: z.number() })),
  brands: z.array(z.object({ id: z.string(), name: z.string(), count: z.number() })),
});
export type ProductFacets = z.infer<typeof productFacetsSchema>;
