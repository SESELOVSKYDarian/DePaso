import { Prisma, prisma } from "@depaso/database";
import { runInBackground } from "../http/background";

/**
 * Fotos de producto desde Open Food Facts, resueltas por EAN a demanda.
 *
 * El catálogo de SEPA no trae imágenes. El EAN sale del cuarto segmento de
 * `prices.sourceExternalId` (`id_comercio|id_bandera|id_sucursal|id_producto`). Se pide la foto
 * sólo de los resultados que se están mostrando, con presupuesto de tiempo corto: lo que no
 * llega a tiempo se termina de resolver en segundo plano (`runInBackground`) y aparece en la próxima
 * búsqueda. Lo resuelto — incluso "no hay foto" — se guarda en `Product` para no volver a pedir.
 */

const OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";
const USER_AGENT = "DePasoApp/0.1 (catalogo de precios; contacto: ver repositorio)";
const MAX_LOOKUPS = 12;
const CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 4000;
const RECHECK_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

type Lookup = { kind: "found"; url: string } | { kind: "missing" } | { kind: "error" };

async function lookupImage(ean: string): Promise<Lookup> {
  try {
    const response = await fetch(
      `${OFF_PRODUCT_URL}/${ean}.json?fields=image_front_small_url,image_front_url`,
      { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
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

async function runPool<T>(items: T[], size: number, task: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(size, queue.length) }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      await task(next);
    }
  });
  await Promise.all(workers);
}

/** `productId → url` para los productos que ya tienen o consiguen foto a tiempo. */
export async function loadProductImages(productIds: string[]): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  if (productIds.length === 0) return images;

  try {
    const rows = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, imageUrl: true, imageCheckedAt: true },
    });
    const staleBefore = Date.now() - RECHECK_AFTER_MS;
    const pending: string[] = [];
    for (const row of rows) {
      if (row.imageUrl) images.set(row.id, row.imageUrl);
      else if (!row.imageCheckedAt || row.imageCheckedAt.getTime() < staleBefore) pending.push(row.id);
    }
    const toResolve = pending.slice(0, MAX_LOOKUPS);
    // La respuesta NUNCA espera a Open Food Facts: se devuelve lo que ya está guardado y las
    // fotos que faltan se buscan después de responder, para la próxima búsqueda. Esperar acá
    // sumaba hasta ~2 segundos a cada búsqueda.
    if (toResolve.length > 0) runInBackground(() => resolveMissingImages(toResolve));
  } catch (error) {
    console.error("product images lookup failed", error);
  }
  return new Map(images);
}

/** Busca en segundo plano las fotos que faltan y las guarda en `Product`. */
async function resolveMissingImages(toResolve: string[]): Promise<void> {
  try {
    const eanRows = await prisma.$queryRaw<{ id: string; ean: string }[]>(Prisma.sql`
     SELECT v.productId AS id,
       MAX(SUBSTRING_INDEX(SUBSTRING_INDEX(pr.sourceExternalId, '|', 4), '|', -1)) AS ean
     FROM product_variants v
     JOIN prices pr ON pr.productVariantId = v.id
     WHERE v.productId IN (${Prisma.join(toResolve)})
       AND pr.sourceExternalId IS NOT NULL
       AND SUBSTRING_INDEX(SUBSTRING_INDEX(pr.sourceExternalId, '|', 4), '|', -1) REGEXP '^[0-9]{8,14}$'
     GROUP BY v.productId
    `);
    const eanByProduct = new Map(
     eanRows.filter((row) => /^\d{8,14}$/.test(row.ean)).map((row) => [row.id, row.ean] as const)
    );

    const work = runPool(toResolve, CONCURRENCY, async (productId) => {
     const ean = eanByProduct.get(productId);
     if (!ean) {
       await prisma.product.update({ where: { id: productId }, data: { imageCheckedAt: new Date() } });
       return;
     }
     const result = await lookupImage(ean);
     if (result.kind === "error") return; // 429/5xx/timeout: no cachear, reintenta la próxima
     await prisma.product.update({
       where: { id: productId },
       data: {
         imageUrl: result.kind === "found" ? result.url : null,
         imageCheckedAt: new Date(),
       },
     });
    }).catch(() => undefined);

    await work;
  } catch (error) {
    console.error("background image resolution failed", error);
  }
}
