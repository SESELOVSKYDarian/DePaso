import { Prisma, prisma } from "@depaso/database";
import { runInBackground } from "../http/background";
import { lookupImage } from "./imageLookup";

/**
 * Fotos de producto, resueltas por EAN a demanda (ver `imageLookup.ts` para las fuentes).
 *
 * El catálogo de SEPA no trae imágenes. El EAN sale del cuarto segmento de
 * `prices.sourceExternalId` (`id_comercio|id_bandera|id_sucursal|id_producto`). Se pide la foto
 * sólo de los resultados que se están mostrando: lo que falta se busca en segundo plano
 * (`runInBackground`) y aparece en la próxima búsqueda. Además `prefillProductImages` la va
 * completando por tandas desde un cron, empezando por los productos más populares.
 * Lo resuelto — incluso "no hay foto" — se guarda en `Product` para no volver a pedir.
 */

const MAX_LOOKUPS = 12;
const CONCURRENCY = 4;
const RECHECK_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

async function runPool<T>(items: T[], size: number, task: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(size, queue.length) }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      await task(next);
    }
  });
  await Promise.all(workers);
}

/** `productId → url` para los productos que ya tienen foto guardada; los que faltan se buscan después. */
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
    // La respuesta NUNCA espera a las bases de fotos: se devuelve lo que ya está guardado.
    if (toResolve.length > 0) runInBackground(() => resolveProductImages(toResolve));
  } catch (error) {
    console.error("product images lookup failed", error);
  }
  return new Map(images);
}

/** Busca las fotos de estos productos y las guarda en `Product`. Devuelve cuántas encontró. */
export async function resolveProductImages(productIds: string[]): Promise<number> {
  let found = 0;
  try {
    const eanRows = await prisma.$queryRaw<{ id: string; ean: string }[]>(Prisma.sql`
     SELECT v.productId AS id,
       MAX(SUBSTRING_INDEX(SUBSTRING_INDEX(pr.sourceExternalId, '|', 4), '|', -1)) AS ean
     FROM product_variants v
     JOIN prices pr ON pr.productVariantId = v.id
     WHERE v.productId IN (${Prisma.join(productIds)})
       AND pr.sourceExternalId IS NOT NULL
       AND SUBSTRING_INDEX(SUBSTRING_INDEX(pr.sourceExternalId, '|', 4), '|', -1) REGEXP '^[0-9]{8,14}$'
     GROUP BY v.productId
    `);
    const eanByProduct = new Map(
      eanRows.filter((row) => /^\d{8,14}$/.test(row.ean)).map((row) => [row.id, row.ean] as const)
    );

    await runPool(productIds, CONCURRENCY, async (productId) => {
      const ean = eanByProduct.get(productId);
      if (!ean) {
        await prisma.product.update({ where: { id: productId }, data: { imageCheckedAt: new Date() } });
        return;
      }
      const result = await lookupImage(ean);
      if (result.kind === "error") return; // caída pasajera: no se guarda, se reintenta
      if (result.kind === "found") found++;
      await prisma.product.update({
        where: { id: productId },
        data: { imageUrl: result.kind === "found" ? result.url : null, imageCheckedAt: new Date() },
      });
    }).catch(() => undefined);
  } catch (error) {
    console.error("image resolution failed", error);
  }
  return found;
}

/**
 * Completa fotos por tandas: toma los productos más populares que todavía no se revisaron.
 * Lo corre el cron (cada hora alcanza para ir cubriendo el catálogo sin castigar a las bases
 * abiertas, que piden un uso moderado).
 */
export async function prefillProductImages(batchSize: number): Promise<{ checked: number; found: number }> {
  const rows = await prisma.product.findMany({
    where: { imageUrl: null, imageCheckedAt: null },
    orderBy: { popularity: "desc" },
    select: { id: true },
    take: batchSize,
  });
  const ids = rows.map((row: (typeof rows)[number]) => row.id);
  if (ids.length === 0) return { checked: 0, found: 0 };
  return { checked: ids.length, found: await resolveProductImages(ids) };
}
