import { describe, expect, it } from "vitest";
import { median, observationIfDifferent, type CommunityObservation } from "./communityPrices";

describe("median", () => {
  it("toma el valor del medio", () => {
    expect(median([300, 100, 200])).toBe(200);
  });

  it("promedia los dos del medio si hay cantidad par", () => {
    expect(median([100, 200, 300, 400])).toBe(250);
  });
});

describe("observationIfDifferent", () => {
  const observations = new Map<string, CommunityObservation>([["v1:b1", { median: 1200, count: 3 }]]);

  it("devuelve lo que vieron los usuarios cuando difiere del precio publicado", () => {
    expect(observationIfDifferent(observations, "v1", "b1", 1000)).toEqual({ median: 1200, count: 3 });
  });

  it("no avisa si la diferencia es mínima", () => {
    expect(observationIfDifferent(observations, "v1", "b1", 1180)).toBeUndefined();
  });

  it("no avisa si nadie reportó ese producto en ese comercio", () => {
    expect(observationIfDifferent(observations, "v2", "b1", 1000)).toBeUndefined();
    expect(observationIfDifferent(observations, undefined, "b1", 1000)).toBeUndefined();
  });
});
