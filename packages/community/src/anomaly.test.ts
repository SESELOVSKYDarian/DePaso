import { describe, expect, it } from "vitest";
import { computeWeightedMedian, detectOutliers } from "./anomaly";
import type { PriceReportCandidate } from "./types";

function report(id: string, reportedPrice: number): PriceReportCandidate {
  return {
    id,
    userId: id,
    productVariantId: "pv1",
    storeBranchId: "b1",
    reportedPrice,
    hasEvidence: false,
    reportedAt: new Date("2026-09-14T12:00:00Z"),
  };
}

describe("computeWeightedMedian", () => {
  it("devuelve 0 sin valores", () => {
    expect(computeWeightedMedian([])).toBe(0);
  });

  it("pondera hacia el valor con más peso acumulado", () => {
    const median = computeWeightedMedian([
      { price: 1000, weight: 1 },
      { price: 1010, weight: 5 },
      { price: 2000, weight: 1 },
    ]);
    expect(median).toBe(1010);
  });
});

describe("detectOutliers", () => {
  it("marca un salto imposible respecto a la mediana", () => {
    const reports = [report("r1", 1000), report("r2", 1010), report("r3", 5000)];
    const outliers = detectOutliers(reports, 1005, 3);
    expect(outliers).toEqual(["r3"]);
  });

  it("no marca nada si todos están dentro del múltiplo", () => {
    const reports = [report("r1", 1000), report("r2", 1010)];
    expect(detectOutliers(reports, 1005, 3)).toEqual([]);
  });

  it("sin mediana de referencia válida, no marca nada", () => {
    expect(detectOutliers([report("r1", 1000)], 0, 3)).toEqual([]);
  });
});
