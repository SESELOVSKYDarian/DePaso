-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MERCHANT';

-- AlterEnum
ALTER TYPE "PriceSourceType" ADD VALUE 'MERCHANT';

-- CreateEnum
CREATE TYPE "MerchantRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "store_branches" ADD COLUMN     "ownerUserId" TEXT;

-- CreateTable
CREATE TABLE "merchant_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "MerchantRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "merchant_requests_userId_idx" ON "merchant_requests"("userId");

-- CreateIndex
CREATE INDEX "merchant_requests_status_idx" ON "merchant_requests"("status");

-- CreateIndex
CREATE INDEX "store_branches_ownerUserId_idx" ON "store_branches"("ownerUserId");

-- AddForeignKey
ALTER TABLE "store_branches" ADD CONSTRAINT "store_branches_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_requests" ADD CONSTRAINT "merchant_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_requests" ADD CONSTRAINT "merchant_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
