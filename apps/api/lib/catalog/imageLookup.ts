/**
 * Busca la foto de un producto por EAN en las bases abiertas de la familia Open Food Facts.
 * Todas hablan el mismo idioma; cambia solo el sitio:
 * - Open Food Facts: comida y bebida;
 * - Open Beauty Facts: limpieza personal y cosmética;
 * - Open Products Facts: el resto (hogar, limpieza, etc.).
 */

const SOURCES = [
  "https://world.openfoodfacts.org",
  "https://world.openbeautyfacts.org",
  "https://world.openproductsfacts.org",
];
const USER_AGENT = "DePasoApp/0.1 (catalogo de precios; contacto: ver repositorio)";
const REQUEST_TIMEOUT_MS = 4000;

export type Lookup = { kind: "found"; url: string } | { kind: "missing" } | { kind: "error" };

/** Pregunta en un solo sitio. */
async function lookupInSource(source: string, ean: string): Promise<Lookup> {
  try {
    const response = await fetch(`${source}/api/v2/product/${ean}.json?fields=image_front_small_url,image_front_url`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status === 404) return { kind: "missing" };
    if (!response.ok) return { kind: "error" };
    const body = (await response.json()) as {
      product?: { image_front_small_url?: string; image_front_url?: string };
    };
    const url = body.product?.image_front_small_url ?? body.product?.image_front_url;
    return url ? { kind: "found", url } : { kind: "missing" };
  } catch {
    return { kind: "error" };
  }
}

/**
 * Prueba los sitios en orden y se queda con la primera foto. Si ninguno la tiene pero alguno
 * falló, devuelve "error" (no se guarda "sin foto" por una caída pasajera).
 */
export async function lookupImage(ean: string): Promise<Lookup> {
  let anyError = false;
  for (const source of SOURCES) {
    const result = await lookupInSource(source, ean);
    if (result.kind === "found") return result;
    if (result.kind === "error") anyError = true;
  }
  return anyError ? { kind: "error" } : { kind: "missing" };
}
