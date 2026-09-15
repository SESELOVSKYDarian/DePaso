import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { confidenceLabel, formatRecency, PRICE_DISCLOSURE_NOTICE, sourceTypeLabel } from "./priceDisclosure";

describe("sourceTypeLabel (BUSINESS-RULES.md p.9 — divulgación obligatoria)", () => {
  it("traduce los sourceType reales del schema a copy humana", () => {
    expect(sourceTypeLabel("OFFICIAL_SEPA")).toBe("Fuente oficial (SEPA)");
    expect(sourceTypeLabel("COMMUNITY")).toBe("Reportado por la comunidad");
    expect(sourceTypeLabel("ESTIMATED")).toBe("Estimado");
  });

  it("nunca inventa una etiqueta para un sourceType desconocido", () => {
    expect(sourceTypeLabel("ALGO_NUEVO_SIN_MAPEAR")).toBe("Fuente desconocida");
  });

  it("sin sourceType, es honesto en vez de asumir", () => {
    expect(sourceTypeLabel(undefined)).toBe("Fuente desconocida");
  });
});

describe("confidenceLabel", () => {
  it("traduce los 3 buckets reales de ConfidenceLevel", () => {
    expect(confidenceLabel("HIGH")).toBe("Confianza alta");
    expect(confidenceLabel("MEDIUM")).toBe("Confianza media");
    expect(confidenceLabel("LOW")).toBe("Confianza baja");
  });

  it("sin confidence, no muestra nada en vez de un texto inventado", () => {
    expect(confidenceLabel(undefined)).toBeNull();
  });

  it("un valor no reconocido tampoco inventa una etiqueta", () => {
    expect(confidenceLabel("ALGO_RARO")).toBeNull();
  });
});

describe("formatRecency (ejemplo literal de BUSINESS-RULES.md p.9: 'Actualizado hace 2h')", () => {
  const NOW = new Date("2026-09-15T12:00:00.000Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sin timestamp, no muestra nada", () => {
    expect(formatRecency(undefined)).toBeNull();
  });

  it("timestamp inválido no rompe, no muestra nada", () => {
    expect(formatRecency("no-es-una-fecha")).toBeNull();
  });

  it("hace menos de un minuto", () => {
    expect(formatRecency(new Date(NOW - 30_000).toISOString())).toBe("Actualizado recién");
  });

  it("hace 45 minutos", () => {
    expect(formatRecency(new Date(NOW - 45 * 60_000).toISOString())).toBe("Actualizado hace 45 min");
  });

  it("hace 4 horas — el ejemplo literal de la doc ('hace 2h')", () => {
    expect(formatRecency(new Date(NOW - 4 * 60 * 60_000).toISOString())).toBe("Actualizado hace 4h");
  });

  it("hace 1 día (singular)", () => {
    expect(formatRecency(new Date(NOW - 24 * 60 * 60_000).toISOString())).toBe("Actualizado hace 1 día");
  });

  it("hace 5 días (plural)", () => {
    expect(formatRecency(new Date(NOW - 5 * 24 * 60 * 60_000).toISOString())).toBe("Actualizado hace 5 días");
  });

  it("hace más de 30 días — deja de mentir con un número, avisa que puede estar vieja", () => {
    expect(formatRecency(new Date(NOW - 40 * 24 * 60 * 60_000).toISOString())).toBe("Puede estar desactualizado");
  });

  it("un timestamp futuro (reloj desincronizado) no muestra un número negativo", () => {
    expect(formatRecency(new Date(NOW + 60_000).toISOString())).toBe("Actualizado recién");
  });
});

describe("PRICE_DISCLOSURE_NOTICE", () => {
  it("es el texto legal exacto de BUSINESS-RULES.md p.9, no una paráfrasis", () => {
    expect(PRICE_DISCLOSURE_NOTICE).toBe(
      "Los precios y ahorros son estimaciones informativas y pueden variar por sucursal, stock, " +
        "promociones, medios de pago o actualizaciones. Verificá el precio final en el comercio."
    );
  });
});
