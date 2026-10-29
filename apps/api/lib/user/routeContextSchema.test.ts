import { describe, expect, it } from "vitest";
import { routeContextInputSchema } from "@depaso/validation";

const stop = (name: string, latitude: number, longitude: number) => ({ name, address: "Calle 1", latitude, longitude });

describe("routeContextInputSchema", () => {
  it("acepta una ruta de puntos sueltos, sin lugares guardados", () => {
    const parsed = routeContextInputSchema.safeParse({
      name: "Ruta del sábado",
      stops: [stop("Ubicación actual", -38, -57.55), stop("Shopping", -38.01, -57.54)],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.stops?.[0]?.emoji).toBe("📍");
  });

  it("sigue aceptando rutas viejas con ids de lugares", () => {
    expect(routeContextInputSchema.safeParse({ name: "Vieja", waypointPlaceIds: ["a", "b"] }).success).toBe(true);
  });

  it("rechaza una ruta sin paradas o con una sola", () => {
    expect(routeContextInputSchema.safeParse({ name: "Vacía" }).success).toBe(false);
    expect(routeContextInputSchema.safeParse({ name: "Una", stops: [stop("Casa", -38, -57.5)] }).success).toBe(false);
  });
});
