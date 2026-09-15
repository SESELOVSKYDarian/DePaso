import { describe, expect, it } from "vitest";
import { createGeoScopeService } from "./scope";
import type { MarketRegionConfig } from "./types";

/** Bounding box de Mar del Plata calibrado contra sucursales reales de SEPA (COTO,
 * Toledo, Vea/Disco — ver docs/data/SEPA.md) — no un valor inventado. */
const MAR_DEL_PLATA: MarketRegionConfig = {
  slug: "mar-del-plata",
  name: "Mar del Plata",
  province: "Buenos Aires",
  minLatitude: -38.15,
  maxLatitude: -37.9,
  minLongitude: -57.65,
  maxLongitude: -57.45,
  localityAliases: ["Mar del Plata", "MAR DEL PLATA", "Mar Del Plata", "mar del plata"],
};

describe("GeoScopeService — Mar del Plata", () => {
  const geo = createGeoScopeService(MAR_DEL_PLATA);

  it("acepta coordenadas reales de sucursales confirmadas (COTO 238, Toledo, Disco)", () => {
    expect(geo.isInsideBoundingBox(-38.07935, -57.58334)).toBe(true); // COTO 238
    expect(geo.isInsideBoundingBox(-37.9532482, -57.5532565)).toBe(true); // Toledo Estrada
    expect(geo.isInsideBoundingBox(-37.96, -57.5668)).toBe(true); // Disco Constitución
  });

  it("rechaza coordenadas fuera de Mar del Plata (CABA)", () => {
    expect(geo.isInsideBoundingBox(-34.6037, -58.3816)).toBe(false);
  });

  it("normaliza variantes de localidad vistas en el feed real", () => {
    expect(geo.matchesLocality("MAR DEL PLATA")).toBe(true);
    expect(geo.matchesLocality("mar del plata")).toBe(true);
    expect(geo.matchesLocality("Mar Del Plata")).toBe(true);
    expect(geo.matchesLocality("General Pueyrredón")).toBe(false);
  });

  it("classify: coordenadas y localidad de acuerdo, sin discrepancia", () => {
    const result = geo.classify(-38.07935, -57.58334, "MAR DEL PLATA");
    expect(result.matchedBy).toBe("both");
    expect(result.hasDiscrepancy).toBe(false);
  });

  it("classify: localidad dice MDP pero coordenadas caen en Batán (fuera de la caja) — discrepancia", () => {
    const result = geo.classify(-37.92, -57.71, "mar del plata");
    expect(result.insideBoundingBox).toBe(false);
    expect(result.matchesLocality).toBe(true);
    expect(result.hasDiscrepancy).toBe(true);
  });

  it("classify: sin coordenadas (longitud faltante, frecuente en el feed real) — usa sólo localidad, sin discrepancia forzada", () => {
    const result = geo.classify(null, null, "Mar del Plata");
    expect(result.matchedBy).toBe("locality");
    expect(result.hasDiscrepancy).toBe(false);
  });
});
