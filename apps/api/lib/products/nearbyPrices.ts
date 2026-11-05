import type { NearbyPrice } from "@depaso/validation";

/** Cuánto más caro que el más barato todavía se considera "igual de barato". */
const CHEAP_TOLERANCE = 1.08;
const MAX_OPTIONS = 3;

/**
 * Ordena las opciones para quien se quedó sin un producto: primero la más cercana entre las que
 * están casi tan baratas como la más barata (diferencia de hasta 8 %); después las demás, de menor
 * a mayor precio. Devuelve pocas, para que se entienda de un vistazo.
 */
export function rankNearbyOptions(options: NearbyPrice[], limit: number = MAX_OPTIONS): NearbyPrice[] {
  if (options.length === 0) return [];
  const cheapest = Math.min(...options.map((option) => option.unitPrice));
  const cheapEnough = options.filter((option) => option.unitPrice <= cheapest * CHEAP_TOLERANCE).sort((a, b) => a.distanceMeters - b.distanceMeters);
  const best = cheapEnough[0]!;
  const rest = options.filter((option) => option.branchId !== best.branchId).sort((a, b) => a.unitPrice - b.unitPrice || a.distanceMeters - b.distanceMeters);
  return [best, ...rest].slice(0, limit);
}