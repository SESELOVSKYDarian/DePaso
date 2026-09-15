import type { PriceReportCandidate } from "./types";

export interface WeightedValue {
  price: number;
  weight: number;
}

/** Mediana ponderada por peso acumulado — no promedio, para no dejar que un outlier la mueva de golpe. */
export function computeWeightedMedian(values: WeightedValue[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a.price - b.price);
  const totalWeight = sorted.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) {
    return sorted[Math.floor(sorted.length / 2)]!.price;
  }
  let cumulative = 0;
  for (const v of sorted) {
    cumulative += v.weight;
    if (cumulative >= totalWeight / 2) return v.price;
  }
  return sorted[sorted.length - 1]!.price;
}

/**
 * "Saltos imposibles" (anti-fraude, BUSINESS-RULES.md p.8) — un reporte a `multiplier`x o
 * más de distancia de la referencia se marca como anómalo y se excluye del cálculo de
 * consenso, para revisión manual aparte.
 */
export function detectOutliers(
  reports: PriceReportCandidate[],
  referenceMedian: number,
  multiplier: number
): string[] {
  if (referenceMedian <= 0) return [];
  const outlierIds: string[] = [];
  for (const report of reports) {
    const ratio = report.reportedPrice / referenceMedian;
    if (ratio >= multiplier || ratio <= 1 / multiplier) {
      outlierIds.push(report.id);
    }
  }
  return outlierIds;
}
