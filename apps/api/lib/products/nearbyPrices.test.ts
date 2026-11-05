import type { NearbyPrice } from "@depaso/validation";
import { describe, expect, it } from "vitest";
import { rankNearbyOptions } from "./nearbyPrices";

const option = (branchId: string, unitPrice: number, distanceMeters: number): NearbyPrice => ({
  branchId, storeName: branchId, branchName: "Sucursal", address: "Calle 1", latitude: 0, longitude: 0, unitPrice, distanceMeters,
});

describe("dónde conseguir lo que no había", () => {
  it("sin opciones devuelve vacío", () => {
    expect(rankNearbyOptions([])).toEqual([]);
  });

  it("recomienda la más cercana entre las casi tan baratas como la más barata", () => {
    const ranked = rankNearbyOptions([option("lejos-barato", 1000, 2500), option("cerca-casi-igual", 1050, 300), option("cerca-caro", 1500, 100)]);
    expect(ranked[0]!.branchId).toBe("cerca-casi-igual");
  });

  it("si la cercana es mucho más cara, recomienda la barata aunque quede lejos", () => {
    const ranked = rankNearbyOptions([option("lejos-barato", 1000, 2500), option("cerca-caro", 1500, 100)]);
    expect(ranked[0]!.branchId).toBe("lejos-barato");
  });

  it("devuelve como mucho tres, el resto ordenado por precio", () => {
    const ranked = rankNearbyOptions([option("a", 1000, 100), option("b", 1400, 100), option("c", 1200, 100), option("d", 1300, 100)]);
    expect(ranked.map((entry) => entry.branchId)).toEqual(["a", "c", "d"]);
  });
});