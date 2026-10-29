import { describe, expect, it } from "vitest";
import { merchantDecisionInputSchema, merchantRequestInputSchema } from "@depaso/validation";

const base = { businessName: "Carrefour Mar del Plata", address: "Calle 123", latitude: -38, longitude: -57.55 };

describe("pedido de comercio", () => {
  it("exige teléfono y correo de contacto", () => {
    expect(merchantRequestInputSchema.safeParse(base).success).toBe(false);
    expect(merchantRequestInputSchema.safeParse({ ...base, phone: "223 555 0101" }).success).toBe(false);
    expect(merchantRequestInputSchema.safeParse({ ...base, phone: "223 555 0101", contactEmail: "no-es-un-mail" }).success).toBe(false);
    expect(merchantRequestInputSchema.safeParse({ ...base, phone: "223 555 0101", contactEmail: "gerencia@carrefour.com.ar" }).success).toBe(true);
  });

  it("no se puede aprobar sin confirmar la verificación", () => {
    expect(merchantDecisionInputSchema.safeParse({ decision: "APPROVE" }).success).toBe(false);
    expect(merchantDecisionInputSchema.safeParse({ decision: "APPROVE", contactVerified: false }).success).toBe(false);
    expect(merchantDecisionInputSchema.safeParse({ decision: "APPROVE", contactVerified: true }).success).toBe(true);
  });

  it("rechazar sigue pidiendo sólo el motivo", () => {
    expect(merchantDecisionInputSchema.safeParse({ decision: "REJECT", reason: "No pudimos verificarlo" }).success).toBe(true);
  });
});
