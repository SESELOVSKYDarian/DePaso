/**
 * Parser de los CSV de SEPA — pipe-delimited (`|`), UTF-8 con BOM, CRLF (sección 3;
 * confirmado byte a byte contra el feed real, no asumido — docs/data/SEPA.md). Los
 * archivos reales suelen traer una línea de pie sin el mismo número de columnas
 * ("Última actualización: ...") — se descarta en vez de romper el parseo.
 */
export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  skippedLines: number;
}

const BOM = "﻿";

/** Parsea todo el archivo a un array en memoria — sólo para `comercio.csv`/
 * `sucursales.csv` (chicos, cientos de filas). Para `productos.csv` (puede ser cientos de
 * MB en SEPA Minorista) usar `iteratePipeDelimitedCsv`, que no materializa un array. */
export function parsePipeDelimitedCsv(content: string): ParsedCsv {
  const withoutBom = content.startsWith(BOM) ? content.slice(BOM.length) : content;
  const lines = withoutBom.split(/\r\n|\n/).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], skippedLines: 0 };
  }

  const headers = lines[0]!.split("|");
  const rows: Record<string, string>[] = [];
  let skippedLines = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]!.split("|");
    if (values.length !== headers.length) {
      skippedLines++;
      continue;
    }
    const row: Record<string, string> = {};
    for (let col = 0; col < headers.length; col++) {
      row[headers[col]!] = values[col]!;
    }
    rows.push(row);
  }

  return { headers, rows, skippedLines };
}

export interface CsvLineIterator {
  headers: string[];
  rows: Generator<Record<string, string>>;
  /** Válido recién después de agotar `rows` por completo. */
  skippedLines(): number;
}

/**
 * Variante generador — sección 26/27: `productos.csv` de SEPA Minorista puede decodificar
 * a cientos de MB de texto en un solo comercio (confirmado real: un
 * "JavaScript heap out of memory" con el enfoque de "parsear todo a un array antes de
 * filtrar" — ver docs/development/DECISIONS.md). Recorre línea por línea sin materializar
 * un array de todas las filas; el caller filtra y descarta cada fila antes de pedir la
 * siguiente, así sólo una fila vive en memoria a la vez.
 *
 * Lee el header sincrónicamente (necesario antes de poder yield-ear nada) y devuelve el
 * resto como generador perezoso.
 */
export function iteratePipeDelimitedCsv(content: string): CsvLineIterator {
  const withoutBom = content.startsWith(BOM) ? content.slice(BOM.length) : content;
  let skipped = 0;

  const firstNewline = withoutBom.indexOf("\n");
  const headerLine = (firstNewline === -1 ? withoutBom : withoutBom.slice(0, firstNewline)).replace(/\r$/, "");
  const headers = headerLine.length > 0 ? headerLine.split("|") : [];
  const bodyStart = firstNewline === -1 ? withoutBom.length : firstNewline + 1;

  function* generateRows(): Generator<Record<string, string>> {
    let start = bodyStart;
    while (start <= withoutBom.length) {
      const newlineIndex = withoutBom.indexOf("\n", start);
      const lineEnd = newlineIndex === -1 ? withoutBom.length : newlineIndex;
      let line = withoutBom.slice(start, lineEnd);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      start = newlineIndex === -1 ? withoutBom.length + 1 : newlineIndex + 1;

      if (line.length === 0) continue;

      const values = line.split("|");
      if (values.length !== headers.length) {
        skipped++;
        continue;
      }
      const row: Record<string, string> = {};
      for (let col = 0; col < headers.length; col++) {
        row[headers[col]!] = values[col]!;
      }
      yield row;
    }
  }

  return { headers, rows: generateRows(), skippedLines: () => skipped };
}
