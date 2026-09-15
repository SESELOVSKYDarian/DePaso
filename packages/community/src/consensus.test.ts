import { describe, expect, it } from "vitest";
import { evaluateConsensus, groupReportsByWindow } from "./consensus";
import type { PriceReportCandidate } from "./types";

const PRODUCT = "pv1";
const BRANCH = "b1";
const NOW = new Date("2026-09-14T12:00:00Z");

function report(id: string, price: number, overrides: Partial<PriceReportCandidate> = {}): PriceReportCandidate {
  return {
    id,
    userId: id,
    productVariantId: PRODUCT,
    storeBranchId: BRANCH,
    reportedPrice: price,
    hasEvidence: false,
    reportedAt: NOW,
    ...overrides,
  };
}

const uniformTrust = () => 0.6;

describe("evaluateConsensus", () => {
  it("promueve el precio comunitario con ≥5 reportes independientes en acuerdo (regla 4, p.7)", () => {
    const reports = [
      report("r1", 1000),
      report("r2", 1000),
      report("r3", 1005),
      report("r4", 995),
      report("r5", 1000),
    ];

    const decision = evaluateConsensus(PRODUCT, BRANCH, reports, null, uniformTrust);

    expect(decision.status).toBe("COMMUNITY_CONFIRMED");
    expect(decision.consensusPrice).toBe(1000);
    expect(decision.independentReportCount).toBe(5);
  });

  it("mantiene el precio anterior si hay menos reportes que el umbral (regla MVP, p.7)", () => {
    const reports = [report("r1", 1000), report("r2", 1000), report("r3", 995)];

    const decision = evaluateConsensus(
      PRODUCT,
      BRANCH,
      reports,
      { amount: 990, status: "VERIFIED" },
      uniformTrust
    );

    expect(decision.status).toBe("VERIFIED");
    expect(decision.consensusPrice).toBeNull();
  });

  it("marca 'discutido' y conserva el precio anterior cuando no hay consenso (regla 5, p.7)", () => {
    const reports = [
      report("r1", 1000),
      report("r2", 1000),
      report("r3", 1000),
      report("r4", 2000),
      report("r5", 2000),
    ];

    const decision = evaluateConsensus(
      PRODUCT,
      BRANCH,
      reports,
      { amount: 990, status: "VERIFIED" },
      uniformTrust
    );

    expect(decision.status).toBe("DISPUTED");
    expect(decision.consensusPrice).toBeNull();
    expect(decision.alternativePrices).toEqual([1000, 2000]);
  });

  it("excluye saltos imposibles del cálculo y los reporta como anómalos (anti-fraude, p.8)", () => {
    const reports = [
      report("r1", 1000),
      report("r2", 1000),
      report("r3", 1000),
      report("r4", 1000),
      report("r5", 1000),
      report("r6", 50000),
    ];

    const decision = evaluateConsensus(PRODUCT, BRANCH, reports, null, uniformTrust);

    expect(decision.status).toBe("COMMUNITY_CONFIRMED");
    expect(decision.consensusPrice).toBe(1000);
    expect(decision.anomalousReportIds).toEqual(["r6"]);
  });

  it("descarta reportes de usuarios bajo el piso de confianza sin promoverlos", () => {
    const reports = [
      report("r1", 1000, { userId: "lowtrust" }),
      report("r2", 1000, { userId: "lowtrust2" }),
    ];

    const decision = evaluateConsensus(PRODUCT, BRANCH, reports, null, () => 0.05);

    expect(decision.consensusPrice).toBeNull();
    expect(decision.discardedReportIds).toEqual(["r1", "r2"]);
  });

  it("da más peso a reportes con evidencia (regla 6, p.7)", () => {
    const reports = [
      report("r1", 1000, { userId: "u1", hasEvidence: true }),
      report("r2", 1000, { userId: "u2", hasEvidence: true }),
      report("r3", 1000, { userId: "u3", hasEvidence: true }),
      report("r4", 1300, { userId: "u4" }),
      report("r5", 1300, { userId: "u5" }),
    ];

    const decision = evaluateConsensus(PRODUCT, BRANCH, reports, null, uniformTrust);

    // 3 reportes con evidencia (peso x1.5) vs 2 sin evidencia: la mediana ponderada cae
    // del lado de los 3 con evidencia.
    expect(decision.weightedMedian).toBe(1000);
  });
});

describe("groupReportsByWindow", () => {
  it("agrupa por producto+sucursal y descarta lo que cayó fuera de la ventana", () => {
    const inWindow = report("r1", 1000, { reportedAt: new Date("2026-09-14T11:00:00Z") });
    const outOfWindow = report("r2", 1000, { reportedAt: new Date("2026-09-12T11:00:00Z") });
    const otherBranch = report("r3", 1000, { storeBranchId: "b2", reportedAt: NOW });

    const groups = groupReportsByWindow([inWindow, outOfWindow, otherBranch], NOW, 24);

    expect(groups.get(`${PRODUCT}|${BRANCH}`)?.map((r) => r.id)).toEqual(["r1"]);
    expect(groups.get(`${PRODUCT}|b2`)?.map((r) => r.id)).toEqual(["r3"]);
  });
});
