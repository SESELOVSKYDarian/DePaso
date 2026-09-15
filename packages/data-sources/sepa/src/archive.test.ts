import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { readSepaDailyArchive } from "./archive";

function buildOuterZip(entries: { name: string; content: Buffer }[]): Buffer {
  const zip = new AdmZip();
  for (const e of entries) zip.addFile(e.name, e.content);
  return zip.toBuffer();
}

function buildInnerZip(files: Record<string, string>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) zip.addFile(name, Buffer.from(content, "utf-8"));
  return zip.toBuffer();
}

describe("readSepaDailyArchive", () => {
  it("lee un comercio válido con sus 3 CSV", () => {
    const inner = buildInnerZip({
      "comercio.csv": "id_comercio|comercio_razon_social\r\n1|Test SA\r\n",
      "sucursales.csv": "id_comercio|id_sucursal\r\n1|1\r\n",
      "productos.csv": "id_comercio|id_producto\r\n1|123\r\n",
    });
    const outer = buildOuterZip([{ name: "2026-09-13/comercio-1.zip", content: inner }]);

    const result = readSepaDailyArchive(outer);
    expect(result).toHaveLength(1);
    expect(result[0]!.comercioCsv).toContain("Test SA");
  });

  it("un ZIP anidado de 0 bytes (caso real confirmado, SEPA Minorista comercio-sepa-36) no rompe el import — se trata como comercio sin datos", () => {
    const outer = buildOuterZip([{ name: "2026-09-13/comercio-vacio.zip", content: Buffer.alloc(0) }]);

    const result = readSepaDailyArchive(outer);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      innerZipName: "2026-09-13/comercio-vacio.zip",
      comercioCsv: null,
      sucursalesCsv: null,
      productosCsv: null,
    });
  });

  it("un ZIP anidado corrupto (bytes inválidos) tampoco rompe el import", () => {
    const outer = buildOuterZip([{ name: "2026-09-13/comercio-corrupto.zip", content: Buffer.from("no soy un zip") }]);

    const result = readSepaDailyArchive(outer);
    expect(result).toHaveLength(1);
    expect(result[0]!.comercioCsv).toBeNull();
  });

  it("ignora entradas que no son .zip (ej. carpetas)", () => {
    const outer = buildOuterZip([{ name: "2026-09-13/nota.txt", content: Buffer.from("no es un comercio") }]);
    expect(readSepaDailyArchive(outer)).toHaveLength(0);
  });
});
