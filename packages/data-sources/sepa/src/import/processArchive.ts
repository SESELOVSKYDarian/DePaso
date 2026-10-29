import type { GeoScopeService } from "@depaso/geo";
import type { SepaCommerceArchive } from "../archive";
import { iterateProductosCsv, parseComercioCsv, parseSucursalesCsv } from "../rows";
import { saveBranch } from "./saveBranch";
import { savePrice } from "./savePrice";
import { saveStore } from "./saveStore";
import type { ChainSummary, SepaImportOptions } from "./types";

/** Contadores que va sumando todo el import (los comparten todos los comercios del día). */
export interface ImportStats {
  chains: ChainSummary[];
  branchesDetected: number;
  branchesOutOfScope: number;
  productRowsRead: number;
  pricesAccepted: number;
  pricesRejected: number;
}

export interface ImportContext {
  options: SepaImportOptions;
  geo: GeoScopeService;
  dryRun: boolean;
  /** id del recurso de SEPA que se está importando */
  resourceId: string;
  stats: ImportStats;
  addAnomaly: (reason: string, sample: string) => void;
}

/**
 * Procesa el ZIP de un comercio: sus banderas, sus sucursales dentro de la región y los
 * precios de esas sucursales. Todo lo que cae fuera de la región se descarta sin guardarse.
 */
export async function processArchive(archive: SepaCommerceArchive, ctx: ImportContext): Promise<void> {
  const { options, dryRun, stats, addAnomaly } = ctx;

  if (!archive.comercioCsv) return addAnomaly("comercio.csv vacío o ausente", archive.innerZipName);
  const { rows: comercioRows } = parseComercioCsv(archive.comercioCsv);
  if (comercioRows.length === 0) return addAnomaly("comercio.csv sin filas válidas", archive.innerZipName);

  // bandera -> id de la bandera guardada, para ubicar cada sucursal con su comercio correcto
  // (un comercio.csv puede traer varias banderas, ej. Cencosud: Vea/Disco/Jumbo).
  const storeIdByBandera = new Map<string, string>();
  for (const row of comercioRows) {
    storeIdByBandera.set(row.idBandera, dryRun ? "dry-run" : await saveStore(row, options.source));
    stats.chains.push({ storeName: row.banderaNombre, branchesDetected: 0 });
  }

  if (!archive.sucursalesCsv) return addAnomaly("sucursales.csv vacío o ausente", archive.innerZipName);
  const { rows: sucursalRows } = parseSucursalesCsv(archive.sucursalesCsv);

  // Sección 14: primero se separan las sucursales de la región, antes de tocar los productos.
  const branchIdBySucursal = new Map<string, string>();
  for (const sucursal of sucursalRows) {
    const classification = ctx.geo.classify(sucursal.latitude, sucursal.longitude, sucursal.localidad);
    if (classification.matchedBy === "none") {
      stats.branchesOutOfScope++;
      continue;
    }
    const storeId = storeIdByBandera.get(sucursal.idBandera);
    if (!storeId) {
      addAnomaly(`sucursal de bandera ${sucursal.idBandera} sin comercio.csv correspondiente`, sucursal.idSucursal);
      continue;
    }

    stats.branchesDetected++;
    const bandera = comercioRows.find((r) => r.idBandera === sucursal.idBandera)?.banderaNombre;
    const chain = stats.chains.find((c) => c.storeName === bandera);
    if (chain) chain.branchesDetected++;

    const branchId = dryRun
      ? "dry-run"
      : await saveBranch({ sucursal, storeId, source: options.source, region: options.region, hasDiscrepancy: classification.hasDiscrepancy });
    branchIdBySucursal.set(sucursal.idSucursal, branchId);
  }

  if (!archive.productosCsv) {
    if (branchIdBySucursal.size > 0) addAnomaly("productos.csv vacío o ausente", archive.innerZipName);
    return;
  }

  // Generador (sección 14/26): nunca se arma un array con todas las filas de un comercio
  // (pueden ser millones); se filtra fila por fila contra las sucursales de la región.
  for (const producto of iterateProductosCsv(archive.productosCsv)) {
    stats.productRowsRead++;
    const branchId = branchIdBySucursal.get(producto.idSucursal);
    if (!branchId) continue; // fuera de la región: no se procesa

    const price = producto.precio;
    if (price === null || Number.isNaN(price) || price <= 0) {
      stats.pricesRejected++;
      addAnomaly("precio inválido (nulo, NaN o <= 0)", `${producto.descripcion} = ${String(price)}`);
      continue;
    }
    if (!dryRun) await savePrice(producto, branchId, price, ctx.resourceId);
    stats.pricesAccepted++;
  }
}
