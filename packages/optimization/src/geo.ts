import type { LatLng } from "@depaso/domain";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distancia en línea recta entre dos puntos (fórmula de Haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_METERS * c;
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

/** Distancia mínima de un punto a un segmento (proyección local, suficiente a escala de ciudad). */
function pointToSegmentMeters(point: LatLng, from: LatLng, to: LatLng): number {
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos(toRadians(point.latitude));
  const ax = (from.longitude - point.longitude) * metersPerDegLng;
  const ay = (from.latitude - point.latitude) * metersPerDegLat;
  const bx = (to.longitude - point.longitude) * metersPerDegLng;
  const by = (to.latitude - point.latitude) * metersPerDegLat;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

/** Qué tan lejos queda un punto de un recorrido (lista de puntos), en metros. */
export function distanceToPathMeters(point: LatLng, path: LatLng[]): number {
  if (path.length === 0) return Number.POSITIVE_INFINITY;
  if (path.length === 1) return haversineMeters(point, path[0]!);
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < path.length; i += 1) {
    best = Math.min(best, pointToSegmentMeters(point, path[i - 1]!, path[i]!));
  }
  return best;
}
