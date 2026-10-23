-- AlterTable
ALTER TABLE "merchant_requests" ADD COLUMN "storeBranchId" TEXT;

-- AlterTable
ALTER TABLE "prices" ADD COLUMN "displayName" TEXT;

-- CreateIndex
CREATE INDEX "merchant_requests_storeBranchId_idx" ON "merchant_requests"("storeBranchId");

-- AddForeignKey
ALTER TABLE "merchant_requests" ADD CONSTRAINT "merchant_requests_storeBranchId_fkey" FOREIGN KEY ("storeBranchId") REFERENCES "store_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
