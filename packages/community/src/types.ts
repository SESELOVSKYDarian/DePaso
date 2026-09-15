/**
 * Tipos de input/output de `PriceConsensusService`/`CommunityTrustService`. Motor
 * TypeScript puro (mismo patrón que `@depaso/optimization`) — no toca la DB; el caller
 * (apps/api) arma el input desde Prisma y persiste el resultado (incluyendo `PriceHistory`,
 * regla obligatoria de nunca sobreescribir sin histórico). Fuente conceptual:
 * docs/legal-functional/BUSINESS-RULES.md (p.6-8).
 */

import type { PriceStatus } from "@depaso/types";

export interface PriceReportCandidate {
  id: string;
  userId: string;
  productVariantId: string;
  storeBranchId: string;
  reportedPrice: number;
  /** `photoEvidenceUrl` presente en el `PriceReport` original (ticket/góndola, regla 6). */
  hasEvidence: boolean;
  reportedAt: Date;
  /**
   * Huella de dispositivo/IP, si el caller la tiene — permite aplicar la regla obligatoria
   * "no contar cuentas creadas en masa con igual dispositivo/IP como independientes"
   * (BUSINESS-RULES.md p.7). Opcional: sin este dato, sólo se aplica dedupe por usuario.
   */
  deviceFingerprint?: string;
}

/** `(userId) => UserTrustScore.score` — nunca se expone crudo fuera de este cálculo. */
export type TrustScoreLookup = (userId: string) => number;

export interface PreviousPriceInput {
  amount: number;
  status: PriceStatus;
}

/**
 * Ejemplo de partida del MVP (BUSINESS-RULES.md p.7): "≥5 reportes independientes en 24h,
 * al menos 70% cae dentro de ±1% del mismo precio, y la mediana ponderada supera un umbral
 * de confianza". La cifra exacta está marcada como NO DEFINIDO/a calibrar — estos valores
 * son ese punto de partida documentado, no una constante cerrada.
 */
export interface ConsensusThresholds {
  minIndependentReports: number;
  priceTolerance: number;
  minAgreementRatio: number;
  minWeightedConfidence: number;
  /** Múltiplo de distancia a la mediana que se considera "salto imposible" (regla anti-fraude p.8). */
  outlierMultiplier: number;
}

export const DEFAULT_CONSENSUS_THRESHOLDS: ConsensusThresholds = {
  minIndependentReports: 5,
  priceTolerance: 0.01,
  minAgreementRatio: 0.7,
  minWeightedConfidence: 0.5,
  outlierMultiplier: 3,
};

export interface ConsensusDecision {
  productVariantId: string;
  storeBranchId: string;
  status: PriceStatus;
  /** `null` cuando se conserva el precio anterior (reportes insuficientes o sin consenso). */
  consensusPrice: number | null;
  weightedMedian: number;
  agreementRatio: number;
  independentReportCount: number;
  /** Reportes excluidos del cálculo por no-independientes o por baja confianza del reportante. */
  discardedReportIds: string[];
  /** Saltos imposibles vs. la mediana — regla anti-fraude (p.8): enviar a revisión. */
  anomalousReportIds: string[];
  /** Para el estado "Discutido" (BUSINESS-RULES.md p.7, regla 5). */
  alternativePrices: number[];
  /** Texto para `PriceHistory.changeReason` — regla obligatoria: nunca sobreescribir sin histórico. */
  changeReason: string;
}
