/**
 * Enums de dominio. Fuente: master prompt secciones 32/39/40/44/49/60/62, y
 * docs/legal-functional/BUSINESS-RULES.md (estados de precio) / LEGAL.md (consentimiento).
 */

export type PlaceType = "HOME" | "WORK" | "STUDY" | "GYM" | "FAMILY" | "CUSTOM";

export type Role = "USER" | "ADMIN";

export type ProductPreferenceType = "EXACT" | "PREFERRED" | "ANY";

export type StorePreferenceType = "REQUIRED" | "PREFERRED";

export type PriceSourceType = "OFFICIAL" | "STORE" | "COMMUNITY" | "ESTIMATED";

/**
 * Estados de confianza del precio (docs/legal-functional/BUSINESS-RULES.md p.6):
 * Informado / Confirmado / Discutido / En revisión / Vencido.
 */
export type PriceStatus =
  | "VERIFIED"
  | "COMMUNITY_CONFIRMED"
  | "DISPUTED"
  | "IN_REVIEW"
  | "STALE"
  | "LOW_CONFIDENCE";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type OptimizationMode = "BALANCED" | "CHEAPEST" | "FASTEST";

export type TransportMode = "CAR" | "MOTORCYCLE" | "BICYCLE" | "WALK" | "PUBLIC_TRANSPORT";

export type ConsentType = "TERMS" | "PRIVACY" | "LOCATION" | "MARKETING";

export type ModerationEventType =
  | "REPORT_HIDDEN"
  | "REPORT_WEIGHTED_DOWN"
  | "REPORT_REJECTED"
  | "USER_SUSPENDED"
  | "USER_APPEALED"
  | "PRICE_SENT_TO_REVIEW";
