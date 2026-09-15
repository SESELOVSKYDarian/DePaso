import { describe, expect, it } from "vitest";
import { extractUnitFromDescription } from "./productParsing";

describe("extractUnitFromDescription (heurístico, sección 8 — descripciones reales de SEPA)", () => {
  it("extrae gramos de una descripción real", () => {
    expect(extractUnitFromDescription("DEO AP MASC VERITAS ORIG PTX60GR")).toEqual({ unit: "g", unitSize: 60 });
  });

  it("extrae mililitros de una descripción real", () => {
    expect(extractUnitFromDescription("ACOND SEDAL REST.INSTANT BTX190ML")).toEqual({ unit: "ml", unitSize: 190 });
  });

  it("extrae kilos de una descripción real", () => {
    expect(extractUnitFromDescription("TALCO ALGABO FLORAL DPX400G")).toEqual({ unit: "g", unitSize: 400 });
  });

  it("sin patrón reconocible, cae a 1 unidad suelta (fallback documentado)", () => {
    expect(extractUnitFromDescription("BANQUETA MOR ACERO PLEGABLE")).toEqual({ unit: "un", unitSize: 1 });
  });

  // "LTR"/"KGM" son abreviaturas reales de SEPA Minorista encontradas probando la
  // búsqueda de productos con datos reales — antes de este fix caían al fallback
  // "1un" porque "lt"/"kg" matcheaban primero y el `\b` fallaba contra la letra
  // siguiente ("r"/"m"), sin llegar nunca a intentar la alternativa más larga.
  it("extrae litros de la abreviatura real 'LTR' (SEPA Minorista)", () => {
    expect(extractUnitFromDescription("GASEOSA COCA COLA BOT 2.25 LTR")).toEqual({ unit: "L", unitSize: 2.25 });
  });

  it("extrae kilos de la abreviatura real 'KGM' (SEPA Minorista)", () => {
    expect(extractUnitFromDescription("SAL ENTREFINA CELUSAL EST 1 KGM")).toEqual({ unit: "kg", unitSize: 1 });
  });
});
