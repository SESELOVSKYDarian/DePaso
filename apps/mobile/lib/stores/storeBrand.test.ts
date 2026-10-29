import { describe, expect, it } from "vitest";
import { storeBrand } from "./storeBrand";

describe("storeBrand", () => {
  it("reconoce las cadenas grandes aunque el nombre traiga más palabras", () => {
    expect(storeBrand("Coto Hipermercado").initials).toBe("C");
    expect(storeBrand("Carrefour Express").background).toBe("#004E9F");
    expect(storeBrand("Supermercados Día").initials).toBe("Dia");
    expect(storeBrand("La Anónima").initials).toBe("LA");
  });

  it("no confunde un nombre que apenas contiene las letras", () => {
    // "Avea" no es "Vea"
    expect(storeBrand("Avea Mercado").background).toBe("#3A3A3C");
  });

  it("usa las iniciales cuando no la conoce", () => {
    expect(storeBrand("Almacén Dorrego")).toMatchObject({ initials: "AD", background: "#3A3A3C" });
  });
});
