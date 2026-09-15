import { describe, expect, it } from "vitest";
import { parsePipeDelimitedCsv } from "./parseCsv";

// Contenido real capturado del feed SEPA Mayorista (Makro, id_comercio 61) durante la
// investigación de esta fase — no un fixture inventado (docs/data/SEPA.md).
const REAL_COMERCIO_CSV =
  "﻿id_comercio|id_bandera|comercio_cuit|comercio_razon_social|comercio_bandera_nombre|comercio_bandera_url|comercio_ultima_actualizacion|comercio_version_sepa\r\n" +
  "61|1|30589621499|HIPERMAYORISTA MAKRO S.A|HIPERMAYORISTA MAKRO|www.makro.com.ar|2026-09-13T05:30:23-03:00|0\r\n" +
  "\r\n" +
  "última actualización: 2026-09-13T05:30:23-03:00\r\n";

describe("parsePipeDelimitedCsv", () => {
  it("parsea el BOM UTF-8 y el header real de SEPA", () => {
    const { headers } = parsePipeDelimitedCsv(REAL_COMERCIO_CSV);
    expect(headers[0]).toBe("id_comercio"); // sin el BOM colgando
    expect(headers).toHaveLength(8);
  });

  it("parsea la fila de datos real de Makro", () => {
    const { rows } = parsePipeDelimitedCsv(REAL_COMERCIO_CSV);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id_comercio: "61",
      comercio_razon_social: "HIPERMAYORISTA MAKRO S.A",
      comercio_bandera_nombre: "HIPERMAYORISTA MAKRO",
    });
  });

  it("descarta la línea de pie ('última actualización: ...') sin romper el parseo", () => {
    const { rows, skippedLines } = parsePipeDelimitedCsv(REAL_COMERCIO_CSV);
    expect(skippedLines).toBe(1);
    expect(rows).toHaveLength(1);
  });

  it("archivo vacío no rompe", () => {
    expect(parsePipeDelimitedCsv("")).toEqual({ headers: [], rows: [], skippedLines: 0 });
  });
});
