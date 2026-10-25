-- AlterTable
ALTER TABLE "merchant_requests" ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "contactVerifiedAt" TIMESTAMP(3),
ADD COLUMN "contactVerifiedBy" TEXT;
