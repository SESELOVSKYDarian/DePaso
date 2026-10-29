import type { ImportStats } from "./processArchive";
import type { AnomalySample, ChainSummary, SepaImportSummary } from "./types";

/** Datos del recurso de SEPA que se está importando. */
export interface ResourceInfo {
  id: string;
  lastModified: string;
}

/** Resumen para cuando el archivo ya se había importado: no hay nada que hacer. */
export function alreadyImportedSummary(source: SepaImportSummary["source"], resource: ResourceInfo, dryRun: boolean): SepaImportSummary {
  return {
    source,
    resourceId: resource.id,
    resourceLastModified: resource.lastModified,
    dryRun,
    skippedAlreadyImported: true,
    comerciosInFeed: 0,
    chains: [],
    branchesDetected: 0,
    branchesOutOfScope: 0,
    productRowsRead: 0,
    pricesAccepted: 0,
    pricesRejected: 0,
    anomalySamples: [],
  };
}

/** Junta las cadenas repetidas (una por cada fila de comercio.csv) en una sola por bandera. */
function collapseChains(chains: ChainSummary[]): ChainSummary[] {
  const byName = new Map<string, number>();
  for (const c of chains) byName.set(c.storeName, (byName.get(c.storeName) ?? 0) + c.branchesDetected);
  return Array.from(byName.entries())
    .map(([storeName, branchesDetected]) => ({ storeName, branchesDetected }))
    .filter((c) => c.branchesDetected > 0)
    .sort((a, b) => b.branchesDetected - a.branchesDetected);
}

/** Resumen final de un import terminado. */
export function buildSummary(
  source: SepaImportSummary["source"],
  resource: ResourceInfo,
  dryRun: boolean,
  comerciosInFeed: number,
  stats: ImportStats,
  anomalySamples: AnomalySample[],
): SepaImportSummary {
  return {
    source,
    resourceId: resource.id,
    resourceLastModified: resource.lastModified,
    dryRun,
    skippedAlreadyImported: false,
    comerciosInFeed,
    chains: collapseChains(stats.chains),
    branchesDetected: stats.branchesDetected,
    branchesOutOfScope: stats.branchesOutOfScope,
    productRowsRead: stats.productRowsRead,
    pricesAccepted: stats.pricesAccepted,
    pricesRejected: stats.pricesRejected,
    anomalySamples,
  };
}
