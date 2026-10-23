import { describe, expect, it } from "vitest";
import { closestBrand, correctBrandInTerm, phoneticKey, phoneticSimilarity, type BrandEntry } from "./phonetic";

const brands: BrandEntry[] = [
  { id: "1", name: "AGUILA", count: 120 },
  { id: "2", name: "ALA", count: 128 },
  { id: "3", name: "TARAGUI", count: 134 },
  { id: "4", name: "LA SERENISIMA", count: 426 },
  { id: "5", name: "GENERICO", count: 3227 },
  { id: "6", name: "COCA COLA", count: 80 },
];

describe("phoneticKey", () => {
  it("junta grafías que suenan igual", () => {
    expect(phoneticKey("Águila")).toBe("agila");
    expect(phoneticKey("vaca")).toBe(phoneticKey("baca"));
    expect(phoneticKey("kilo")).toBe(phoneticKey("quilo"));
  });
});

describe("phoneticSimilarity", () => {
  it("es 1 para palabras que suenan igual", () => {
    expect(phoneticSimilarity("taragüi", "taragui")).toBe(1);
  });
});

describe("closestBrand", () => {
  it("corrige 'ayla' a Águila", () => {
    expect(closestBrand("ayla", brands)?.name).toBe("AGUILA");
  });

  it("encuentra marcas de varias palabras por su palabra más larga", () => {
    expect(closestBrand("serenicima", brands)?.name).toBe("LA SERENISIMA");
  });

  it("no inventa marcas para palabras que no se parecen", () => {
    expect(closestBrand("tomate", brands)).toBeNull();
  });

  it("ignora las marcas genéricas", () => {
    expect(closestBrand("generico", brands)).toBeNull();
  });
});

describe("correctBrandInTerm", () => {
  it("deja el producto y corrige sólo la marca", () => {
    const known = new Set(["chocolate"]);
    const result = correctBrandInTerm("chocolate ayla", brands, (word) => known.has(word));
    expect(result?.brand.name).toBe("AGUILA");
    expect(result?.term).toBe("ayla");
  });

  it("devuelve null si todas las palabras son conocidas", () => {
    const known = new Set(["chocolate", "negro"]);
    expect(correctBrandInTerm("chocolate negro", brands, (word) => known.has(word))).toBeNull();
  });
});
