import { describe, expect, it } from "vitest";
import {
  bestPromoForStore,
  normalizeSourcePromo,
  parseAmount,
  parsePercent,
  promoAppliesOnDay,
  toDaysOfWeek,
  toMethodSlugs,
  type PromoForMatching,
  type SourcePromo,
} from "./paymentPromos";

const base: SourcePromo = {
  id: "abc",
  comercio: "Carrefour",
  banco: "Todos Los Bancos",
  metodo_pago: ["Cuenta DNI"],
  beneficio: "10%",
  tope: "$15.000",
  dias: [],
  vigencia: "Ver condiciones",
  url: "https://example.com",
  fuente: "clash",
  confianza: 100,
  flags_fraude: [],
};

describe("parseo del dataset", () => {
  it("parsePercent / parseAmount", () => {
    expect(parsePercent("35%")).toBe(35);
    expect(parsePercent("2,5 %")).toBe(2.5);
    expect(parsePercent("sin dato")).toBeNull();
    expect(parseAmount("$20.000")).toBe(20000);
    expect(parseAmount(null)).toBeNull();
  });

  it("toMethodSlugs ignora Crédito/Débito/No Especificado y mapea billeteras y tarjetas", () => {
    expect(toMethodSlugs(["Crédito", "Mercado Pago", "Débito", "No Especificado"])).toEqual(["mercado-pago"]);
    expect(toMethodSlugs(["Visa", "American Express", "MODO"]).sort()).toEqual(["american-express", "modo", "visa"]);
  });

  it("toDaysOfWeek: los 7 días equivalen a todos los días", () => {
    expect(toDaysOfWeek(["Martes", "Miércoles"])).toEqual([2, 3]);
    expect(
      toDaysOfWeek(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"])
    ).toEqual([]);
  });
});

describe("normalizeSourcePromo", () => {
  it("normaliza una promo válida", () => {
    const promo = normalizeSourcePromo(base);
    expect(promo).toMatchObject({
      externalId: "abc",
      normalizedRetailer: "carrefour",
      methodSlugs: ["cuenta-dni"],
      discountPercent: 10,
      capAmount: 15000,
      bank: null,
    });
  });

  it("descarta ruido del scraper: 0%, topes ínfimos, categorías genéricas, fraude", () => {
    expect(normalizeSourcePromo({ ...base, beneficio: "00%" })).toBeNull();
    expect(normalizeSourcePromo({ ...base, tope: "$6" })).toBeNull();
    expect(normalizeSourcePromo({ ...base, tope: "$18.449.910" })).toBeNull();
    expect(normalizeSourcePromo({ ...base, comercio: "Supermercados" })).toBeNull();
    expect(normalizeSourcePromo({ ...base, beneficio: "80%" })).toBeNull();
    expect(normalizeSourcePromo({ ...base, flags_fraude: ["x"] })).toBeNull();
    expect(normalizeSourcePromo({ ...base, confianza: 20 })).toBeNull();
  });
});

const promo = (over: Partial<PromoForMatching> = {}): PromoForMatching => ({
  id: "p1",
  retailer: "Carrefour",
  normalizedRetailer: "carrefour",
  bank: null,
  methodSlugs: ["cuenta-dni"],
  discountPercent: 10,
  capAmount: 15000,
  daysOfWeek: [],
  ...over,
});

describe("bestPromoForStore", () => {
  const input = { storeName: "Carrefour Hipermercado", subtotal: 10000, userMethodSlugs: ["cuenta-dni"], weekday: 2 };

  it("aplica una promo del comercio con el medio de pago del usuario", () => {
    expect(bestPromoForStore([promo()], input)?.discount).toBe(1000);
  });

  it("respeta el tope de reintegro", () => {
    expect(bestPromoForStore([promo({ discountPercent: 50, capAmount: 2000 })], input)?.discount).toBe(2000);
  });

  it("no aplica si el usuario no tiene ese medio de pago", () => {
    expect(bestPromoForStore([promo()], { ...input, userMethodSlugs: ["visa"] })).toBeNull();
  });

  it("una promo sin medio de pago identificable no se descuenta (no se sabe su condición)", () => {
    expect(bestPromoForStore([promo({ methodSlugs: [] })], { ...input, userMethodSlugs: ["cuenta-dni"] })).toBeNull();
  });

  it("no descuenta promos de un banco puntual (no se sabe si el usuario es cliente)", () => {
    expect(bestPromoForStore([promo({ bank: "Banco Galicia" })], input)).toBeNull();
  });

  it("respeta los días", () => {
    const onlyMonday = promo({ daysOfWeek: [1] });
    expect(promoAppliesOnDay(onlyMonday, 1)).toBe(true);
    expect(bestPromoForStore([onlyMonday], input)).toBeNull();
  });

  it("no aplica a otro comercio y elige el mejor descuento", () => {
    expect(bestPromoForStore([promo({ retailer: "Coto", normalizedRetailer: "coto" })], input)).toBeNull();
    const best = bestPromoForStore([promo({ id: "a" }), promo({ id: "b", discountPercent: 20, capAmount: null })], input);
    expect(best?.promo.id).toBe("b");
    expect(best?.discount).toBe(2000);
  });
});
