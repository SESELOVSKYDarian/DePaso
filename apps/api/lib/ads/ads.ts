import { Prisma, prisma } from "@depaso/database";
import type { AdKind, AdResponse, HomeAd, HomeProduct } from "@depaso/validation";
import { prettifyProductName } from "../catalog/productNames";

interface AdRow {
  id: string;
  userId: string;
  kind: AdKind;
  title: string;
  message: string | null;
  productId: string | null;
  imageData: string | null;
  videoUrl: string | null;
  offeredAmount: Prisma.Decimal;
  agreedAmount: Prisma.Decimal | null;
  durationDays: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  adminNote: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
}

interface Extras {
  productNames: Map<string, string>;
  merchants?: Map<string, { name: string | null; email: string }>;
}

/** `true` mientras la publicidad está aprobada y dentro de sus fechas. */
export function isAdActive(ad: Pick<AdRow, "status" | "startsAt" | "endsAt">, now: Date = new Date()): boolean {
  return ad.status === "APPROVED" && ad.startsAt !== null && ad.endsAt !== null && ad.startsAt <= now && now <= ad.endsAt;
}

/** Fila de la base → lo que ve la app. */
export function toAdResponse(row: AdRow, extras: Extras, now: Date = new Date()): AdResponse {
  const merchant = extras.merchants?.get(row.userId);
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    message: row.message,
    productId: row.productId,
    productName: row.productId ? (extras.productNames.get(row.productId) ?? null) : null,
    imageData: row.imageData,
    videoUrl: row.videoUrl,
    offeredAmount: Number(row.offeredAmount),
    agreedAmount: row.agreedAmount === null ? null : Number(row.agreedAmount),
    durationDays: row.durationDays,
    status: row.status,
    adminNote: row.adminNote,
    startsAt: row.startsAt ? row.startsAt.toISOString() : null,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    active: isAdActive(row, now),
    createdAt: row.createdAt.toISOString(),
    merchantName: merchant?.name ?? null,
    merchantEmail: merchant?.email ?? null,
  };
}

/** Nombres de los productos que mencionan los pedidos. */
export async function loadProductNames(rows: Pick<AdRow, "productId">[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.flatMap((row) => (row.productId ? [row.productId] : [])))];
  if (ids.length === 0) return new Map();
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return new Map(products.map((product: (typeof products)[number]) => [product.id, prettifyProductName(product.name)]));
}

/**
 * La publicidad vigente para Inicio: los productos destacados (con su precio en el comercio que
 * pagó) y las tarjetas. Un destacado sin precio vigente en ese comercio no se muestra.
 */
export async function loadActiveAds(now: Date = new Date()): Promise<{ featured: HomeProduct[]; ads: HomeAd[] }> {
  const rows = await prisma.adRequest.findMany({
    where: { status: "APPROVED", startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { startsAt: "desc" },
    take: 20,
  });
  if (rows.length === 0) return { featured: [], ads: [] };

  const branchIds = [...new Set(rows.map((row: (typeof rows)[number]) => row.storeBranchId))];
  const branches = await prisma.storeBranch.findMany({ where: { id: { in: branchIds } }, select: { id: true, store: { select: { name: true } } } });
  const storeName = new Map(branches.map((branch: (typeof branches)[number]) => [branch.id, branch.store.name]));

  // banner, imagen y video: cada uno con lo suyo; el tope por tipo evita llenar Inicio
  const ads: HomeAd[] = [];
  for (const kind of ["IMAGE", "VIDEO", "BANNER"] as const) {
    rows
      .filter((row: (typeof rows)[number]) => row.kind === kind)
      .slice(0, 3)
      .forEach((row: (typeof rows)[number]) =>
        ads.push({ id: row.id, kind, title: row.title, message: row.message, storeName: storeName.get(row.storeBranchId) ?? "Comercio", imageData: row.imageData, videoUrl: row.videoUrl }),
      );
  }

  const featured: HomeProduct[] = [];
  for (const row of rows) {
    if (row.kind !== "FEATURED_PRODUCT" || !row.productId) continue;
    const price = await prisma.price.findFirst({
      where: { storeBranchId: row.storeBranchId, status: { not: "STALE" }, productVariant: { productId: row.productId } },
      orderBy: { price: "asc" },
      include: { productVariant: { include: { product: { include: { brand: true } } } } },
    });
    if (!price) continue;
    const product = price.productVariant.product;
    featured.push({
      productId: product.id,
      name: prettifyProductName(product.name),
      brandName: product.brand?.name ?? null,
      imageUrl: product.imageUrl,
      storeName: storeName.get(row.storeBranchId) ?? "Comercio",
      price: Number(price.price),
      averagePrice: Number(price.price),
      savingPercent: 0,
    });
    if (featured.length >= 8) break;
  }
  return { featured, ads };
}
