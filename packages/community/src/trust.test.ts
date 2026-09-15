import { describe, expect, it } from "vitest";
import {
  INITIAL_TRUST_SCORE,
  recordReportOutcome,
  recordReportSubmitted,
  toConfidenceLevel,
} from "./trust";

describe("recordReportSubmitted", () => {
  it("incrementa reportsSubmitted sin tocar el score", () => {
    const next = recordReportSubmitted(INITIAL_TRUST_SCORE);
    expect(next.reportsSubmitted).toBe(1);
    expect(next.score).toBe(INITIAL_TRUST_SCORE.score);
  });
});

describe("recordReportOutcome", () => {
  it("sube el score y reportsConfirmed cuando el reporte se confirma", () => {
    const next = recordReportOutcome(INITIAL_TRUST_SCORE, "CONFIRMED");
    expect(next.score).toBeGreaterThan(INITIAL_TRUST_SCORE.score);
    expect(next.reportsConfirmed).toBe(1);
  });

  it("baja el score cuando el reporte se descarta o rechaza", () => {
    const disputed = recordReportOutcome(INITIAL_TRUST_SCORE, "DISPUTED");
    const rejected = recordReportOutcome(INITIAL_TRUST_SCORE, "REJECTED");
    expect(disputed.score).toBeLessThan(INITIAL_TRUST_SCORE.score);
    expect(rejected.score).toBeLessThan(INITIAL_TRUST_SCORE.score);
    expect(disputed.reportsConfirmed).toBe(0);
  });

  it("nunca baja de 0 ni sube de 1", () => {
    let state = { score: 0.02, reportsSubmitted: 0, reportsConfirmed: 0 };
    for (let i = 0; i < 10; i++) state = recordReportOutcome(state, "REJECTED");
    expect(state.score).toBe(0);

    let high = { score: 0.99, reportsSubmitted: 0, reportsConfirmed: 0 };
    for (let i = 0; i < 10; i++) high = recordReportOutcome(high, "CONFIRMED");
    expect(high.score).toBe(1);
  });
});

describe("toConfidenceLevel", () => {
  it("mapea score a buckets sin exponer el número crudo", () => {
    expect(toConfidenceLevel(0.9)).toBe("HIGH");
    expect(toConfidenceLevel(0.5)).toBe("MEDIUM");
    expect(toConfidenceLevel(0.1)).toBe("LOW");
  });
});
