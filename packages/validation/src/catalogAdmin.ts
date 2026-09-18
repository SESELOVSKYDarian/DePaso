/**
 * CRUD de catálogo para `apps/admin` (Fase 11 comercios/sucursales, Fase 12 precios — carga
 * manual). La ingestión automática real (scraping/API de terceros) sigue NO DEFINIDA
 * (docs/development/IMPLEMENTATION-PLAN.md, Fase 12) — esto cubre la carga manual que un
 * operador humano puede hacer hoy, no un pipeline de ingestión.
 */
import { z } from "zod";

export const storeInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
});
export type StoreInput = z.infer<typeof storeInputSchema>;

export const storeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  branchCount: z.number(),
});
export type StoreResponse = z.infer<typeof storeResponseSchema>;

export const storeBranchInputSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /// Alcance de lanzamiento sólo Mar del Plata (sección 42) — mismo default que el schema.
  city: z.string().trim().min(1).max(80).default("Mar del Plata"),
});
/** `z.input` — `city` tiene default. */
export type StoreBranchInput = z.input<typeof storeBranchInputSchema>;
export const storeBranchUpdateSchema = storeBranchInputSchema.partial();
export type StoreBranchUpdate = z.infer<typeof storeBranchUpdateSchema>;

export const storeBranchResponseSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  storeName: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
});
export type StoreBranchResponse = z.infer<typeof storeBranchResponseSchema>;

const priceSourceTypeSchema = z.enum([
  "OFFICIAL",
  "STORE",
  "COMMUNITY",
  "ESTIMATED",
  "OFFICIAL_SEPA",
  "RETAILER_ONLINE",
  "RECEIPT",
  "MANUAL_ADMIN",
  "MERCHANT",
]);
const confidenceLevelSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
const priceStatusSchema = z.enum([
  "VERIFIED",
  "COMMUNITY_CONFIRMED",
  "DISPUTED",
  "IN_REVIEW",
  "STALE",
  "LOW_CONFIDENCE",
]);

export const priceInputSchema = z.object({
  productVariantId: z.string().min(1),
  storeBranchId: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().trim().min(1).max(8).default("ARS"),
  sourceType: priceSourceTypeSchema,
  sourceReference: z.string().trim().max(200).nullable().optional(),
  confidence: confidenceLevelSchema,
  /** Un operador puede forzar un estado (ej. `IN_REVIEW`); por defecto `VERIFIED` como
   * carga manual de fuente propia (sección "Informado", BUSINESS-RULES.md p.6). */
  status: priceStatusSchema.default("VERIFIED"),
});
/** `z.input` (no `z.infer`) — `currency`/`status` tienen default, no hace falta pasarlos. */
export type PriceInput = z.input<typeof priceInputSchema>;

export const priceUpdateSchema = priceInputSchema
  .omit({ productVariantId: true, storeBranchId: true })
  .partial()
  .extend({
    /** Motivo del cambio — obligatorio al actualizar porque cada cambio queda en
     * `PriceHistory` (regla obligatoria: "nunca sobreescribir sin histórico", BUSINESS-RULES.md p.7). */
    changeReason: z.string().trim().min(1).max(200),
  });
export type PriceUpdate = z.infer<typeof priceUpdateSchema>;

export const priceResponseSchema = z.object({
  id: z.string(),
  productVariantId: z.string(),
  productVariantName: z.string(),
  storeBranchId: z.string(),
  storeBranchName: z.string(),
  price: z.number(),
  currency: z.string(),
  sourceType: priceSourceTypeSchema,
  sourceReference: z.string().nullable(),
  confidence: confidenceLevelSchema,
  status: priceStatusSchema,
  reportedAt: z.string(),
  updatedAt: z.string(),
});
export type PriceResponse = z.infer<typeof priceResponseSchema>;
