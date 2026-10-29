import { describe, expect, it } from "vitest";
import { extractJsonObject } from "./llm";
import { parseModelOutput, splitShoppingText } from "./shoppingParse";

describe("parseModelOutput", () => {
  it("lee el JSON aunque venga con ```json y texto alrededor", () => {
    const raw = 'Claro, acá va:\n```json\n{"items":[{"term":"Leche","quantity":2,"type":"leche"},{"term":"yerba taragui","quantity":1,"type":"yerba"}]}\n```';
    expect(parseModelOutput(raw)).toEqual([
      { term: "leche", quantity: 2, typeId: "leche" },
      { term: "yerba taragui", quantity: 1, typeId: "yerba" },
    ]);
  });

  it("descarta tipos inventados y corrige cantidades inválidas", () => {
    const raw = '{"items":[{"term":"coca","quantity":"tres","type":"bebida_magica"},{"term":"pan","quantity":2.7}]}';
    const items = parseModelOutput(raw);
    expect(items?.[0]).toEqual({ term: "coca", quantity: 1, typeId: null });
    expect(items?.[1]?.typeId).toBeNull();
  });

  it("devuelve null si no hay JSON útil", () => {
    expect(parseModelOutput("no entendí")).toBeNull();
    expect(parseModelOutput('{"items":[]}')).toBeNull();
    expect(parseModelOutput('{"otra":"cosa"}')).toBeNull();
  });

  it("corta en 12 ítems", () => {
    const many = JSON.stringify({ items: Array.from({ length: 20 }, (_, i) => ({ term: `producto ${i}`, quantity: 1 })) });
    expect(parseModelOutput(many)).toHaveLength(12);
  });
});

describe("extractJsonObject", () => {
  it("ignora texto suelto y JSON roto", () => {
    expect(extractJsonObject("hola")).toBeNull();
    expect(extractJsonObject("{ roto")).toBeNull();
    expect(extractJsonObject('prefijo {"a":1} sufijo')).toEqual({ a: 1 });
  });
});

describe("splitShoppingText (sin IA)", () => {
  it("separa por comas y por 'y' y lee cantidades", () => {
    expect(splitShoppingText("necesito leche, 2 gaseosas y yerba")).toEqual([
      { term: "leche", quantity: 1, typeId: null },
      { term: "gaseosas", quantity: 2, typeId: null },
      { term: "yerba", quantity: 1, typeId: null },
    ]);
  });

  it("entiende cantidades en palabras y saca muletillas", () => {
    const items = splitShoppingText("Quiero comprar tres paquetes de fideos. También arroz");
    expect(items.map((item) => item.term)).toContain("arroz");
    expect(items[0]).toMatchObject({ quantity: 3 });
  });

  it("no inventa ítems con texto vacío", () => {
    expect(splitShoppingText("  , , ")).toEqual([]);
  });
});
