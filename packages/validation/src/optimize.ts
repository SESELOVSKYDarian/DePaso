/**
 * Schema Zod del input del motor de optimización — usado por `apps/api` para validar
 * `POST /api/optimize` antes de llamar a `@depaso/optimization` (sección 78: request
 * validation vía Zod, nunca confiar en el body del frontend sin validar — sección 81).
 */
import { z } from "zod";
import { appliedPromoSchema } from "./payments";

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
  /** Cuánto se acepta alejarse del recorrido en los niveles "sin desvíos" e "intermedio" (metros). */
  tierLimitsMeters: z
    .object({
      strict: z.number().int().min(100).max(500).optional(),
      intermediate: z.number().int().min(500).max(4000).optional(),
    })
    .optional(),
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
  /** Dónde queda la sucursal y cuánto se desvía del camino para pasar (lo calcula el servidor). */
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  /** Qué tan lejos queda del recorrido, en línea recta (≈ cuadras de distancia). */
  distanceFromRouteMeters: z.number().nonnegative().optional(),
  detourMeters: z.number().nonnegative().optional(),
  detourSeconds: z.number().nonnegative().optional(),
  /** Posición de esta parada dentro de `routeWaypoints`. */
  routeIndex: z.number().int().nonnegative().optional(),
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
  /** Promos de bancos/billeteras del usuario aplicadas al total (ya descontadas). */
  promoSavings: z.number().nonnegative().default(0),
  appliedPromos: z.array(appliedPromoSchema).default([]),
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
  /** Recorrido ya con las paradas de compra metidas en el mejor lugar: origen, paradas y destino. */
  routeWaypoints: z.array(latLngSchema).optional(),
  explanation: z.string(),
});
export type OptimizationPlanResponse = z.infer<typeof optimizationPlanResponseSchema>;

/** Un comercio del ranking "los más baratos para tu lista": costo de la lista completa ahí, con promos. */
export const storeRankingEntrySchema = z.object({
  storeBranchId: z.string(),
  storeName: z.string(),
  branchName: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  totalCost: z.number().nonnegative(),
  promoSavings: z.number().nonnegative(),
  coveredCount: z.number().int().nonnegative(),
  missingCount: z.number().int().nonnegative(),
  distanceFromRouteMeters: z.number().nonnegative(),
});
export type StoreRankingEntryResponse = z.infer<typeof storeRankingEntrySchema>;

/** El motor devuelve hasta 3 planes, uno por nivel de desvío (FASTEST "sin desvíos", BALANCED
 * "intermedio", CHEAPEST "hipereconómico"). Un nivel sin comercios que alcancen no aparece, y
 * `[]` es una respuesta válida ("ningún comercio con estos productos"). */
export const optimizationRunResponseSchema = z.object({
  plans: z.array(optimizationPlanResponseSchema).max(3),
  ranking: z.array(storeRankingEntrySchema).default([]),
});
export type OptimizationRunResponse = z.infer<typeof optimizationRunResponseSchema>;
