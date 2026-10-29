/**
 * "De paso": qué comercios quedan cerca del recorrido y cuánto hay que desviarse para pasar.
 * Cálculo geométrico (sin llamar al ruteo por cada comercio): la ruta se trata como una
 * secuencia de puntos y el desvío de un comercio es lo que se agrega al ir de un punto al
 * comercio y de ahí al siguiente, en lugar de ir directo — el mismo criterio de "inserción
 * más barata" del motor de optimización, más un factor por las calles que no son rectas.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface BranchPoint extends LatLng {
  branchId: string;
  storeName: string;
  branchName: string;
  address: string;
}

export interface NearbyBranch extends BranchPoint {
  detourMeters: number;
  detourSeconds: number;
  distanceFromRouteMeters: number;
}

const EARTH_RADIUS_METERS = 6_371_000;
/** Las calles no van en línea recta: se infla la distancia aérea. */
const ROAD_FACTOR = 1.3;
/** Velocidad urbana media (≈ 24 km/h con semáforos y paradas) para pasar el desvío a tiempo. */
const URBAN_SPEED_MPS = 6.7;
/** Entre puntos de la ruta separados más que esto se insertan puntos intermedios. */
const MAX_GAP_METERS = 60;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Decodifica una polyline de precisión 5 (la que devuelve Mapbox Directions). */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of ["lat", "lng"] as const) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === "lat") lat += delta;
      else lng += delta;
    }
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

/** Rellena los tramos largos con puntos intermedios para que "el punto más cercano" sea fiel. */
export function densify(path: LatLng[]): LatLng[] {
  if (path.length < 2) return path;
  const dense: LatLng[] = [path[0]!];
  for (let i = 1; i < path.length; i += 1) {
    const from = path[i - 1]!;
    const to = path[i]!;
    const steps = Math.ceil(haversine(from, to) / MAX_GAP_METERS);
    for (let step = 1; step < steps; step += 1) {
      const t = step / steps;
      dense.push({
        latitude: from.latitude + (to.latitude - from.latitude) * t,
        longitude: from.longitude + (to.longitude - from.longitude) * t,
      });
    }
    dense.push(to);
  }
  return dense;
}

/** Caja que contiene la ruta, ensanchada por el desvío máximo (para filtrar en la base). */
export function boundingBox(path: LatLng[], marginMeters: number) {
  const lats = path.map((p) => p.latitude);
  const lngs = path.map((p) => p.longitude);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const latMargin = marginMeters / 111_000;
  const lngMargin = marginMeters / (111_000 * Math.max(0.2, Math.cos(toRadians(midLat))));
  return {
    minLat: Math.min(...lats) - latMargin,
    maxLat: Math.max(...lats) + latMargin,
    minLng: Math.min(...lngs) - lngMargin,
    maxLng: Math.max(...lngs) + lngMargin,
  };
}

/**
 * Ordena por desvío los comercios que quedan dentro de `maxDetourMeters`. `path` es la ruta
 * (polyline decodificada o, si no hay, los waypoints).
 */
export function findStoresAlongRoute(path: LatLng[], branches: BranchPoint[], maxDetourMeters: number): NearbyBranch[] {
  if (path.length < 2) return [];
  const dense = densify(path);
  // Pares consecutivos: se precalcula el largo del tramo directo.
  const segments = dense.slice(1).map((to, i) => ({ from: dense[i]!, to, direct: haversine(dense[i]!, to) }));

  const found: NearbyBranch[] = [];
  for (const branch of branches) {
    let bestExtra = Infinity;
    let bestPerpendicular = Infinity;
    for (const segment of segments) {
      const toStore = haversine(segment.from, branch);
      const fromStore = haversine(branch, segment.to);
      const extra = toStore + fromStore - segment.direct;
      if (extra < bestExtra) bestExtra = extra;
      bestPerpendicular = Math.min(bestPerpendicular, toStore, fromStore);
    }
    const detourMeters = Math.round(Math.max(0, bestExtra) * ROAD_FACTOR);
    if (detourMeters > maxDetourMeters) continue;
    found.push({
      ...branch,
      detourMeters,
      detourSeconds: Math.round(detourMeters / URBAN_SPEED_MPS),
      distanceFromRouteMeters: Math.round(bestPerpendicular),
    });
  }
  return found.sort((a, b) => a.detourMeters - b.detourMeters);
}
