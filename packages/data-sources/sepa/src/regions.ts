import type { MarketRegionConfig } from "@depaso/geo";

/**
 * Mar del Plata — alcance de lanzamiento (sección 42/62). Bounding box calibrado contra
 * sucursales reales del feed SEPA (COTO 238, Toledo, Vea/Disco — ver docs/data/SEPA.md),
 * no un valor inventado. `localityAliases` cubre el casing inconsistente visto en el feed
 * real ("Mar del Plata" / "MAR DEL PLATA" / "Mar Del Plata").
 */
export const MAR_DEL_PLATA_REGION: MarketRegionConfig = {
  slug: "mar-del-plata",
  name: "Mar del Plata",
  province: "Buenos Aires",
  minLatitude: -38.15,
  maxLatitude: -37.9,
  minLongitude: -57.65,
  maxLongitude: -57.45,
  localityAliases: ["Mar del Plata", "MAR DEL PLATA", "Mar Del Plata", "mar del plata"],
};
