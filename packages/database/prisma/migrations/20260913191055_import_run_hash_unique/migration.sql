-- DropIndex
DROP INDEX "data_import_runs_source_resourceId_key";

-- CreateIndex
CREATE INDEX "data_import_runs_source_resourceId_idx" ON "data_import_runs"("source", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "data_import_runs_source_fileHash_key" ON "data_import_runs"("source", "fileHash");

