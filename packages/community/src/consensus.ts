import { computeWeightedMedian, detectOutliers } from "./anomaly";
import { enforceIndependence } from "./independence";
import {
  DEFAULT_CONSENSUS_THRESHOLDS,
  type ConsensusDecision,
  type ConsensusThresholds,
  type PreviousPriceInput,
  type PriceReportCandidate,
  type TrustScoreLookup,
} from "./types";

/**
 * PriceConsensusService — Fase 13-14. Implementa la pseudológica de actualización de
 * BUSINESS-RULES.md (p.7): agrupar, descartar duplicados/sospechosos/baja confianza,
 * calcular mediana ponderada + dispersión, promover si supera umbral o mantener
 * "discutido" con alternativas si hay conflicto. El paso 7 (audit log / `PriceHistory`,
 * "nunca sobreescribir sin histórico") lo hace el caller con `changeReason`.
 */

const LOW_TRUST_FLOOR = 0.2;
/** Evidencia (ticket/góndola) pesa más en la mediana ponderada — regla 6, p.7. */
const EVIDENCE_WEIGHT_BOOST = 1.5;

/** Paso 1 de la pseudológica: agrupar por product_id + branch_id + ventana temporal. */
export function groupReportsByWindow(
  reports: PriceReportCandidate[],
  now: Date,
  windowHours: number
): Map<string, PriceReportCandidate[]> {
  const cutoff = now.getTime() - windowHours * 60 * 60 * 1000;
  const groups = new Map<string, PriceReportCandidate[]>();
  for (const report of reports) {
    if (report.reportedAt.getTime() < cutoff) continue;
    const key = `${report.productVariantId}|${report.storeBranchId}`;
    const group = groups.get(key) ?? [];
    group.push(report);
    groups.set(key, group);
  }
  return groups;
}

/** Evalúa el consenso de un único grupo product_id + branch_id ya filtrado por ventana. */
export function evaluateConsensus(
  productVariantId: string,
  storeBranchId: string,
  reports: PriceReportCandidate[],
  previousPrice: PreviousPriceInput | null,
  getTrustScore: TrustScoreLookup,
  thresholds: ConsensusThresholds = DEFAULT_CONSENSUS_THRESHOLDS
): ConsensusDecision {
  // Paso 2a: independencia.
  const { independent, discardedReportIds } = enforceIndependence(reports);

  // Paso 2b: baja confianza del reportante — no mueven el precio, pero no son anómalos.
  const trusted: PriceReportCandidate[] = [];
  for (const report of independent) {
    if (getTrustScore(report.userId) >= LOW_TRUST_FLOOR) {
      trusted.push(report);
    } else {
      discardedReportIds.push(report.id);
    }
  }

  if (trusted.length === 0) {
    return insufficientData(
      productVariantId,
      storeBranchId,
      previousPrice,
      0,
      0,
      discardedReportIds,
      [],
      [],
      "Sin reportes independientes de confianza suficiente en la ventana"
    );
  }

  // Paso 2c: detectar saltos imposibles contra una mediana simple sin ponderar todavía.
  const roughMedian = computeWeightedMedian(trusted.map((r) => ({ price: r.reportedPrice, weight: 1 })));
  const anomalousReportIds = detectOutliers(trusted, roughMedian, thresholds.outlierMultiplier);
  const clean = trusted.filter((r) => !anomalousReportIds.includes(r.id));

  if (clean.length < thresholds.minIndependentReports) {
    return insufficientData(
      productVariantId,
      storeBranchId,
      previousPrice,
      roughMedian,
      clean.length,
      discardedReportIds,
      anomalousReportIds,
      distinctPrices(clean),
      `Sólo ${clean.length} reporte(s) independiente(s) en la ventana — hacen falta ${thresholds.minIndependentReports} para promover (ejemplo MVP, BUSINESS-RULES.md p.7)`
    );
  }

  // Paso 3: mediana ponderada por trust score (con boost por evidencia) + dispersión.
  const weighted = clean.map((r) => ({
    price: r.reportedPrice,
    weight: getTrustScore(r.userId) * (r.hasEvidence ? EVIDENCE_WEIGHT_BOOST : 1),
  }));
  const weightedMedian = computeWeightedMedian(weighted);
  const tolerance = thresholds.priceTolerance * weightedMedian;

  const inTolerance = clean.filter((r) => Math.abs(r.reportedPrice - weightedMedian) <= tolerance);
  const agreementRatio = clean.length > 0 ? inTolerance.length / clean.length : 0;

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  const inToleranceWeight = weighted
    .filter((w) => Math.abs(w.price - weightedMedian) <= tolerance)
    .reduce((sum, w) => sum + w.weight, 0);
  const weightedConfidence = totalWeight > 0 ? inToleranceWeight / totalWeight : 0;

  // Paso 4: promover si supera el umbral combinado (cantidad + acuerdo + confianza).
  if (agreementRatio >= thresholds.minAgreementRatio && weightedConfidence >= thresholds.minWeightedConfidence) {
    return {
      productVariantId,
      storeBranchId,
      status: "COMMUNITY_CONFIRMED",
      consensusPrice: weightedMedian,
      weightedMedian,
      agreementRatio,
      independentReportCount: clean.length,
      discardedReportIds,
      anomalousReportIds,
      alternativePrices: distinctPrices(clean).filter((p) => Math.abs(p - weightedMedian) > tolerance),
      changeReason: `Consenso comunitario: ${clean.length} reportes independientes, ${(agreementRatio * 100).toFixed(0)}% dentro de ±${(thresholds.priceTolerance * 100).toFixed(0)}% de la mediana ponderada (BUSINESS-RULES.md p.7, regla 4).`,
    };
  }

  // Paso 5: conflicto — conservar precio anterior y mostrar alternativas.
  return {
    productVariantId,
    storeBranchId,
    status: "DISPUTED",
    consensusPrice: null,
    weightedMedian,
    agreementRatio,
    independentReportCount: clean.length,
    discardedReportIds,
    anomalousReportIds,
    alternativePrices: distinctPrices(clean),
    changeReason: `Sin consenso suficiente (${(agreementRatio * 100).toFixed(0)}% de acuerdo) — se conserva el precio anterior y se muestran alternativas (BUSINESS-RULES.md p.7, regla 5).`,
  };
}

function insufficientData(
  productVariantId: string,
  storeBranchId: string,
  previousPrice: PreviousPriceInput | null,
  weightedMedian: number,
  independentReportCount: number,
  discardedReportIds: string[],
  anomalousReportIds: string[],
  alternativePrices: number[],
  reasonPrefix: string
): ConsensusDecision {
  return {
    productVariantId,
    storeBranchId,
    status: previousPrice?.status ?? "LOW_CONFIDENCE",
    consensusPrice: null,
    weightedMedian,
    agreementRatio: 0,
    independentReportCount,
    discardedReportIds,
    anomalousReportIds,
    alternativePrices,
    changeReason: `${reasonPrefix} — se mantiene el precio anterior.`,
  };
}

function distinctPrices(reports: PriceReportCandidate[]): number[] {
  return Array.from(new Set(reports.map((r) => r.reportedPrice))).sort((a, b) => a - b);
}
