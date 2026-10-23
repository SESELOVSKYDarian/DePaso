import { describe, expect, it } from "vitest";
import { optimizeShoppingList, optimizeWithRanking } from "./optimize";
import type { OptimizeInput, StoreCandidateInput } from "./types";

/**
 * Niveles de desvío: "sin desvíos" (≤ 2 cuadras ≈ 200 m del recorrido), "intermedio"
 * (≤ 1,5 km) e "hipereconómico" (sin importar el recorrido). En cada uno gana lo más barato,
 * ya con las promos de los medios de pago. El recorrido va de norte a sur por la longitud
 * -57.55, así que cada 0,001° de longitud son ≈ 88 m de lejanía al camino.
 */

const WORK = { latitude: -38.0, longitude: -57.55 };
const HOME = { latitude: -37.9, longitude: -57.55 };

const ON_ROUTE = -57.5485; // ≈ 130 m del camino (1 cuadra)
const NEAR = -57.5353; // ≈ 1,3 km del camino
const FAR = -57.45; // ≈ 8,8 km del camino

function baseInput(overrides: Partial<OptimizeInput>): OptimizeInput {
  return {
    shoppingList: { items: [] },
    routeContext: { waypoints: [WORK, HOME] },
    preferences: { productPreferences: [], storePreferences: [] },
    storeCandidates: [],
    transportMode: "CAR",
    mode: "BALANCED",
    ...overrides,
  };
}

function store(id: string, longitude: number, offers: StoreCandidateInput["offers"]): StoreCandidateInput {
  return {
    storeBranchId: id,
    storeName: id,
    branchName: "Sucursal",
    location: { latitude: -37.95, longitude },
    offers,
  };
}

const milk = (price: number) => ({ productId: "leche", brandId: null, price, confidence: "HIGH" as const });
const milkList = { items: [{ productId: "leche", productName: "Leche", quantity: 1 }] };

describe("niveles de desvío", () => {
  it("cada nivel elige lo más barato dentro de su alcance", async () => {
    const plans = await optimizeShoppingList(
      baseInput({
        shoppingList: milkList,
        storeCandidates: [store("pegado", ON_ROUTE, [milk(3000)]), store("cerca", NEAR, [milk(2500)]), store("lejos", FAR, [milk(2000)])],
      }),
    );
    const byLabel = Object.fromEntries(plans.map((plan) => [plan.label, plan]));
    expect(byLabel.FASTEST?.stores).toEqual(["pegado Sucursal"]);
    expect(byLabel.BALANCED?.stores).toEqual(["cerca Sucursal"]);
    expect(byLabel.CHEAPEST?.stores).toEqual(["lejos Sucursal"]);
    expect(byLabel.FASTEST!.additionalDistanceMeters).toBeLessThan(byLabel.CHEAPEST!.additionalDistanceMeters);
  });

  it("devuelve los planes de menos a más desvío", async () => {
    const plans = await optimizeShoppingList(
      baseInput({ shoppingList: milkList, storeCandidates: [store("a", ON_ROUTE, [milk(3000)]), store("b", FAR, [milk(2000)])] }),
    );
    expect(plans.map((plan) => plan.label)).toEqual(["FASTEST", "BALANCED", "CHEAPEST"]);
  });

  it("si nada queda a 2 cuadras, no hay plan 'sin desvíos'", async () => {
    const plans = await optimizeShoppingList(
      baseInput({ shoppingList: milkList, storeCandidates: [store("cerca", NEAR, [milk(2500)]), store("lejos", FAR, [milk(2000)])] }),
    );
    expect(plans.map((plan) => plan.label)).toEqual(["BALANCED", "CHEAPEST"]);
  });

  it("el nivel hipereconómico ignora el recorrido por completo", async () => {
    const plans = await optimizeShoppingList(
      baseInput({ shoppingList: milkList, storeCandidates: [store("lejos", FAR, [milk(2000)])] }),
    );
    expect(plans).toHaveLength(1);
    expect(plans[0]!.label).toBe("CHEAPEST");
    expect(plans[0]!.additionalDistanceMeters).toBeGreaterThan(5000);
  });
});

describe("promos de los medios de pago", () => {
  it("elige el comercio más barato DESPUÉS de las promos", async () => {
    const candidates = [store("barato", NEAR, [milk(2000)]), store("conpromo", NEAR, [milk(2200)])];
    const withoutPromo = await optimizeShoppingList(baseInput({ shoppingList: milkList, storeCandidates: candidates }));
    expect(withoutPromo.find((p) => p.label === "BALANCED")?.stores).toEqual(["barato Sucursal"]);

    const withPromo = await optimizeShoppingList(
      baseInput({
        shoppingList: milkList,
        storeCandidates: candidates,
        // 25 % de descuento en "conpromo": 2200 → 1650, ahora gana.
        promoDiscount: (stops) => stops.filter((s) => s.storeName === "conpromo").reduce((sum, s) => sum + 0.25 * s.items.reduce((t, i) => t + i.unitPrice * i.quantity, 0), 0),
      }),
    );
    expect(withPromo.find((p) => p.label === "BALANCED")?.stores).toEqual(["conpromo Sucursal"]);
  });
});

describe("paradas de más", () => {
  const two = [
    { productId: "leche", productName: "Leche", quantity: 1 },
    { productId: "yerba", productName: "Yerba", quantity: 1 },
  ];
  const yerba = (price: number) => ({ productId: "yerba", brandId: null, price, confidence: "HIGH" as const });

  it("no manda a un segundo local por unos pesos", async () => {
    const plans = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: two },
        storeCandidates: [store("uno", NEAR, [milk(2000), yerba(3000)]), store("dos", NEAR, [milk(1900), yerba(3100)])],
      }),
    );
    const intermediate = plans.find((p) => p.label === "BALANCED")!;
    expect(intermediate.numberOfStops).toBe(1);
  });

  it("sí suma una parada cuando el ahorro es grande", async () => {
    const plans = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: two },
        storeCandidates: [store("a", NEAR, [milk(1000), yerba(9000)]), store("b", NEAR, [milk(5000), yerba(3000)])],
      }),
    );
    const intermediate = plans.find((p) => p.label === "BALANCED")!;
    expect(intermediate.numberOfStops).toBe(2);
    expect(intermediate.totalProductCost).toBe(4000);
  });

  it("prefiere cubrir toda la lista antes que ahorrar", async () => {
    const plans = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: two },
        storeCandidates: [store("solo-leche", NEAR, [milk(100)]), store("completo", NEAR, [milk(2000), yerba(2000)])],
      }),
    );
    const intermediate = plans.find((p) => p.label === "BALANCED")!;
    expect(intermediate.missingProductIds).toEqual([]);
  });
});

describe("ranking de comercios más baratos", () => {
  it("ordena por costo de la lista completa y marca la lejanía al recorrido", async () => {
    const { ranking } = await optimizeWithRanking(
      baseInput({
        shoppingList: milkList,
        storeCandidates: [store("caro", ON_ROUTE, [milk(3000)]), store("barato", FAR, [milk(2000)])],
      }),
    );
    expect(ranking.map((entry) => entry.storeName)).toEqual(["barato", "caro"]);
    expect(ranking[0]!.distanceFromRouteMeters).toBeGreaterThan(5000);
    expect(ranking[1]!.distanceFromRouteMeters).toBeLessThan(200);
  });
});

describe("preferencias y confianza", () => {
  it("nunca reemplaza una marca EXACT por otra más barata", async () => {
    const plans = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: [{ productId: "gaseosa", productName: "Gaseosa", quantity: 1 }] },
        preferences: { productPreferences: [{ productId: "gaseosa", type: "EXACT", preferredBrandId: "coca-cola" }], storePreferences: [] },
        storeCandidates: [
          store("kiosco-x", NEAR, [{ productId: "gaseosa", brandId: "pepsi", price: 1000, confidence: "HIGH" }]),
          store("kiosco-y", NEAR, [{ productId: "gaseosa", brandId: "coca-cola", price: 1500, confidence: "HIGH" }]),
        ],
      }),
    );
    expect(plans.length).toBeGreaterThan(0);
    for (const plan of plans) {
      expect(plan.stops.flatMap((stop) => stop.items.map((item) => item.unitPrice))).not.toContain(1000);
    }
  });

  it("todo plan incluye el comercio REQUIRED", async () => {
    const plans = await optimizeShoppingList(
      baseInput({
        shoppingList: {
          items: [
            { productId: "carne-picada", productName: "Carne picada", quantity: 1 },
            { productId: "lechuga", productName: "Lechuga", quantity: 1 },
          ],
        },
        preferences: { productPreferences: [], storePreferences: [{ category: "Carne", type: "REQUIRED", storeBranchId: "carniceria-x" }] },
        storeCandidates: [
          store("carniceria-x", NEAR, [{ productId: "carne-picada", brandId: null, price: 2000, confidence: "HIGH" }]),
          store("verduleria-y", NEAR, [{ productId: "lechuga", brandId: null, price: 500, confidence: "HIGH" }]),
        ],
      }),
    );
    expect(plans.length).toBeGreaterThan(0);
    for (const plan of plans) {
      expect(plan.stores.some((name) => name.startsWith("carniceria-x"))).toBe(true);
    }
  });

  it("castiga la oferta barata de baja confianza frente a una casi igual de alta confianza", async () => {
    const plans = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: [{ productId: "yerba", productName: "Yerba", quantity: 1 }] },
        storeCandidates: [
          store("dudosa", NEAR, [{ productId: "yerba", brandId: null, price: 1000, confidence: "LOW" }]),
          store("confiable", NEAR, [{ productId: "yerba", brandId: null, price: 1050, confidence: "HIGH" }]),
        ],
      }),
    );
    expect(plans.find((p) => p.label === "BALANCED")?.stores).toEqual(["confiable Sucursal"]);
  });
});
