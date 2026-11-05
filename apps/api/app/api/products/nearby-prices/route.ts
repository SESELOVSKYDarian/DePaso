import { Prisma, prisma } from "@depaso/database";
import { nearbyPricesInputSchema, type NearbyPrice } from "@depaso/validation";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { rankNearbyOptions } from "@/lib/products/nearbyPrices";

export const dynamic = "force-dynamic";

interface Row {
  branchId: string;
  variantId: string;
  storeName: string;
  branchName: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  meters: number;
}

/**
 * `POST /api/products/nearby-prices` — para quien está comprando y se quedó sin un producto:
 * los comercios cercanos que lo tienen, la opción más conveniente (barata y cerca) primero.
 */
export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request);
  if (!current) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = nearbyPricesInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REQUEST", issues: parsed.error.issues }, { status: 400 });
  const { productId, productVariantId, latitude, longitude, excludeBranchId, radiusMeters } = parsed.data;

  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT sb.id AS branchId, v.id AS variantId, s.name AS storeName, sb.name AS branchName, sb.address AS address,
           sb.latitude AS latitude, sb.longitude AS longitude, CAST(MIN(pr.price) AS DOUBLE) AS price,
           ST_Distance_Sphere(POINT(sb.longitude, sb.latitude), POINT(${longitude}, ${latitude})) AS meters
    FROM prices pr
    JOIN product_variants v ON v.id = pr.productVariantId
    JOIN store_branches sb ON sb.id = pr.storeBranchId
    JOIN stores s ON s.id = sb.storeId
    WHERE v.productId = ${productId} AND pr.status <> 'STALE' AND sb.status = 'ACTIVE'
      ${excludeBranchId ? Prisma.sql`AND sb.id <> ${excludeBranchId}` : Prisma.empty}
    GROUP BY sb.id, v.id, s.name, sb.name, sb.address, sb.latitude, sb.longitude
    HAVING meters <= ${radiusMeters}
    ORDER BY price ASC
    LIMIT 60
  `);

  // se prefiere la misma presentación (mismo tamaño); si en ningún comercio cercano está, sirve cualquiera del producto
  const sameVariant = productVariantId ? rows.filter((row: Row) => row.variantId === productVariantId) : [];
  const source = sameVariant.length > 0 ? sameVariant : rows;

  // un comercio puede tener varias presentaciones: se queda con la más barata de cada uno
  const byBranch = new Map<string, NearbyPrice>();
  for (const row of source) {
    const option: NearbyPrice = {
      branchId: row.branchId,
      storeName: row.storeName,
      branchName: row.branchName,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      unitPrice: Number(row.price),
      distanceMeters: Math.round(Number(row.meters)),
    };
    const known = byBranch.get(option.branchId);
    if (!known || option.unitPrice < known.unitPrice) byBranch.set(option.branchId, option);
  }
  return NextResponse.json({ options: rankNearbyOptions([...byBranch.values()]) });
}