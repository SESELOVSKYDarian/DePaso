import { prisma } from "@depaso/database";
import type { ProductSearchResult } from "@depaso/validation";

const MAX_RESULTS = 20;

/**
 * Búsqueda tolerante a variaciones (sección 37): coincide por nombre de producto, nombre de
 * variante o alias ("coca", "coca cola" apuntan al mismo `ProductVariant`). Sin motor de
 * full-text search todavía (Postgres `ILIKE` alcanza para el volumen de seed de esta fase;
 * si el catálogo crece, `pg_trgm`/`tsvector` es el siguiente paso, no antes).
 */
export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { variants: { some: { name: { contains: query, mode: "insensitive" } } } },
        { variants: { some: { aliases: { some: { alias: { contains: query, mode: "insensitive" } } } } } },
      ],
    },
    include: { brand: true, variants: true },
    take: MAX_RESULTS,
    orderBy: { name: "asc" },
  });

  return products.map((product: (typeof products)[number]) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    brandName: product.brand?.name ?? null,
    variants: product.variants.map((variant: (typeof product.variants)[number]) => ({
      id: variant.id,
      name: variant.name,
      unit: variant.unit,
      unitSize: variant.unitSize,
    })),
  }));
}
