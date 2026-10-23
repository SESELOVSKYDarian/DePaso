import { describe, expect, it } from "vitest";
import { boundingBox, decodePolyline, findStoresAlongRoute, haversine, type BranchPoint } from "./nearbyStores";

// Ruta recta de ~2,2 km hacia el este en Mar del Plata.
const route = [
  { latitude: -38.0, longitude: -57.55 },
  { latitude: -38.0, longitude: -57.525 },
];

const branch = (id: string, latitude: number, longitude: number): BranchPoint => ({
  branchId: id,
  storeName: `Super ${id}`,
  branchName: id,
  address: "Calle 123",
  latitude,
  longitude,
});

describe("decodePolyline", () => {
  it("decodifica el ejemplo clásico de Google", () => {
    const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(points).toHaveLength(3);
    expect(points[0]!.latitude).toBeCloseTo(38.5, 4);
    expect(points[0]!.longitude).toBeCloseTo(-120.2, 4);
    expect(points[2]!.latitude).toBeCloseTo(43.252, 4);
  });
});

describe("findStoresAlongRoute", () => {
  it("un comercio sobre el camino casi no desvía", () => {
    const [result] = findStoresAlongRoute(route, [branch("en-camino", -38.0, -57.54)], 1500);
    expect(result!.detourMeters).toBeLessThan(30);
  });

  it("el desvío crece con la distancia al camino (ida y vuelta)", () => {
    const near = findStoresAlongRoute(route, [branch("cerca", -38.002, -57.54)], 1500)[0]!;
    const far = findStoresAlongRoute(route, [branch("lejos", -38.005, -57.54)], 3000)[0]!;
    expect(far.detourMeters).toBeGreaterThan(near.detourMeters * 2);
    // ~222 m al costado: ida y vuelta ronda 2 x 222 x 1,3.
    expect(near.detourMeters).toBeGreaterThan(450);
    expect(near.detourMeters).toBeLessThan(700);
  });

  it("descarta lo que pasa del desvío máximo y ordena por desvío", () => {
    const result = findStoresAlongRoute(
      route,
      [branch("lejos", -38.03, -57.54), branch("b", -38.003, -57.54), branch("a", -38.0005, -57.53)],
      1500,
    );
    expect(result.map((r) => r.branchId)).toEqual(["a", "b"]);
  });

  it("estima el tiempo a partir del desvío", () => {
    const [result] = findStoresAlongRoute(route, [branch("x", -38.003, -57.54)], 2000);
    expect(result!.detourSeconds).toBeGreaterThan(0);
    expect(result!.detourSeconds).toBe(Math.round(result!.detourMeters / 6.7));
  });
});

describe("boundingBox", () => {
  it("ensancha la caja por el margen", () => {
    const box = boundingBox(route, 1500);
    expect(box.minLat).toBeLessThan(-38.0);
    expect(box.maxLat).toBeGreaterThan(-38.0);
    expect(haversine({ latitude: box.minLat, longitude: -57.54 }, { latitude: -38.0, longitude: -57.54 })).toBeGreaterThan(1400);
  });
});
