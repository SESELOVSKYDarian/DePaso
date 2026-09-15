import { normalizeLocality } from "./normalize";
import type { GeoClassification, MarketRegionConfig } from "./types";

export interface GeoScopeService {
  isInsideBoundingBox(latitude: number, longitude: number): boolean;
  matchesLocality(rawLocality: string): boolean;
  /**
   * Clasifica una sucursal contra la región (sección 16). Las coordenadas tienen
   * prioridad para decidir "adentro/afuera" (sección 15); la localidad es la señal
   * secundaria — si contradicen a las coordenadas, `hasDiscrepancy` avisa para que el
   * caller registre un `BranchDataIssue` en vez de decidir solo.
   */
  classify(latitude: number | null, longitude: number | null, rawLocality: string): GeoClassification;
}

/**
 * Sección 16 — `GeoScopeService`. Puro: recibe la config de `MarketRegion` (cargada de
 * Prisma por el caller), no la lee de la DB ni la hardcodea acá.
 */
export function createGeoScopeService(region: MarketRegionConfig): GeoScopeService {
  const normalizedAliases = new Set(region.localityAliases.map(normalizeLocality));

  function isInsideBoundingBox(latitude: number, longitude: number): boolean {
    return (
      latitude >= region.minLatitude &&
      latitude <= region.maxLatitude &&
      longitude >= region.minLongitude &&
      longitude <= region.maxLongitude
    );
  }

  function matchesLocality(rawLocality: string): boolean {
    return normalizedAliases.has(normalizeLocality(rawLocality));
  }

  function classify(latitude: number | null, longitude: number | null, rawLocality: string): GeoClassification {
    const insideBoundingBox = latitude !== null && longitude !== null && isInsideBoundingBox(latitude, longitude);
    const localityMatch = matchesLocality(rawLocality);
    const hasCoordinates = latitude !== null && longitude !== null;

    let matchedBy: GeoClassification["matchedBy"] = "none";
    if (insideBoundingBox && localityMatch) matchedBy = "both";
    else if (insideBoundingBox) matchedBy = "coordinates";
    else if (localityMatch) matchedBy = "locality";

    // Sólo hay discrepancia real si tenemos ambas señales y se contradicen — sin
    // coordenadas (frecuente en el feed real, sección 5) no hay nada que contradecir.
    const hasDiscrepancy = hasCoordinates && insideBoundingBox !== localityMatch;

    return { insideBoundingBox, matchesLocality: localityMatch, matchedBy, hasDiscrepancy };
  }

  return { isInsideBoundingBox, matchesLocality, classify };
}
