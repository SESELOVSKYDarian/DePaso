import { describe, expect, it } from "vitest";
import { samePoints } from "./routeMatches";

const casa = { latitude: -38.0055, longitude: -57.5426 };
const tecnica = { latitude: -37.99, longitude: -57.56 };

describe("samePoints", () => {
  it("reconoce el mismo recorrido en el mismo orden", () => {
    expect(samePoints([casa, tecnica], [{ ...casa }, { ...tecnica }])).toBe(true);
  });

  it("distingue el orden y la cantidad de paradas", () => {
    expect(samePoints([casa, tecnica], [tecnica, casa])).toBe(false);
    expect(samePoints([casa], [casa, tecnica])).toBe(false);
  });

  it("un recorrido vacío no coincide con nada", () => {
    expect(samePoints([], [])).toBe(false);
  });
});
