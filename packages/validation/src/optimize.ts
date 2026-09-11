/**
 * Schema Zod del input del motor de optimización — usado por `apps/api` para validar
 * `POST /api/optimize` antes de llamar a `@depaso/optimization` (sección 78: request
 * validation vía Zod, nunca confiar en el body del frontend sin validar — sección 81).
 */
import { z } from "zod";

const latLngSchema = z.object({
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
  brandId: z.string().min(1).nullable(),
  price: z.number().nonnegative(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
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
