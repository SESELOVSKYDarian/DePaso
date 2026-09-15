import AdmZip from "adm-zip";

/**
 * Lector del ZIP diario de SEPA. Estructura real (corrección a la sección 3 del prompt,
 * que asumía comercio.csv/sucursales.csv/productos.csv sueltos): el ZIP del día contiene
 * un ZIP anidado **por `id_comercio`**, y recién adentro de ESE están los 3 CSV.
 * Confirmado descargando y abriendo el feed real — docs/data/SEPA.md.
 */
export interface SepaCommerceArchive {
  /** Nombre del ZIP interno tal como viene, ej. `sepa_1_comercio-sepa-9_...zip` — útil
   * para logs/debug, no se parsea como fuente de verdad (el `id_comercio` real sale de
   * `comercio.csv`). */
  innerZipName: string;
  comercioCsv: string | null;
  sucursalesCsv: string | null;
  productosCsv: string | null;
}

function readEntryText(zip: AdmZip, entryName: string): string | null {
  const entry = zip.getEntry(entryName);
  if (!entry) return null;
  const text = entry.getData().toString("utf-8");
  return text.trim().length > 0 ? text : null;
}

const EMPTY_ARCHIVE: Omit<SepaCommerceArchive, "innerZipName"> = {
  comercioCsv: null,
  sucursalesCsv: null,
  productosCsv: null,
};

/**
 * Recorre el ZIP del día **un comercio a la vez** — generador, no array. Confirmado real
 * contra SEPA Minorista: materializar los ~15 comercios simultáneamente (un solo comercio
 * grande puede decodificar a cientos de MB de `productos.csv`) produce un
 * "JavaScript heap out of memory" real (ver docs/development/DECISIONS.md). Procesando de
 * a uno, el comercio anterior queda disponible para el recolector de basura antes de leer
 * el siguiente.
 */
export function* iterateSepaDailyArchive(zipBuffer: Buffer): Generator<SepaCommerceArchive> {
  const outer = new AdmZip(zipBuffer);
  const innerEntries = outer.getEntries().filter((e) => !e.isDirectory && e.entryName.endsWith(".zip"));

  for (const entry of innerEntries) {
    const innerBuffer = entry.getData();
    // Confirmado real (SEPA Minorista, comercio-sepa-36 del 2026-09-13): un ZIP anidado
    // puede venir de 0 bytes — ni `comercio.csv` ni nada adentro. `AdmZip` explota con
    // "No END header found" ante un buffer vacío/inválido en vez de tratarlo como
    // "este comercio no publicó nada hoy" (sección 29 — no romper el import entero por
    // una fila/archivo sospechoso, descartar y seguir).
    if (innerBuffer.length === 0) {
      yield { innerZipName: entry.entryName, ...EMPTY_ARCHIVE };
      continue;
    }
    try {
      const inner = new AdmZip(innerBuffer);
      yield {
        innerZipName: entry.entryName,
        comercioCsv: readEntryText(inner, "comercio.csv"),
        sucursalesCsv: readEntryText(inner, "sucursales.csv"),
        productosCsv: readEntryText(inner, "productos.csv"),
      };
    } catch {
      yield { innerZipName: entry.entryName, ...EMPTY_ARCHIVE };
    }
  }
}

/** Variante en array — sólo para tests/fixtures chicos. No usar en el import job real
 * (ver `iterateSepaDailyArchive`). */
export function readSepaDailyArchive(zipBuffer: Buffer): SepaCommerceArchive[] {
  return Array.from(iterateSepaDailyArchive(zipBuffer));
}
