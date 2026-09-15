import type { PriceReportCandidate } from "./types";

export interface IndependenceResult {
  independent: PriceReportCandidate[];
  discardedReportIds: string[];
}

/**
 * Reglas de independencia obligatorias (BUSINESS-RULES.md p.7):
 * - Una cuenta no vota más de una vez el mismo producto/sucursal en la misma ventana
 *   (el caller ya filtró la ventana — acá sólo se dedupe por usuario, quedando el más
 *   reciente).
 * - Cuentas distintas que comparten dispositivo/IP no cuentan como independientes entre
 *   sí — sólo la primera (orden de llegada) participa del cálculo.
 */
export function enforceIndependence(reports: PriceReportCandidate[]): IndependenceResult {
  const discardedReportIds: string[] = [];

  const latestByUser = new Map<string, PriceReportCandidate>();
  for (const report of reports) {
    const existing = latestByUser.get(report.userId);
    if (!existing) {
      latestByUser.set(report.userId, report);
    } else if (report.reportedAt.getTime() > existing.reportedAt.getTime()) {
      discardedReportIds.push(existing.id);
      latestByUser.set(report.userId, report);
    } else {
      discardedReportIds.push(report.id);
    }
  }

  const byFingerprint = new Map<string, PriceReportCandidate[]>();
  for (const report of latestByUser.values()) {
    if (!report.deviceFingerprint) continue;
    const group = byFingerprint.get(report.deviceFingerprint) ?? [];
    group.push(report);
    byFingerprint.set(report.deviceFingerprint, group);
  }

  const excludedForSharedDevice = new Set<string>();
  for (const group of byFingerprint.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => a.reportedAt.getTime() - b.reportedAt.getTime());
    for (const report of sorted.slice(1)) {
      excludedForSharedDevice.add(report.id);
    }
  }

  const independent: PriceReportCandidate[] = [];
  for (const report of latestByUser.values()) {
    if (excludedForSharedDevice.has(report.id)) {
      discardedReportIds.push(report.id);
    } else {
      independent.push(report);
    }
  }

  return { independent, discardedReportIds };
}
