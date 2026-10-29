import type { BrandLogo } from "@depaso/validation";
import { describe, expect, it } from "vitest";
import { findBrandLogo } from "./matchBrandLogo";

const logo = (slug: string, aliases: string[]): BrandLogo => ({ slug, name: slug, aliases, imageDataUri: "data:image/png;base64,AA==" });
const LOGOS = [logo("coto", ["coto"]), logo("vea", ["vea"]), logo("dia", ["dia"]), logo("la-anonima", ["la anonima"])];

describe("findBrandLogo", () => {
  it("reconoce la cadena aunque el nombre traiga más palabras o tildes", () => {
    expect(findBrandLogo(LOGOS, "Coto Hipermercado")?.slug).toBe("coto");
    expect(findBrandLogo(LOGOS, "Supermercados Día")?.slug).toBe("dia");
    expect(findBrandLogo(LOGOS, "LA ANÓNIMA")?.slug).toBe("la-anonima");
  });

  it("compara palabras enteras: Avea no es Vea", () => {
    expect(findBrandLogo(LOGOS, "Avea Mercado")).toBeNull();
  });

  it("devuelve null si no hay logo", () => {
    expect(findBrandLogo(LOGOS, "Almacén Dorrego")).toBeNull();
    expect(findBrandLogo([], "Coto")).toBeNull();
  });
});
