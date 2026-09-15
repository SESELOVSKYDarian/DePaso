/**
 * Schema Zod del input del motor de optimización — usado por `apps/api` para validar
 * `POST /api/optimize` antes de llamar a `@depaso/optimization` (sección 78: request
 * validation vía Zod, nunca confiar en el body del frontend sin validar — sección 81).
 */
import { z } from "zod";

export const latLngSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const shoppingListItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
});

const productPreferenceSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["EXACT", "PREFERRED", "ANY"]),
  preferredBrandId: z.string().min(1).optional(),
});

const storePreferenceSchema = z.object({
  category: z.string().min(1),
  type: z.enum(["REQUIRED", "PREFERRED"]),
  storeBranchId: z.string().min(1),
});

const storeOfferSchema = z.object({
  productId: z.string().min(1),
  productVariantId: z.string().min(1).optional(),
  brandId: z.string().min(1).nullable(),
  price: z.number().nonnegative(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  sourceType: z.string().optional(),
  reportedAt: z.string().optional(),
});

const storeCandidateSchema = z.object({
  storeBranchId: z.string().min(1),
  storeName: z.string().min(1),
  branchName: z.string().min(1),
  location: latLngSchema,
  offers: z.array(storeOfferSchema),
});

export const optimizeRequestSchema = z.object({
  shoppingList: z.object({ items: z.array(shoppingListItemSchema).min(1) }),
  routeContext: z.object({ waypoints: z.array(latLngSchema).min(2) }),
  preferences: z.object({
    productPreferences: z.array(productPreferenceSchema),
    storePreferences: z.array(storePreferenceSchema),
  }),
  storeCandidates: z.array(storeCandidateSchema).min(1),
  transportMode: z.enum(["CAR", "MOTORCYCLE", "BICYCLE", "WALK", "PUBLIC_TRANSPORT"]),
  mode: z.enum(["BALANCED", "CHEAPEST", "FASTEST"]),
  maxDeviationMeters: z.number().positive().optional(),
});

export type OptimizeRequest = z.infer<typeof optimizeRequestSchema>;

/** Request del flujo real de Top 3. A diferencia de `optimizeRequestSchema`, el cliente
 * nunca envía precios, preferencias ni candidatos: el servidor los resuelve desde la DB
 * para el usuario autenticado. */
export const optimizationRunRequestSchema = z.object({
  shoppingListId: z.string().uuid(),
  routeContext: z.object({ waypoints: z.array(latLngSchema).min(2) }),
  transportMode: z.enum(["CAR", "MOTORCYCLE", "BICYCLE", "WALK", "PUBLIC_TRANSPORT"]).default("CAR"),
});
export type OptimizationRunRequest = z.input<typeof optimizationRunRequestSchema>;

const planStopSchema = z.object({
  storeBranchId: z.string(),
  storeName: z.string(),
  branchName: z.string(),
  /** 0-indexado (`combo.entries()` en `@depaso/optimization/offers.ts`) — la primera
   * parada es `order: 0`, no 1. Bug real encontrado probando el flujo completo en el
   * navegador: `positive()` rechazaba el caso más común (un solo comercio, `order: 0`),
   * así que el cliente tiraba "No pudimos armar tu Top 3" incluso con una respuesta 200
   * válida del servidor. */
  order: z.number().int().nonnegative(),
  items: z.array(z.object({
    productId: z.string(),
    productVariantId: z.string().optional(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    /** Divulgación obligatoria por precio (BUSINESS-RULES.md p.9). */
    sourceType: z.string().optional(),
    reportedAt: z.string().optional(),
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  })),
});

export const optimizationPlanResponseSchema = z.object({
  label: z.enum(["BALANCED", "FASTEST", "CHEAPEST"]),
  totalProductCost: z.number().nonnegative(),
  estimatedTravelCost: z.number().nonnegative(),
  estimatedEffectiveCost: z.number().nonnegative(),
  additionalDistanceMeters: z.number().nonnegative(),
  additionalTimeSeconds: z.number().nonnegative(),
  numberOfStops: z.number().int().positive(),
  missingProductIds: z.array(z.string()),
  priceConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  estimatedSavings: z.number().nonnegative(),
  stores: z.array(z.string()),
  stops: z.array(planStopSchema),
  explanation: z.string(),
});
export type OptimizationPlanResponse = z.infer<typeof optimizationPlanResponseSchema>;

/** El motor (`@depaso/optimization/optimize.ts`) sólo devuelve 0 o 3 planes — nunca 1 ni 2
 * (los 3 perfiles comparten el mismo set de combinaciones, así que si hay al menos una
 * combinación viable, los 3 ganan juntos). `[]` es una respuesta real y válida ("no hay
 * ningún comercio con estos productos dentro del corredor de tu ruta") — bug real
 * encontrado probando el flujo completo: `.length(3)` la rechazaba con el mismo error
 * genérico que una falla real, sin poder distinguir un caso del otro en la UI. */
export const optimizationRunResponseSchema = z.object({
  plans: z.array(optimizationPlanResponseSchema).refine((arr) => arr.length === 0 || arr.length === 3, {
    message: "El motor de optimización siempre devuelve 0 o 3 planes",
  }),
});
export type OptimizationRunResponse = z.infer<typeof optimizationRunResponseSchema>;
