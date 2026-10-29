import { Prisma, prisma } from "@depaso/database";
import type { ActivityItem } from "@depaso/validation";
import { listAccessWhere } from "../lists/lists";
import { loadPriceChanges } from "../home/priceChanges";
import { prettifyProductName } from "../catalog/productNames";

const SHARED_WINDOW_DAYS = 30;
const MAX_ITEMS = 25;
/** Cuántos metros de un lugar tuyo se considera "cerca". */
const NEARBY_METERS = 1500;
/** Cuánto más barato que el promedio tiene que estar para avisar. */
const CHEAP_FACTOR = 0.88;
/** Por debajo de esto es casi seguro un error de carga, no una oferta. */
const IMPLAUSIBLE_FACTOR = 0.3;

const pesos = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;

interface NearbyRow {
  productId: string;
  productName: string;
  storeName: string;
  branchName: string;
  price: number;
  average: number;
  meters: number;
}

/** Listas que alguien compartió con vos en el último mes. */
async function sharedListItems(userId: string, now: Date): Promise<ActivityItem[]> {
  const since = new Date(now.getTime() - SHARED_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const memberships = await prisma.shoppingListMember.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { shoppingList: { select: { id: true, name: true, user: { select: { displayName: true } } } } },
  });
  return memberships.map((member: (typeof memberships)[number]) => ({
    id: `shared-${member.id}`,
    type: "LIST_SHARED" as const,
    title: `${member.shoppingList.user.displayName ?? "Alguien"} compartió una lista con vos`,
    detail: `"${member.shoppingList.name}": abrila para ver qué falta comprar.`,
    at: member.createdAt.toISOString(),
    listId: member.shoppingList.id,
  }));
}

/** Productos de tus listas que bajaron de precio estos días. */
async function priceDropItems(productIds: string[], now: Date): Promise<ActivityItem[]> {
  const changes = await loadPriceChanges(productIds, now, 20);
  return changes
    .filter((change) => change.changePercent < 0)
    .map((change) => ({
      id: `drop-${change.productId}`,
      type: "PRICE_DROP" as const,
      title: `Bajó ${change.productName}`,
      detail: `${change.storeName}: ${pesos(change.previousPrice)} → ${pesos(change.currentPrice)} (${change.changePercent}%).`,
      at: null,
      listId: null,
    }));
}

/**
 * Productos de tus listas que están baratos en un comercio cerca de alguno de tus lugares
 * (casa, trabajo…): mucho más baratos que el promedio y a menos de 1,5 km.
 */
async function cheapNearbyItems(userId: string, productIds: string[]): Promise<ActivityItem[]> {
  if (productIds.length === 0) return [];
  const rows = await prisma.$queryRaw<NearbyRow[]>(Prisma.sql`
    SELECT v.productId AS productId, p.name AS productName, s.name AS storeName, sb.name AS branchName,
           CAST(pr.price AS DOUBLE) AS price, CAST(avgp.average AS DOUBLE) AS average,
           MIN(ST_Distance_Sphere(POINT(sb.longitude, sb.latitude), POINT(up.longitude, up.latitude))) AS meters
    FROM prices pr
    JOIN product_variants v ON v.id = pr.productVariantId
    JOIN products p ON p.id = v.productId
    JOIN store_branches sb ON sb.id = pr.storeBranchId
    JOIN stores s ON s.id = sb.storeId
    JOIN user_places up ON up.userId = ${userId}
    JOIN (
      SELECT v2.productId AS productId, AVG(pr2.price) AS average
      FROM prices pr2 JOIN product_variants v2 ON v2.id = pr2.productVariantId
      WHERE pr2.status <> 'STALE' AND v2.productId IN (${Prisma.join(productIds)})
      GROUP BY v2.productId
    ) avgp ON avgp.productId = v.productId
    WHERE v.productId IN (${Prisma.join(productIds)})
      AND pr.status <> 'STALE' AND sb.status = 'ACTIVE'
      AND pr.price <= avgp.average * ${CHEAP_FACTOR} AND pr.price >= avgp.average * ${IMPLAUSIBLE_FACTOR}
    GROUP BY pr.id, v.productId, p.name, s.name, sb.name, pr.price, avgp.average
    HAVING meters <= ${NEARBY_METERS}
    ORDER BY (avgp.average - pr.price) / avgp.average DESC
    LIMIT 40
  `);

  // un aviso por producto: el más barato
  const seen = new Set<string>();
  const items: ActivityItem[] = [];
  for (const row of rows) {
    if (seen.has(row.productId)) continue;
    seen.add(row.productId);
    const percent = Math.round((1 - row.price / row.average) * 100);
    const blocks = Math.max(1, Math.round(Number(row.meters) / 100));
    items.push({
      id: `cheap-${row.productId}`,
      type: "CHEAP_NEARBY",
      title: `Barato cerca: ${prettifyProductName(row.productName)}`,
      detail: `${row.storeName} (${row.branchName}), a ${blocks} ${blocks === 1 ? "cuadra" : "cuadras"} de un lugar tuyo: ${pesos(row.price)}, ${percent}% menos que el promedio.`,
      at: null,
      listId: null,
    });
    if (items.length >= 8) break;
  }
  return items;
}

/** Avisos personales de "Para vos": listas compartidas, bajas de precio y ofertas cerca tuyo. */
export async function buildPersonalFeed(userId: string, now: Date = new Date()): Promise<ActivityItem[]> {
  const listItems = await prisma.shoppingListItem.findMany({
    where: { shoppingList: { archivedAt: null, ...listAccessWhere(userId) } },
    select: { productId: true },
    distinct: ["productId"],
    take: 200,
  });
  const productIds = listItems.map((item: (typeof listItems)[number]) => item.productId);

  const [shared, drops, nearby] = await Promise.all([
    sharedListItems(userId, now),
    priceDropItems(productIds, now),
    cheapNearbyItems(userId, productIds),
  ]);
  return [...shared, ...nearby, ...drops].slice(0, MAX_ITEMS);
}
