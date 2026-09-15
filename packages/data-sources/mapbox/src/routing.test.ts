import { afterEach, describe, expect, it, vi } from "vitest";
import { createMapboxRouteProvider, MapboxRouteError } from "./routing";

// Forma real de la respuesta de Mapbox Directions v5 (confirmado contra la documentación
// oficial) — no un fixture inventado al azar.
const REAL_SHAPE_DIRECTIONS_RESPONSE = {
  code: "Ok",
  routes: [
    {
      geometry: "ss{cE~{fnG_@bAmDlG",
      legs: [{ distance: 3542.1, duration: 421.5 }],
      distance: 3542.1,
      duration: 421.5,
      weight_name: "routability",
    },
  ],
  waypoints: [
    { name: "Av. Constitución", location: [-57.5575, -38.0023] },
    { name: "Av. Colón", location: [-57.5486, -37.9946] },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createMapboxRouteProvider", () => {
  const waypoints = [
    { latitude: -38.0023, longitude: -57.5575 },
    { latitude: -37.9946, longitude: -57.5486 },
  ];

  it("computeRoute: convierte distancia/duración/geometría reales de Mapbox", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => REAL_SHAPE_DIRECTIONS_RESPONSE });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createMapboxRouteProvider("pk.test-token");
    const result = await provider.computeRoute(waypoints, "CAR");

    expect(result).toEqual({
      distanceMeters: 3542.1,
      durationSeconds: 421.5,
      orderedWaypoints: waypoints,
      polyline: "ss{cE~{fnG_@bAmDlG",
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/directions/v5/mapbox/driving/"));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("-57.5575,-38.0023;-57.5486,-37.9946"));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("access_token=pk.test-token"));
  });

  it("computeRoute: usa el perfil cycling para BICYCLE y walking para WALK", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => REAL_SHAPE_DIRECTIONS_RESPONSE });
    vi.stubGlobal("fetch", fetchMock);
    const provider = createMapboxRouteProvider("pk.test-token");

    await provider.computeRoute(waypoints, "BICYCLE");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/cycling/"));

    await provider.computeRoute(waypoints, "WALK");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/walking/"));
  });

  it("computeRoute: PUBLIC_TRANSPORT no tiene perfil real — lanza en vez de aproximar mal", async () => {
    const provider = createMapboxRouteProvider("pk.test-token");
    await expect(provider.computeRoute(waypoints, "PUBLIC_TRANSPORT")).rejects.toThrow(MapboxRouteError);
  });

  it("computeRoute: menos de 2 waypoints, lanza", async () => {
    const provider = createMapboxRouteProvider("pk.test-token");
    await expect(provider.computeRoute([waypoints[0]!], "CAR")).rejects.toThrow(MapboxRouteError);
  });

  it("computeRoute: sin rutas encontradas, lanza en vez de inventar una", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ routes: [] }) }));
    const provider = createMapboxRouteProvider("pk.test-token");
    await expect(provider.computeRoute(waypoints, "CAR")).rejects.toThrow(MapboxRouteError);
  });

  it("computeRoute: HTTP no-ok, lanza con el status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const provider = createMapboxRouteProvider("pk.invalid");
    await expect(provider.computeRoute(waypoints, "CAR")).rejects.toThrow(/401/);
  });
});
