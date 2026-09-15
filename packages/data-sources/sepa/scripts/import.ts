/**
 * `pnpm data:sepa:import` (sección 72). Ejemplo:
 *
 *   pnpm data:sepa:import --wholesale --dry-run
 *   pnpm data:sepa:import --retail
 */
import { parseArgs } from "node:util";
import { prisma } from "@depaso/database";
import { runSepaImport } from "../src/importJob";
import { ensureMarketRegion } from "./ensureRegion";

const { values } = parseArgs({
  options: {
    wholesale: { type: "boolean", default: false },
    retail: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

async function main() {
  if (values.retail && values.wholesale) {
    console.error("Elegí sólo uno: --wholesale o --retail.");
    process.exit(1);
  }
  const source = values.retail ? ("SEPA_MINORISTA" as const) : ("SEPA_MAYORISTA" as const);
  const region = await ensureMarketRegion();

  console.log(`Importando ${source}${values["dry-run"] ? " (dry-run)" : ""}...`);
  const summary = await runSepaImport({ source, region, dryRun: values["dry-run"] });

  if (summary.skippedAlreadyImported) {
    console.log("Ya se importó este mismo contenido antes (mismo fileHash) — nada que hacer.");
  } else {
    console.log(`Recurso: ${summary.resourceId} (${summary.resourceLastModified})`);
    console.log(`Sucursales en scope: ${summary.branchesDetected} | fuera de scope: ${summary.branchesOutOfScope}`);
    console.log(`Precios aceptados: ${summary.pricesAccepted} | rechazados: ${summary.pricesRejected}`);
    if (summary.anomalySamples.length > 0) {
      console.log(`Anomalías (muestra): ${summary.anomalySamples.length}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
