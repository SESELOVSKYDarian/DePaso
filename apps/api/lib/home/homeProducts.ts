import { Prisma, prisma } from "@depaso/database";
import type { HomeProduct } from "@depaso/validation";
import { prettifyProductName } from "../catalog/productNames";

/** Cuántos productos se muestran en cada tira de Inicio. */
const MAX_PRODUCTS = 8;
/** Un producto está "barato" si su precio más bajo es al menos 15% menor al promedio... */
const CHEAP_FACTOR = 0.85;
/** ...pero si es menos de 30% del promedio casi seguro es un precio mal cargado, no una oferta. */
const SUSPICIOUS_FACTOR = 0.3;
/** Para comparar hacen falta al menos 3 precios del mismo producto. */
const MIN_PRICES_TO_COMPARE = 3;
/** Estas listas no dependen del usuario: se guardan 30 minutos para no recalcular en cada visita. */
const CACHE_TTL_MS = 30 * 60 * 1000;

interface ProductRow {
  productId: string;
  productName: string;
  brandName: string | null;
  imageUrl: string | null;
  storeName: string;
  minPrice: number;
  avgPrice: number;
}

const cache = new Map<string, { at: number; value: HomeProduct[] }>();

/** Vacía la caché (lo usan las pruebas). */
export function clearHomeProductsCache(): void {
  cache.clear();
}

/**
 * Para cada producto: su precio más bajo (y en qué comercio) y el promedio de todos sus precios.
 * Es la base de las dos tiras: los baratos (mucho menos que el promedio) y los más buscados.
 */
async function queryProducts(filter: Prisma.Sql, order: Prisma.Sql): Promise<ProductRow[]> {
  return prisma.$queryRaw<ProductRow[]>(Prisma.sql`
    SELECT t.productId, t.productName, t.brandName, t.imageUrl, t.storeName, t.minPrice, t.avgPrice
    FROM (
      SELECT
        v.productId AS productId,
        p.name AS productName,
        b.name AS brandName,
        p.imageUrl AS imageUrl,
        s.name AS storeName,
        p.popularity AS popularity,
        CAST(pr.price AS DOUBLE) AS minPrice,
        CAST(AVG(pr.price) OVER (PARTITION BY v.productId) AS DOUBLE) AS avgPrice,
        COUNT(*) OVER (PARTITION BY v.productId) AS n,
        ROW_NUMBER() OVER (PARTITION BY v.productId ORDER BY pr.price ASC) AS position
      FROM prices pr
      JOIN product_variants v ON v.id = pr.productVariantId
      JOIN products p ON p.id = v.productId
      LEFT JOIN brands b ON b.id = p.brandId
      JOIN store_branches sb ON sb.id = pr.storeBranchId
      JOIN stores s ON s.id = sb.storeId
      WHERE pr.status <> 'STALE' AND pr.price > 0
    ) t
    WHERE t.position = 1 AND t.n >= ${MIN_PRICES_TO_COMPARE} ${filter}
    ORDER BY ${order}
    LIMIT ${MAX_PRODUCTS}
  `);
}

/** Pasa una fila de la base al formato que se manda a la app. */
function toHomeProduct(row: ProductRow): HomeProduct {
  const saving = row.avgPrice > 0 ? (1 - row.minPrice / row.avgPrice) * 100 : 0;
  return {
    productId: row.productId,
    name: prettifyProductName(row.productName),
    brandName: row.brandName,
    imageUrl: row.imageUrl,
    storeName: row.storeName,
    price: row.minPrice,
    averagePrice: Math.round(row.avgPrice * 100) / 100,
    savingPercent: Math.round(saving),
  };
}

/** Guarda el resultado de una consulta 30 minutos. */
async function cached(key: string, load: () => Promise<ProductRow[]>): Promise<HomeProduct[]> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const value = (await load()).map(toHomeProduct);
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** "Barato hoy": productos cuyo precio más bajo está bien por debajo del promedio, los más ahorro primero. */
export function loadCheapProducts(): Promise<HomeProduct[]> {
  return cached("cheap", () =>
    queryProducts(
      Prisma.sql`AND t.minPrice <= t.avgPrice * ${CHEAP_FACTOR} AND t.minPrice >= t.avgPrice * ${SUSPICIOUS_FACTOR}`,
      Prisma.sql`(1 - t.minPrice / t.avgPrice) DESC, t.popularity DESC`,
    ),
  );
}

/** "Recomendados": los productos más buscados, con su mejor precio. */
export function loadPopularProducts(): Promise<HomeProduct[]> {
  return cached("popular", () => queryProducts(Prisma.empty, Prisma.sql`t.popularity DESC, t.n DESC`));
}
