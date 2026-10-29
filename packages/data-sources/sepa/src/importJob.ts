import { prisma } from "@depaso/database";
import { createGeoScopeService } from "@depaso/geo";
import { iterateSepaDailyArchive } from "./archive";
import { createCkanClient, SEPA_PACKAGE_IDS } from "./ckan";
import { downloadResource } from "./download";
import { processArchive, type ImportStats } from "./import/processArchive";
import { alreadyImportedSummary, buildSummary } from "./import/summary";
import type { AnomalySample, SepaImportOptions, SepaImportSummary } from "./import/types";

export * from "./import/types";

/**
 * Pipeline de import de SEPA (sección 25, adaptado a la estructura real confirmada en
 * docs/data/SEPA.md — ZIP del día → ZIP anidado por comercio → 3 CSV). Alcance de esta
 * fase: SEPA Mayorista (chico, ~10-15MB/día) — Minorista (~330MB/día) necesita streaming
 * real antes de conectarse acá (sección 26, deliberadamente no implementado todavía).
 *
 * Sección 14: sólo se persisten sucursales/precios dentro de `options.region` — nunca se
 * toca `Product`/`Price` para una fila fuera de scope, ni siquiera para crear el producto.
 *
 * Pasos: 1) bajar el archivo del día, 2) saltear si ya se importó, 3) procesar cada comercio
 * (`import/processArchive.ts`), 4) cerrar la corrida y devolver el resumen.
 */
export async function runSepaImport(options: SepaImportOptions): Promise<SepaImportSummary> {
  const dryRun = options.dryRun ?? false;
  const maxAnomalySamples = options.maxAnomalySamples ?? 30;
  const anomalySamples: AnomalySample[] = [];
  const addAnomaly = (reason: string, sample: string) => {
    if (anomalySamples.length < maxAnomalySamples) anomalySamples.push({ reason, sample });
  };

  // 1) bajo el archivo más reciente
  const packageId = options.source === "SEPA_MINORISTA" ? SEPA_PACKAGE_IDS.MINORISTA : SEPA_PACKAGE_IDS.MAYORISTA;
  const resource = await createCkanClient().getLatestResource(packageId, "ZIP");
  const { buffer, sha256 } = await downloadResource(resource.url);

  // 2) si es el mismo contenido de una corrida anterior, no hay nada que hacer
  const existingRun = await prisma.dataImportRun.findUnique({
    where: { source_fileHash: { source: options.source, fileHash: sha256 } },
  });
  if (existingRun && existingRun.status === "SUCCESS") return alreadyImportedSummary(options.source, resource, dryRun);

  const importRun = dryRun
    ? null
    : await prisma.dataImportRun.create({
        data: {
          source: options.source,
          resourceId: resource.id,
          resourceLastModified: new Date(resource.lastModified),
          fileHash: sha256,
          status: "RUNNING",
        },
      });

  // 3) proceso de a un comercio. Es un generador, no un array: un solo comercio de SEPA
  // Minorista puede ocupar cientos de MB y tener varios en memoria a la vez tiró un "heap out
  // of memory" real (ver docs/development/DECISIONS.md).
  const stats: ImportStats = { chains: [], branchesDetected: 0, branchesOutOfScope: 0, productRowsRead: 0, pricesAccepted: 0, pricesRejected: 0 };
  const ctx = { options, geo: createGeoScopeService(options.region), dryRun, resourceId: resource.id, stats, addAnomaly };
  let comerciosInFeed = 0;
  for (const archive of iterateSepaDailyArchive(buffer)) {
    comerciosInFeed++;
    await processArchive(archive, ctx);
  }

  // 4) cierro la corrida y guardo las anomalías
  if (importRun) {
    await prisma.dataImportRun.update({
      where: { id: importRun.id },
      data: {
        status: stats.pricesRejected > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        rowsRead: stats.productRowsRead,
        rowsAccepted: stats.pricesAccepted,
        rowsRejected: stats.pricesRejected,
        branchesDetected: stats.branchesDetected,
      },
    });
    if (anomalySamples.length > 0) {
      await prisma.importAnomaly.createMany({
        data: anomalySamples.map((a) => ({
          importRunId: importRun.id,
          type: a.reason,
          rawRow: a.sample,
          reason: a.reason,
          needsReview: true,
        })),
      });
    }
  }

  return buildSummary(options.source, resource, dryRun, comerciosInFeed, stats, anomalySamples);
}
