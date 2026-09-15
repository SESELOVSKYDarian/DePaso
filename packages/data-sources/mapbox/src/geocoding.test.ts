import { afterEach, describe, expect, it, vi } from "vitest";
import { createMapboxGeocodingProvider, MapboxGeocodingError } from "./geocoding";

// Forma real de la respuesta de Mapbox Geocoding v6 (confirmado contra la documentación
// oficial) — no un fixture inventado al azar.
const REAL_SHAPE_FORWARD_RESPONSE = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-57.5575, -38.0023] },
      properties: { full_address: "Av. Constitución 5000, Mar del Plata, Buenos Aires, Argentina", name: "Av. Constitución 5000" },
    },
  ],
};

const REAL_SHAPE_REVERSE_RESPONSE = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-57.5575, -38.0023] },
      properties: { full_address: "Av. Constitución 5000, Mar del Plata, Buenos Aires, Argentina", name: "Av. Constitución 5000" },
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createMapboxGeocodingProvider", () => {
  it("geocode: convierte una dirección real a lat/lng (lee coordinates como [lon, lat])", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => REAL_SHAPE_FORWARD_RESPONSE });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createMapboxGeocodingProvider("pk.test-token");
    const result = await provider.geocode("Av. Constitución 5000, Mar del Plata");

    expect(result).toEqual({ latitude: -38.0023, longitude: -57.5575 });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("access_token=pk.test-token"));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/forward?q="));
  });

  it("reverseGeocode: convierte lat/lng a una dirección real", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => REAL_SHAPE_REVERSE_RESPONSE });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createMapboxGeocodingProvider("pk.test-token");
    const result = await provider.reverseGeocode({ latitude: -38.0023, longitude: -57.5575 });

    expect(result).toBe("Av. Constitución 5000, Mar del Plata, Buenos Aires, Argentina");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/reverse?longitude=-57.5575&latitude=-38.0023"));
  });

  it("geocode: sin resultados, lanza en vez de devolver coordenadas inventadas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) }));

    const provider = createMapboxGeocodingProvider("pk.test-token");
    await expect(provider.geocode("dirección que no existe en ningún lado")).rejects.toThrow(MapboxGeocodingError);
  });

  it("geocode: HTTP no-ok, lanza con el status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    const provider = createMapboxGeocodingProvider("pk.invalid");
    await expect(provider.geocode("cualquier dirección")).rejects.toThrow(/401/);
  });
});
