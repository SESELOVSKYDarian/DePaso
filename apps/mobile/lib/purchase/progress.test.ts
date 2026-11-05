import { describe, expect, it } from "vitest";
import { clampBought, formatDistance, isItemDone, missingUnits } from "./progress";

describe("avance de un producto de la compra", () => {
  it("está resuelto si se compró todo o si no había más", () => {
    expect(isItemDone(undefined, 3)).toBe(false);
    expect(isItemDone({ bought: 2, soldOut: false }, 3)).toBe(false);
    expect(isItemDone({ bought: 3, soldOut: false }, 3)).toBe(true);
    expect(isItemDone({ bought: 1, soldOut: true }, 3)).toBe(true);
  });

  it("cuenta las unidades que faltan", () => {
    expect(missingUnits(undefined, 3)).toBe(3);
    expect(missingUnits({ bought: 2, soldOut: true }, 3)).toBe(1);
    expect(missingUnits({ bought: 5, soldOut: false }, 3)).toBe(0);
  });

  it("la cantidad comprada queda entre 0 y lo pedido", () => {
    expect(clampBought(-1, 3)).toBe(0);
    expect(clampBought(2.4, 3)).toBe(2);
    expect(clampBought(9, 3)).toBe(3);
  });

  it("dice la distancia en metros o kilómetros", () => {
    expect(formatDistance(450)).toBe("450 m");
    expect(formatDistance(4)).toBe("10 m");
    expect(formatDistance(1234)).toBe("1,2 km");
  });
});