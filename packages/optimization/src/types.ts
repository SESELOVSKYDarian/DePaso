/**
 * Tipos de input/output del motor de optimización. Motor TypeScript puro — no importa
 * React, React Native ni Next.js (master prompt sección 57). Fuente conceptual: secciones
 * 58-60 del master prompt.
 */

import type { LatLng } from "@depaso/domain";
import type {
  ConfidenceLevel,
  OptimizationMode,
  ProductPreferenceType,
  StorePreferenceType,
  TransportMode,
} from "@depaso/types";

export interface ShoppingListItemInput {
  productId: string;
  productName: string;
  quantity: number;
}

export interface ShoppingListInput {
  items: ShoppingListItemInput[];
}

export interface RouteContextInput {
  /** Waypoints en orden: origen, paradas del día, destino. Mínimo 2 (ej. Trabajo → Casa). */
  waypoints: LatLng[];
}

export interface ProductPreferenceInput {
  productId: string;
  type: ProductPreferenceType;
  /** Requerido cuando type es EXACT o PREFERRED. */
  preferredBrandId?: string;
}

export interface StorePreferenceInput {
  category: string;
  type: StorePreferenceType;
  storeBranchId: string;
}

export interface UserPreferencesInput {
  productPreferences: ProductPreferenceInput[];
  storePreferences: StorePreferenceInput[];
}

export interface StoreProductOffer {
  productId: string;
  brandId: string | null;
  price: number;
  confidence: ConfidenceLevel;
}

export interface StoreCandidateInput {
  storeBranchId: string;
  storeName: string;
  branchName: string;
  location: LatLng;
  offers: StoreProductOffer[];
}

export interface OptimizationWeights {
  monetary: number;
  route: number;
  convenience: number;
  preference: number;
  confidence: number;
}

export interface OptimizeInput {
  shoppingList: ShoppingListInput;
  routeContext: RouteContextInput;
  preferences: UserPreferencesInput;
  storeCandidates: StoreCandidateInput[];
  transportMode: TransportMode;
  /** Modo primario solicitado por el usuario — sólo afecta a qué perfil aplica `weightsOverride`. */
  mode: OptimizationMode;
  /** Metros de desvío máximo para pre-filtrar candidatos por corredor de ruta. Default 3000m. */
  maxDeviationMeters?: number;
  /** Pesos custom para el perfil indicado en `mode` — pensado para tests/tuning, no UI. */
  weightsOverride?: Partial<OptimizationWeights>;
}

export interface PlanStopItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface PlanStop {
  storeBranchId: string;
  storeName: string;
  branchName: string;
  order: number;
  items: PlanStopItem[];
}

export interface OptimizationPlanResult {
  label: "BALANCED" | "FASTEST" | "CHEAPEST";
  totalProductCost: number;
  estimatedTravelCost: number;
  estimatedEffectiveCost: number;
  additionalDistanceMeters: number;
  additionalTimeSeconds: number;
  numberOfStops: number;
  missingProductIds: string[];
  priceConfidence: ConfidenceLevel;
  estimatedSavings: number;
  stores: string[];
  stops: PlanStop[];
  explanation: string;
  /**
   * Score interno normalizado — sólo para tests/debug. NUNCA exponer al usuario final
   * como "Score 0.376" (regla explícita, sección 66 del master prompt).
   */
  debugScore: number;
}
