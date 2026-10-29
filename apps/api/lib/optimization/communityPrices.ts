import { prisma } from "@depaso/database";

/** Reportes de más de dos semanas ya no cuentan: los precios cambian rápido. */
const WINDOW_DAYS = 14;
/** Debajo de esta diferencia no vale la pena avisar: es ruido de redondeo. */
const MIN_DIFFERENCE = 0.05;

export interface CommunityObservation {
  /** Precio típico que vieron los usuarios (mediana de lo reportado). */
  median: number;
  /** Cuántas personas distintas lo reportaron. */
  count: number;
}

interface Pair {
  productVariantId: string;
  storeBranchId: string;
}

/** Mediana de una lista de números (el valor del medio; promedio de los dos del medio si es par). */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

/**
 * Qué precio vieron otros usuarios para cada producto en cada comercio. Se cuenta una sola vez a
 * cada persona (su reporte más reciente) para que nadie pese más por reportar muchas veces.
 */
export async function loadCommunityObservations(pairs: Pair[]): Promise<Map<string, CommunityObservation>> {
  const observations = new Map<string, CommunityObservation>();
  if (pairs.length === 0) return observations;

  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const reports = await prisma.priceReport.findMany({
    where: { createdAt: { gte: since }, OR: pairs.map((pair) => ({ productVariantId: pair.productVariantId, storeBranchId: pair.storeBranchId })) },
    orderBy: { createdAt: "desc" },
    select: { productVariantId: true, storeBranchId: true, userId: true, reportedPrice: true },
  });

  // último reporte de cada persona por producto y comercio
  const latestByUser = new Map<string, Map<string, number>>();
  for (const report of reports) {
    const key = `${report.productVariantId}:${report.storeBranchId}`;
    const users = latestByUser.get(key) ?? new Map<string, number>();
    if (!users.has(report.userId)) users.set(report.userId, Number(report.reportedPrice));
    latestByUser.set(key, users);
  }
  for (const [key, users] of latestByUser) {
    observations.set(key, { median: Math.round(median([...users.values()])), count: users.size });
  }
  return observations;
}

/** Devuelve la observación solo si cambia lo que se muestra (difiere lo suficiente del precio publicado). */
export function observationIfDifferent(
  observations: Map<string, CommunityObservation>,
  productVariantId: string | undefined,
  storeBranchId: string,
  publishedPrice: number,
): CommunityObservation | undefined {
  if (!productVariantId) return undefined;
  const found = observations.get(`${productVariantId}:${storeBranchId}`);
  if (!found || publishedPrice <= 0) return undefined;
  return Math.abs(found.median - publishedPrice) / publishedPrice >= MIN_DIFFERENCE ? found : undefined;
}
