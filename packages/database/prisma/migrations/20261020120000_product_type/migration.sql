-- AlterTable
ALTER TABLE "products" ADD COLUMN "productType" TEXT;

-- CreateIndex
CREATE INDEX "products_productType_idx" ON "products"("productType");
