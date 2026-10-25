-- AlterTable
ALTER TABLE "products" ADD COLUMN "popularity" INTEGER NOT NULL DEFAULT 0;

-- Carga inicial: precios vigentes por producto (una sola pasada, en vez de contarlos en cada búsqueda).
UPDATE "products" p
SET "popularity" = counts.n
FROM (
  SELECT v."productId" AS id, count(*)::int AS n
  FROM "product_variants" v
  JOIN "prices" pr ON pr."productVariantId" = v.id
  WHERE pr.status <> 'STALE'
  GROUP BY v."productId"
) counts
WHERE counts.id = p.id;

-- CreateIndex
CREATE INDEX "products_productType_popularity_idx" ON "products"("productType", "popularity" DESC);
