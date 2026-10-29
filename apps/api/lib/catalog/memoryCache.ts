/**
 * Caché en memoria de búsquedas y facetas: el catálogo cambia una vez por día (import de SEPA)
 * y la misma caja ("Gaseosas") la abren muchas personas. Diez minutos alcanzan y evitan que
 * cada toque vuelva a recorrer la base. Vive por instancia de la función, no se comparte.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 400;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

/** Guarda el resultado 10 minutos en memoria (hasta 400 consultas) para no repetir la búsqueda. */
export function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  // Si falla no se guarda: el próximo intento vuelve a consultar.
  value.catch(() => cache.delete(key));
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  return value;
}
