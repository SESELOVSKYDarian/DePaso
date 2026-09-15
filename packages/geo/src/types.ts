/**
 * Config de una región de mercado (sección 62 del master prompt SEPA — "MarketRegion es
 * configuración, no `if city === 'Mar del Plata'`"). Este package es puro: no lee la DB.
 * El caller (import job, admin) carga el `MarketRegion` de Prisma y lo pasa acá.
 */
export interface MarketRegionConfig {
  slug: string;
  name: string;
  province: string;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  /** Variantes normalizadas de localidad que cuentan como "dentro" (ver `normalizeLocality`). */
  localityAliases: string[];
}

export type GeoMatchSource = "coordinates" | "locality" | "both" | "none";

export interface GeoClassification {
  insideBoundingBox: boolean;
  matchesLocality: boolean;
  matchedBy: GeoMatchSource;
  /** `true` cuando coordenadas y localidad se contradicen (una dice adentro, la otra
   * afuera) — sección 43: registrar la discrepancia, nunca decidir en silencio. */
  hasDiscrepancy: boolean;
}
