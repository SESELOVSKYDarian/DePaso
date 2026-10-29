-- CreateIndex
CREATE INDEX `price_history_changedAt_idx` ON `price_history`(`changedAt`);

-- CreateIndex
CREATE INDEX `prices_storeBranchId_status_idx` ON `prices`(`storeBranchId`, `status`);

-- CreateIndex
CREATE INDEX `store_branches_status_latitude_longitude_idx` ON `store_branches`(`status`, `latitude`, `longitude`);

