import { MAR_DEL_PLATA_SCOPE } from "@depaso/data-sources-mapbox";

/** Qué tipo de lugar es un resultado: comercio o punto de interés, calle con número, barrio o ciudad. */
export type PlaceSuggestionKind = "poi" | "address" | "neighborhood" | "place";

/** Un resultado del buscador de lugares (como las sugerencias de Google Maps). */
export interface PlaceSuggestion {
  id: string;
  /** Nombre corto: "Shell", "Av. Colón 1234". */
  name: string;
  /** Resto de la dirección: "Avenida Juan B. Justo 4287, Santa Mónica, Mar del Plata". */
  address: string;
  latitude: number;
  longitude: number;
  kind: PlaceSuggestionKind;
}

export class PlaceSearchError extends Error {}

/** Forma real de un resultado de Photon (buscador de OpenStreetMap). */
interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [longitud, latitud]
  properties: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    suburb?: string;
    city?: string;
  };
}

/** Servidor de búsqueda. Se puede apuntar a uno propio con `PHOTON_URL`. */
const DEFAULT_URL = "https://photon.komoot.io/api/";
/** Claves de OpenStreetMap que son comercios o lugares con nombre propio. */
const POI_KEYS = ["amenity", "shop", "tourism", "leisure", "office", "healthcare", "craft", "sport"];
const NEIGHBORHOOD_VALUES = ["suburb", "neighbourhood", "quarter", "district", "hamlet"];

function toKind(p: PhotonFeature["properties"]): PlaceSuggestionKind {
  if (p.osm_key && POI_KEYS.includes(p.osm_key)) return "poi";
  if (p.housenumber || p.osm_value === "house_number" || p.osm_key === "highway") return "address";
  if (p.osm_value && NEIGHBORHOOD_VALUES.includes(p.osm_value)) return "neighborhood";
  return "place";
}

/** Convierte un resultado de Photon en una sugerencia lista para mostrar. */
function toSuggestion(feature: PhotonFeature): PlaceSuggestion {
  const p = feature.properties;
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const name = p.name ?? (street || "Lugar sin nombre");
  // Si el lugar tiene nombre ("Shell"), la calle va en la dirección; si no, el nombre ya es la calle.
  const lines = [p.name ? street : "", p.district ?? p.suburb, p.city].filter((line): line is string => Boolean(line));
  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    id: `${p.osm_type ?? "x"}${p.osm_id ?? `${latitude},${longitude}`}`,
    name,
    address: lines.join(", "),
    latitude,
    longitude,
    kind: toKind(p),
  };
}

/** Saca resultados repetidos (mismo nombre y misma dirección). */
function unique(list: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const key = `${item.name}|${item.address}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Las búsquedas repetidas se guardan 10 minutos: es más rápido y cuida al servicio gratuito. */
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 300;
const cache = new Map<string, { at: number; value: PlaceSuggestion[] }>();

/** Vacía la caché (lo usan las pruebas). */
export function clearPlaceSearchCache(): void {
  cache.clear();
}

/** Clave de caché: texto normalizado + posición redondeada (unos 100 m). */
function cacheKey(query: string, near?: { latitude: number; longitude: number }): string {
  const where = near ? `${near.latitude.toFixed(3)},${near.longitude.toFixed(3)}` : "";
  return `${query.trim().toLowerCase()}|${where}`;
}

/**
 * Busca lugares con autocompletado, como Google Maps: comercios ("Shell", "Coto"), escuelas
 * ("Técnica 5"), hospitales, calles con número y barrios. Usa Photon, el buscador gratuito de
 * OpenStreetMap, limitado a la zona de lanzamiento; `near` hace que salgan primero los más cercanos.
 */
export async function searchPlaces(query: string, near?: { latitude: number; longitude: number }): Promise<PlaceSuggestion[]> {
  const key = cacheKey(query, near);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = await searchOnline(query, near);
  cache.set(key, { at: Date.now(), value });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  return value;
}

/** Hace la consulta al buscador (sin caché). */
async function searchOnline(query: string, near?: { latitude: number; longitude: number }): Promise<PlaceSuggestion[]> {
  const [centerLon, centerLat] = MAR_DEL_PLATA_SCOPE.proximity.split(",").map(Number) as [number, number];
  const params = new URLSearchParams({
    q: query,
    limit: "10",
    lat: String(near?.latitude ?? centerLat),
    lon: String(near?.longitude ?? centerLon),
    bbox: MAR_DEL_PLATA_SCOPE.bbox,
    location_bias_scale: "0.4",
  });
  const response = await fetch(`${process.env.PHOTON_URL ?? DEFAULT_URL}?${params.toString()}`, {
    headers: { "User-Agent": "DePaso/1.0 (buscador de lugares de la app DePaso)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new PlaceSearchError(`Buscador de lugares -> HTTP ${response.status}`);
  const json = (await response.json()) as { features?: PhotonFeature[] };
  return unique((json.features ?? []).map(toSuggestion)).slice(0, 8);
}
