-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('SEPA_MINORISTA', 'SEPA_MAYORISTA');

-- CreateEnum
CREATE TYPE "ImportRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "StoreBranchStatus" AS ENUM ('ACTIVE', 'POSSIBLY_INACTIVE', 'INACTIVE', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PriceSourceType" ADD VALUE 'OFFICIAL_SEPA';
ALTER TYPE "PriceSourceType" ADD VALUE 'RETAILER_ONLINE';
ALTER TYPE "PriceSourceType" ADD VALUE 'RECEIPT';
ALTER TYPE "PriceSourceType" ADD VALUE 'MANUAL_ADMIN';

-- AlterTable
ALTER TABLE "prices" ADD COLUMN     "promoDescription1" TEXT,
ADD COLUMN     "promoDescription2" TEXT,
ADD COLUMN     "promoPrice1" DECIMAL(12,2),
ADD COLUMN     "promoPrice2" DECIMAL(12,2),
ADD COLUMN     "sourceExternalId" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "eanConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "normalizedName" TEXT;

-- AlterTable
ALTER TABLE "store_branches" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "externalSepaBranchId" TEXT,
ADD COLUMN     "externalSepaBrandId" TEXT,
ADD COLUMN     "externalSepaCommerceId" TEXT,
ADD COLUMN     "marketRegionId" TEXT,
ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "source" "ImportSourceType",
ADD COLUMN     "sourceUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "status" "StoreBranchStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "street" TEXT,
ADD COLUMN     "streetNumber" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "externalSepaBrandId" TEXT,
ADD COLUMN     "normalizedName" TEXT;

-- CreateTable
CREATE TABLE "store_companies" (
    "id" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "source" "ImportSourceType",
    "sourceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_aliases" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,

    CONSTRAINT "store_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_data_issues" (
    "id" TEXT NOT NULL,
    "storeBranchId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_data_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_regions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Argentina',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minLatitude" DOUBLE PRECISION NOT NULL,
    "maxLatitude" DOUBLE PRECISION NOT NULL,
    "minLongitude" DOUBLE PRECISION NOT NULL,
    "maxLongitude" DOUBLE PRECISION NOT NULL,
    "localityAliases" TEXT[],

    CONSTRAINT "market_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_import_runs" (
    "id" TEXT NOT NULL,
    "source" "ImportSourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceLastModified" TIMESTAMP(3) NOT NULL,
    "fileHash" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ImportRunStatus" NOT NULL DEFAULT 'RUNNING',
    "rowsRead" INTEGER NOT NULL DEFAULT 0,
    "rowsAccepted" INTEGER NOT NULL DEFAULT 0,
    "rowsRejected" INTEGER NOT NULL DEFAULT 0,
    "branchesDetected" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "data_import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_anomalies" (
    "id" TEXT NOT NULL,
    "importRunId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rawRow" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_companies_cuit_key" ON "store_companies"("cuit");

-- CreateIndex
CREATE INDEX "store_aliases_normalizedAlias_idx" ON "store_aliases"("normalizedAlias");

-- CreateIndex
CREATE INDEX "branch_data_issues_storeBranchId_idx" ON "branch_data_issues"("storeBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "market_regions_slug_key" ON "market_regions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "data_import_runs_source_resourceId_key" ON "data_import_runs"("source", "resourceId");

-- CreateIndex
CREATE INDEX "import_anomalies_importRunId_idx" ON "import_anomalies"("importRunId");

-- CreateIndex
CREATE INDEX "prices_sourceExternalId_idx" ON "prices"("sourceExternalId");

-- CreateIndex
CREATE INDEX "products_normalizedName_idx" ON "products"("normalizedName");

-- CreateIndex
CREATE INDEX "store_branches_marketRegionId_idx" ON "store_branches"("marketRegionId");

-- CreateIndex
CREATE UNIQUE INDEX "store_branches_externalSepaCommerceId_externalSepaBrandId_e_key" ON "store_branches"("externalSepaCommerceId", "externalSepaBrandId", "externalSepaBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "stores_companyId_externalSepaBrandId_key" ON "stores"("companyId", "externalSepaBrandId");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "store_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_aliases" ADD CONSTRAINT "store_aliases_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_branches" ADD CONSTRAINT "store_branches_marketRegionId_fkey" FOREIGN KEY ("marketRegionId") REFERENCES "market_regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_data_issues" ADD CONSTRAINT "branch_data_issues_storeBranchId_fkey" FOREIGN KEY ("storeBranchId") REFERENCES "store_branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_anomalies" ADD CONSTRAINT "import_anomalies_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "data_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

