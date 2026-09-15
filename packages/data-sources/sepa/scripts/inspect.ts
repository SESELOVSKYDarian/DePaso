/**
 * `pnpm data:sepa:inspect` (sección 71) — dry-run real contra el feed vivo de SEPA, sin
 * escribir nada en la base. Los números salen del dataset actual, nunca hardcodeados.
 */
import { parseArgs } from "node:util";
import { prisma } from "@depaso/database";
import { runSepaImport } from "../src/importJob";
import { ensureMarketRegion } from "./ensureRegion";

const { values } = parseArgs({
  options: {
    wholesale: { type: "boolean", default: false },
    retail: { type: "boolean", default: false },
  },
});

async function main() {
  const sources: Array<"SEPA_MAYORISTA" | "SEPA_MINORISTA"> = [];
  if (values.wholesale || (!values.wholesale && !values.retail)) sources.push("SEPA_MAYORISTA");
  if (values.retail) sources.push("SEPA_MINORISTA");

  const region = await ensureMarketRegion();

  for (const source of sources) {
    console.log(`\n=== ${source} — dry-run ===`);
    const summary = await runSepaImport({ source, region, dryRun: true });

    if (summary.skippedAlreadyImported) {
      console.log("Ya se importó este mismo contenido antes (mismo fileHash) — nada nuevo que mostrar.");
      continue;
    }

    console.log(`Recurso: ${summary.resourceId} (última modificación: ${summary.resourceLastModified})`);
    console.log(`Comercios en el feed: ${summary.comerciosInFeed}`);
    console.log(`\n${region.name}\n`);
    if (summary.chains.length === 0) {
      console.log("  (ninguna cadena conocida encontrada dentro de la región)");
    }
    for (const chain of summary.chains) {
      console.log(`  ${chain.storeName.padEnd(24)} ${chain.branchesDetected} branches`);
    }
    console.log(`\nSucursales dentro de la región: ${summary.branchesDetected}`);
    console.log(`Sucursales fuera de la región (descartadas): ${summary.branchesOutOfScope}`);
    console.log(`\nProductos leídos (sólo sucursales en scope): ${summary.productRowsRead}`);
    console.log(`Precios aceptados: ${summary.pricesAccepted}`);
    console.log(`Precios rechazados: ${summary.pricesRejected}`);
    if (summary.anomalySamples.length > 0) {
      console.log(`\nAnomalías (muestra de ${summary.anomalySamples.length}):`);
      for (const a of summary.anomalySamples.slice(0, 10)) {
        console.log(`  - [${a.reason}] ${a.sample}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
