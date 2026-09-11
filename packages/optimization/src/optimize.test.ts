import { describe, expect, it } from "vitest";
import { optimizeShoppingList } from "./optimize";
import type { OptimizeInput, StoreCandidateInput } from "./types";

/**
 * Casos A-E, literales de la sección 87 del master prompt. Coordenadas construidas y
 * verificadas con haversine (ver scratchpad) para que el desvío adicional real coincida
 * con el orden de magnitud narrado en cada caso — no son coordenadas reales de Mar del
 * Plata, son puntos de prueba.
 */

const WORK = { latitude: -38.0, longitude: -57.55 }; // Trabajo
const HOME = { latitude: -37.9, longitude: -57.55 }; // Casa

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

describe("optimizeShoppingList — Caso A: precio vs desvío grande", () => {
  it("BALANCED elige la opción con +300m aunque cueste más que la de +10km", async () => {
    const storeFar: StoreCandidateInput = {
      storeBranchId: "store-a-far",
      storeName: "Almacén Lejano",
      branchName: "Sucursal",
      location: { latitude: -37.95, longitude: -57.45 }, // ~9.6 km de desvío
      offers: [{ productId: "leche", brandId: null, price: 30000, confidence: "HIGH" }],
    };
    const storeClose: StoreCandidateInput = {
      storeBranchId: "store-b-close",
      storeName: "Almacén Cercano",
      branchName: "Sucursal",
      location: { latitude: -37.95, longitude: -57.5353 }, // ~295 m de desvío
      offers: [{ productId: "leche", brandId: null, price: 30800, confidence: "HIGH" }],
    };

    const result = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: [{ productId: "leche", productName: "Leche", quantity: 1 }] },
        storeCandidates: [storeFar, storeClose],
        maxDeviationMeters: 12000,
      })
    );

    const balanced = result.find((p) => p.label === "BALANCED");
    expect(balanced?.stores).toEqual(["Almacén Cercano Sucursal"]);
    expect(balanced?.additionalDistanceMeters).toBeLessThan(1000);
  });
});

describe("optimizeShoppingList — Caso B: ahorro grande vs desvío chico", () => {
  it("BALANCED favorece la barata cuando el ahorro es grande y el desvío extra es chico", async () => {
    const storeCheap: StoreCandidateInput = {
      storeBranchId: "store-cheap",
      storeName: "Mayorista",
      branchName: "Sucursal",
      location: { latitude: -37.95, longitude: -57.516 }, // ~1.5 km de desvío
      offers: [{ productId: "arroz", brandId: null, price: 22000, confidence: "HIGH" }],
    };
    const storePricier: StoreCandidateInput = {
      storeBranchId: "store-pricier",
      storeName: "Almacén Cercano",
      branchName: "Sucursal",
      location: { latitude: -37.95, longitude: -57.5353 }, // ~295 m de desvío
      offers: [{ productId: "arroz", brandId: null, price: 30000, confidence: "HIGH" }],
    };

    const result = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: [{ productId: "arroz", productName: "Arroz", quantity: 1 }] },
        storeCandidates: [storeCheap, storePricier],
      })
    );

    const balanced = result.find((p) => p.label === "BALANCED");
    expect(balanced?.stores).toEqual(["Mayorista Sucursal"]);
    expect(balanced?.totalProductCost).toBe(22000);
  });
});

describe("optimizeShoppingList — Caso C: preferencia EXACT nunca se reemplaza", () => {
  it("nunca asigna la oferta Pepsi aunque sea más barata cuando la preferencia es EXACT Coca-Cola", async () => {
    const storePepsiOnly: StoreCandidateInput = {
      storeBranchId: "store-x",
      storeName: "Kiosco X",
      branchName: "Sucursal",
      location: { latitude: -37.93, longitude: -57.548 },
      offers: [{ productId: "gaseosa", brandId: "pepsi", price: 1000, confidence: "HIGH" }],
    };
    const storeCoca: StoreCandidateInput = {
      storeBranchId: "store-y",
      storeName: "Kiosco Y",
      branchName: "Sucursal",
      location: { latitude: -37.94, longitude: -57.547 },
      offers: [{ productId: "gaseosa", brandId: "coca-cola", price: 1500, confidence: "HIGH" }],
    };

    const result = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: [{ productId: "gaseosa", productName: "Gaseosa", quantity: 1 }] },
        preferences: {
          productPreferences: [
            { productId: "gaseosa", type: "EXACT", preferredBrandId: "coca-cola" },
          ],
          storePreferences: [],
        },
        storeCandidates: [storePepsiOnly, storeCoca],
      })
    );

    expect(result.length).toBeGreaterThan(0);
    for (const plan of result) {
      const assignedPrices = plan.stops.flatMap((stop) => stop.items.map((item) => item.unitPrice));
      expect(assignedPrices).not.toContain(1000); // nunca la oferta Pepsi
    }
    // La Coca-Cola sí debe poder comprarse en al menos un plan (Kiosco Y está en el corredor).
    expect(result.some((plan) => plan.missingProductIds.length === 0)).toBe(true);
  });
});

describe("optimizeShoppingList — Caso D: comercio REQUIRED", () => {
  it("todo plan válido incluye el comercio marcado REQUIRED para la categoría", async () => {
    const carniceria: StoreCandidateInput = {
      storeBranchId: "carniceria-x",
      storeName: "Carnicería X",
      branchName: "Sucursal",
      location: { latitude: -37.92, longitude: -57.548 },
      offers: [{ productId: "carne-picada", brandId: null, price: 2000, confidence: "HIGH" }],
    };
    const verduleria: StoreCandidateInput = {
      storeBranchId: "verduleria-y",
      storeName: "Verdulería Y",
      branchName: "Sucursal",
      location: { latitude: -37.96, longitude: -57.5465 },
      offers: [{ productId: "lechuga", brandId: null, price: 500, confidence: "HIGH" }],
    };

    const result = await optimizeShoppingList(
      baseInput({
        shoppingList: {
          items: [
            { productId: "carne-picada", productName: "Carne picada", quantity: 1 },
            { productId: "lechuga", productName: "Lechuga", quantity: 1 },
          ],
        },
        preferences: {
          productPreferences: [],
          storePreferences: [
            { category: "Carne", type: "REQUIRED", storeBranchId: "carniceria-x" },
          ],
        },
        storeCandidates: [carniceria, verduleria],
      })
    );

    expect(result.length).toBeGreaterThan(0);
    for (const plan of result) {
      expect(plan.stores.some((s) => s.startsWith("Carnicería X"))).toBe(true);
    }
  });
});

describe("optimizeShoppingList — Caso E: precio barato con LOW_CONFIDENCE", () => {
  it("penaliza la oferta barata de baja confianza frente a una casi igual de alta confianza", async () => {
    const storeLowConfidence: StoreCandidateInput = {
      storeBranchId: "store-low-confidence",
      storeName: "Despensa Dudosa",
      branchName: "Sucursal",
      location: { latitude: -37.97, longitude: -57.544 },
      offers: [{ productId: "yerba", brandId: null, price: 1000, confidence: "LOW" }],
    };
    const storeTrusted: StoreCandidateInput = {
      storeBranchId: "store-trusted",
      storeName: "Almacén Confiable",
      branchName: "Sucursal",
      location: { latitude: -37.93, longitude: -57.546 },
      offers: [{ productId: "yerba", brandId: null, price: 1050, confidence: "HIGH" }],
    };

    const result = await optimizeShoppingList(
      baseInput({
        shoppingList: { items: [{ productId: "yerba", productName: "Yerba", quantity: 1 }] },
        storeCandidates: [storeLowConfidence, storeTrusted],
      })
    );

    const balanced = result.find((p) => p.label === "BALANCED");
    expect(balanced?.stores).toEqual(["Almacén Confiable Sucursal"]);
  });
});
