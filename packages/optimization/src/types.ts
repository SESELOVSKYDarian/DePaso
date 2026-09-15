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
  /** Variante concreta detrás del precio — opcional para no romper callers que sólo
   * conocen el producto agregado (ej. tests). Cuando está, el plan resultante la propaga
   * hasta `PlanStopItem` para que el cliente pueda reportar ese precio puntual. */
  productVariantId?: string;
  brandId: string | null;
  price: number;
  confidence: ConfidenceLevel;
  /** `Price.sourceType` real (string ancho a propósito — el motor no depende del enum
   * completo de Prisma, sólo lo propaga). Junto con `reportedAt`, arma la divulgación
   * obligatoria de cada precio (BUSINESS-RULES.md p.9: Fuente + Recencia). */
  sourceType?: string;
  /** ISO 8601 — última vez que se observó este precio. */
  reportedAt?: string;
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
  productVariantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  /** Divulgación obligatoria por precio (BUSINESS-RULES.md p.9: "Monto, Sucursal, Fuente,
   * Recencia, Confianza, Aviso" — Sucursal ya la da `PlanStop`). Opcionales por el mismo
   * motivo que `productVariantId`: no romper callers que arman ofertas sin esta data (tests). */
  sourceType?: string;
  reportedAt?: string;
  confidence?: ConfidenceLevel;
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
