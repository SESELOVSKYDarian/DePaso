import { describe, expect, it } from "vitest";
import { buildPlanRoute } from "./planRoute";

const origin = { latitude: -38.0, longitude: -57.56 };
const destination = { latitude: -38.0, longitude: -57.52 };
const base = [origin, destination];

const branches = new Map([
  ["near", { latitude: -38.002, longitude: -57.54, address: "Calle A 100" }],
  ["far", { latitude: -38.0, longitude: -57.53, address: "Calle B 200" }],
]);
const stop = (storeBranchId: string, order: number) => ({ storeBranchId, storeName: storeBranchId, branchName: "x", order });

describe("buildPlanRoute", () => {
  it("mete la parada entre origen y destino", () => {
    const { routeWaypoints, stops } = buildPlanRoute(base, [stop("near", 0)], branches);
    expect(routeWaypoints).toHaveLength(3);
    expect(routeWaypoints[0]).toEqual(origin);
    expect(routeWaypoints[2]).toEqual(destination);
    expect(stops[0]!.routeIndex).toBe(1);
    expect(stops[0]!.address).toBe("Calle A 100");
  });

  it("informa cuántas cuadras queda del camino", () => {
    const { stops } = buildPlanRoute(base, [stop("near", 0)], branches);
    // ~222 m al costado del camino ≈ 2 cuadras.
    expect(stops[0]!.distanceFromRouteMeters).toBeGreaterThan(180);
    expect(stops[0]!.distanceFromRouteMeters).toBeLessThan(260);
    expect(stops[0]!.detourMeters).toBeGreaterThan(300);
  });

  it("ordena varias paradas a lo largo del camino", () => {
    const { routeWaypoints } = buildPlanRoute(base, [stop("far", 0), stop("near", 1)], branches);
    expect(routeWaypoints).toHaveLength(4);
    // 'near' (-57.54) queda antes que 'far' (-57.53) viniendo desde el oeste.
    expect(routeWaypoints[1]!.longitude).toBeCloseTo(-57.54, 5);
    expect(routeWaypoints[2]!.longitude).toBeCloseTo(-57.53, 5);
  });

  it("omite paradas sin ubicación conocida", () => {
    const { routeWaypoints, stops } = buildPlanRoute(base, [stop("ghost", 0)], branches);
    expect(routeWaypoints).toHaveLength(2);
    expect(stops[0]!.latitude).toBeUndefined();
  });
});
