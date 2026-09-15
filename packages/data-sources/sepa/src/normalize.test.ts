import { describe, expect, it } from "vitest";
import { isValidGtinChecksum, normalizeProductName } from "./normalize";

describe("isValidGtinChecksum", () => {
  it("acepta un EAN real del feed SEPA (Makro, DEO AP MASC VERITAS)", () => {
    expect(isValidGtinChecksum("7791520012170")).toBe(true);
  });

  it("acepta otro EAN real del feed (bowl octogonal)", () => {
    expect(isValidGtinChecksum("7798098700126")).toBe(true);
  });

  it("rechaza un dígito verificador alterado", () => {
    expect(isValidGtinChecksum("7791520012171")).toBe(false);
  });

  it("rechaza longitudes que no son EAN-8/12/13/14", () => {
    expect(isValidGtinChecksum("123")).toBe(false);
    expect(isValidGtinChecksum("abc")).toBe(false);
  });
});

describe("normalizeProductName", () => {
  it("colapsa mayúsculas y puntuación (coma/punto se tratan como separador, no como decimal)", () => {
    expect(normalizeProductName("Coca-Cola 2,25 Lt.")).toBe("coca-cola 2 25 lt");
  });

  it("dos variantes del mismo producto normalizan distinto sólo por espaciado/puntuación real (sección 8 — heurístico, no matching semántico)", () => {
    expect(normalizeProductName("ACOND SEDAL REST.INSTANT BTX190ML")).toBe("acond sedal rest instant btx190ml");
  });
});
