import { describe, expect, it } from "vitest";
import { enforceIndependence } from "./independence";
import type { PriceReportCandidate } from "./types";

function report(overrides: Partial<PriceReportCandidate>): PriceReportCandidate {
  return {
    id: "r1",
    userId: "u1",
    productVariantId: "pv1",
    storeBranchId: "b1",
    reportedPrice: 1000,
    hasEvidence: false,
    reportedAt: new Date("2026-09-14T12:00:00Z"),
    ...overrides,
  };
}

describe("enforceIndependence", () => {
  it("se queda sólo con el reporte más reciente por usuario", () => {
    const older = report({ id: "r1", userId: "u1", reportedAt: new Date("2026-09-14T10:00:00Z") });
    const newer = report({ id: "r2", userId: "u1", reportedAt: new Date("2026-09-14T11:00:00Z") });

    const { independent, discardedReportIds } = enforceIndependence([older, newer]);

    expect(independent.map((r) => r.id)).toEqual(["r2"]);
    expect(discardedReportIds).toEqual(["r1"]);
  });

  it("excluye cuentas distintas que comparten dispositivo/IP, dejando sólo la más antigua", () => {
    const first = report({
      id: "r1",
      userId: "u1",
      deviceFingerprint: "device-x",
      reportedAt: new Date("2026-09-14T09:00:00Z"),
    });
    const second = report({
      id: "r2",
      userId: "u2",
      deviceFingerprint: "device-x",
      reportedAt: new Date("2026-09-14T10:00:00Z"),
    });

    const { independent, discardedReportIds } = enforceIndependence([first, second]);

    expect(independent.map((r) => r.id)).toEqual(["r1"]);
    expect(discardedReportIds).toEqual(["r2"]);
  });

  it("no descarta usuarios sin fingerprint compartido", () => {
    const a = report({ id: "r1", userId: "u1" });
    const b = report({ id: "r2", userId: "u2" });

    const { independent, discardedReportIds } = enforceIndependence([a, b]);

    expect(independent).toHaveLength(2);
    expect(discardedReportIds).toEqual([]);
  });
});
