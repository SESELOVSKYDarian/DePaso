import { Prisma, prisma } from "@depaso/database";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchant } from "@/lib/auth/requireMerchant";
import { PRODUCT_TYPE_LABELS } from "@depaso/domain";
import { merchantPriceInclude, normalizeName, toMerchantPriceResponse } from "@/lib/merchant/merchant";
import { prettifyBrandName } from "@/lib/catalog/productNames";
import { postAsQuery } from "@/lib/http/postAdapter";

const PAGE_SIZE = 50;

/**
 * Precios vigentes de la sucursal del comercio (los dados de baja quedan como STALE y no se
 * listan), con búsqueda y filtros como el buscador: `?q=` (nombre, nombre propio o marca),
 * `type`, `brandId` y `offset` (de a 50). Devuelve también el total y los tipos/marcas
 * presentes para armar los filtros.
 */
async function handle(request: NextRequest) {
  const merchant = await requireMerchant(request);
  if (!merchant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const q = normalizeName(params.get("q") ?? "");
  const type = params.get("type") || undefined;
  const brandId = params.get("brandId") || undefined;
  const offset = Math.max(0, Number(params.get("offset") ?? 0) || 0);

  const base: Prisma.PriceWhereInput = { storeBranchId: merchant.branchId, status: { not: "STALE" } };
  const textFilter: Prisma.PriceWhereInput[] = q
    ? q.split(" ").map((word) => ({
        OR: [
          { productVariant: { product: { normalizedName: { contains: word } } } },
          { displayName: { contains: word, mode: "insensitive" as const } },
          { productVariant: { product: { brand: { name: { contains: word, mode: "insensitive" as const } } } } },
        ],
      }))
    : [];
  const where: Prisma.PriceWhereInput = {
    AND: [
      base,
      ...textFilter,
      ...(type ? [{ productVariant: { product: { productType: type } } }] : []),
      ...(brandId ? [{ productVariant: { product: { brandId } } }] : []),
    ],
  };
  // Las facetas no se filtran por sí mismas, así siempre se puede cambiar de tipo o marca.
  const typeWhere: Prisma.PriceWhereInput = { AND: [base, ...textFilter, ...(brandId ? [{ productVariant: { product: { brandId } } }] : [])] };
  const brandWhere: Prisma.PriceWhereInput = { AND: [base, ...textFilter, ...(type ? [{ productVariant: { product: { productType: type } } }] : [])] };

  const [prices, total, typeRows, brandRows] = await Promise.all([
    prisma.price.findMany({ where, include: merchantPriceInclude, orderBy: { updatedAt: "desc" }, skip: offset, take: PAGE_SIZE }),
    prisma.price.count({ where }),
    prisma.price.findMany({ where: typeWhere, select: { productVariant: { select: { product: { select: { productType: true } } } } }, take: 5000 }),
    prisma.price.findMany({
      where: brandWhere,
      select: { productVariant: { select: { product: { select: { brand: { select: { id: true, name: true } } } } } } },
      take: 5000,
    }),
  ]);

  const typeCounts = new Map<string, number>();
  for (const row of typeRows) {
    const id = row.productVariant.product.productType;
    if (id) typeCounts.set(id, (typeCounts.get(id) ?? 0) + 1);
  }
  const brandCounts = new Map<string, { name: string; count: number }>();
  for (const row of brandRows) {
    const brand = row.productVariant.product.brand;
    if (!brand || /^(s\/?d|gen[eé]rico|sin marca|\s*)$/i.test(brand.name.trim())) continue;
    const entry = brandCounts.get(brand.id) ?? { name: prettifyBrandName(brand.name) ?? brand.name, count: 0 };
    entry.count += 1;
    brandCounts.set(brand.id, entry);
  }

  return NextResponse.json({
    prices: prices.map(toMerchantPriceResponse),
    total,
    facets: {
      types: [...typeCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id, count]) => ({ id, label: PRODUCT_TYPE_LABELS[id] ?? id, count })),
      brands: [...brandCounts.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 30)
        .map(([id, entry]) => ({ id, name: entry.name, count: entry.count })),
    },
  });
}

// Todos los endpoints son POST: los datos llegan en el body.
export const POST = postAsQuery(handle);
