/**
 * Formas de datos compartidas entre apps y packages (DB rows / DTOs de API).
 * Fuente: docs/development/DATABASE.md, master prompt secciones 32/43/70.
 * Los enums viven en @depaso/domain (junto con las reglas de negocio que los usan).
 */

import type {
  ConfidenceLevel,
  ModerationEventType,
  OptimizationMode,
  PlaceType,
  PriceSourceType,
  PriceStatus,
  ProductPreferenceType,
  Role,
  StorePreferenceType,
  TransportMode,
  ConsentType,
} from "./enums";

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserProfile {
  userId: string;
  ageConfirmed18Plus: boolean;
  marketingOptIn: boolean;
}

export interface UserConsent {
  id: string;
  userId: string;
  type: ConsentType;
  documentVersion: string;
  accepted: boolean;
  acceptedAt: string;
}

export interface UserPlace {
  id: string;
  userId: string;
  name: string;
  type: PlaceType;
  address: string;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  brandId: string | null;
  name: string;
  category: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  ean: string | null;
  unit: string;
  unitSize: number;
}

export interface ProductAlias {
  id: string;
  productVariantId: string;
  alias: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface StoreBranch {
  id: string;
  storeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
}

export interface Price {
  id: string;
  productVariantId: string;
  storeBranchId: string;
  price: number;
  currency: string;
  sourceType: PriceSourceType;
  sourceReference: string | null;
  reportedAt: string;
  validFrom: string;
  confidence: ConfidenceLevel;
  status: PriceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  priceId: string;
  productVariantId: string;
  storeBranchId: string;
  price: number;
  status: PriceStatus;
  changedAt: string;
  changeReason: string;
}

export interface PriceReport {
  id: string;
  userId: string;
  productVariantId: string;
  storeBranchId: string;
  reportedPrice: number;
  requiresPromotion: boolean;
  promotionNote: string | null;
  photoEvidenceUrl: string | null;
  goodFaithDeclared: boolean;
  createdAt: string;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  productId: string;
  quantity: number;
  note: string | null;
}

export interface ProductPreference {
  id: string;
  userId: string;
  productId: string;
  type: ProductPreferenceType;
  preferredBrandId: string | null;
}

export interface StorePreference {
  id: string;
  userId: string;
  category: string;
  type: StorePreferenceType;
  storeBranchId: string;
}

export interface SavedRouteContext {
  id: string;
  userId: string;
  name: string;
  waypointPlaceIds: string[];
  createdAt: string;
}

export interface OptimizationRun {
  id: string;
  userId: string;
  shoppingListId: string;
  mode: OptimizationMode;
  transportMode: TransportMode;
  createdAt: string;
}

export interface OptimizationPlan {
  id: string;
  optimizationRunId: string;
  rank: number;
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
  explanation: string;
}

export interface OptimizationPlanStop {
  id: string;
  optimizationPlanId: string;
  order: number;
  storeBranchId: string;
}

export interface OptimizationPlanItem {
  id: string;
  optimizationPlanStopId: string;
  productId: string;
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

export interface UserTrustScore {
  userId: string;
  score: number;
  reportsSubmitted: number;
  reportsConfirmed: number;
  lastUpdatedAt: string;
}

export interface CommunityModerationEvent {
  id: string;
  type: ModerationEventType;
  targetPriceReportId: string | null;
  targetUserId: string | null;
  reason: string;
  createdAt: string;
  createdByAdminId: string | null;
}
