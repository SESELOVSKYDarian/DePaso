import { afterEach, describe, expect, it, vi } from "vitest";
import { PlaceSearchError, searchPlaces } from "./placeSearch";

// Forma real de la respuesta de Photon: una estación de servicio y una dirección.
const RESPONSE = {
  features: [
    {
      geometry: { coordinates: [-57.5575, -38.0023] },
      properties: {
        osm_id: 111, osm_type: "N", osm_key: "amenity", osm_value: "fuel", name: "Shell",
        street: "Avenida Colón", housenumber: "5786", district: "Los Andes", city: "Mar del Plata",
      },
    },
    {
      geometry: { coordinates: [-57.55, -38.0] },
      properties: { osm_id: 222, osm_type: "N", osm_key: "place", osm_value: "house_number", street: "Avenida Colón", housenumber: "1234", district: "Centro", city: "Mar del Plata" },
    },
    {
      // repetido: mismo nombre y misma dirección que el primero
      geometry: { coordinates: [-57.5575, -38.0023] },
      properties: { osm_id: 333, osm_type: "W", osm_key: "amenity", osm_value: "fuel", name: "Shell", street: "Avenida Colón", housenumber: "5786", district: "Los Andes", city: "Mar del Plata" },
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchPlaces", () => {
  it("devuelve comercios con su dirección y las calles con número", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => RESPONSE }));
    const results = await searchPlaces("shell");

    expect(results[0]).toEqual({
      id: "N111",
      name: "Shell",
      address: "Avenida Colón 5786, Los Andes, Mar del Plata",
      latitude: -38.0023,
      longitude: -57.5575,
      kind: "poi",
    });
    expect(results[1]).toMatchObject({ name: "Avenida Colón 1234", address: "Centro, Mar del Plata", kind: "address" });
  });

  it("saca los resultados repetidos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => RESPONSE }));
    expect(await searchPlaces("shell")).toHaveLength(2);
  });

  it("limita la búsqueda a la zona de lanzamiento", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    await searchPlaces("técnica 5");

    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.searchParams.get("q")).toBe("técnica 5");
    expect(url.searchParams.get("bbox")).toBe("-57.95,-38.30,-57.30,-37.80");
  });

  it("usa la posición del usuario para ordenar por cercanía", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    await searchPlaces("shell", { latitude: -38.01, longitude: -57.56 });

    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.searchParams.get("lat")).toBe("-38.01");
    expect(url.searchParams.get("lon")).toBe("-57.56");
  });

  it("falla con un error propio si el buscador responde con error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(searchPlaces("shell")).rejects.toBeInstanceOf(PlaceSearchError);
  });
});
