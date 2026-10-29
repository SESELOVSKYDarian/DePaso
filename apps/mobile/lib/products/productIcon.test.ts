import { describe, expect, it } from "vitest";
import { productIcon } from "./productIcon";

describe("productIcon", () => {
  it("elige un ícono según el tipo de producto", () => {
    expect(productIcon("Leche entera La Serenísima 1 L")).toBe("water-outline");
    expect(productIcon("Detergente Ala Limón")).toBe("flask-outline");
    expect(productIcon("Cerveza Quilmes 1 L")).toBe("beer-outline");
    expect(productIcon("Atún en aceite")).toBe("fish-outline");
  });

  it("ignora tildes y mayúsculas", () => {
    expect(productIcon("CAFÉ MOLIDO")).toBe("cafe-outline");
  });

  it("usa la canasta cuando no reconoce nada", () => {
    expect(productIcon("Producto raro")).toBe("basket-outline");
    expect(productIcon(null)).toBe("basket-outline");
  });
});
