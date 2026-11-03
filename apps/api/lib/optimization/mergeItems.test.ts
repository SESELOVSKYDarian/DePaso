import { describe, expect, it } from "vitest";
import { mergeDuplicateItems } from "./mergeItems";

describe("mergeDuplicateItems", () => {
  it("junta el mismo producto en un solo renglón sumando la cantidad", () => {
    const merged = mergeDuplicateItems([
      { productId: "choco", quantity: 1 },
      { productId: "leche", quantity: 2 },
      { productId: "choco", quantity: 1 },
    ]);
    expect(merged).toEqual([
      { productId: "choco", quantity: 2 },
      { productId: "leche", quantity: 2 },
    ]);
  });

  it("no toca una lista sin repetidos", () => {
    const items = [{ productId: "a", quantity: 1 }, { productId: "b", quantity: 3 }];
    expect(mergeDuplicateItems(items)).toEqual(items);
  });
});
