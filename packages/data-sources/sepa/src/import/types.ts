import type { ImportSourceType } from "@depaso/database";
import type { MarketRegionConfig } from "@depaso/geo";

export interface SepaImportOptions {
  source: ImportSourceType;
  /** `MarketRegion` ya cargado de Prisma (id real + config geográfica) — este package no
   * decide cuál región usar, el caller (script CLI) lo resuelve. */
  region: MarketRegionConfig & { id: string };
  dryRun?: boolean;
  /** Máximo de muestras de anomalías a devolver en el resumen (no todas — pueden ser
   * miles); el detalle completo, si `!dryRun`, queda en `ImportAnomaly`. */
  maxAnomalySamples?: number;
}

export interface AnomalySample {
  reason: string;
  sample: string;
}

export interface ChainSummary {
  storeName: string;
  branchesDetected: number;
}

export interface SepaImportSummary {
  source: ImportSourceType;
  resourceId: string;
  resourceLastModified: string;
  dryRun: boolean;
  skippedAlreadyImported: boolean;
  comerciosInFeed: number;
  chains: ChainSummary[];
  branchesDetected: number;
  branchesOutOfScope: number;
  productRowsRead: number;
  pricesAccepted: number;
  pricesRejected: number;
  anomalySamples: AnomalySample[];
}
