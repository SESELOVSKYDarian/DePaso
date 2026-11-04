import { adDecisionSchema, adReplySchema } from "@depaso/validation";
import { describe, expect, it } from "vitest";
import { describeDevice } from "../auth/recordLogin";

describe("negociación del monto de la publicidad", () => {
  it("proponer otro monto necesita el monto", () => {
    expect(adDecisionSchema.safeParse({ decision: "COUNTER" }).success).toBe(false);
    expect(adDecisionSchema.safeParse({ decision: "COUNTER", counterAmount: 12000 }).success).toBe(true);
  });

  it("rechazar sigue pidiendo el motivo", () => {
    expect(adDecisionSchema.safeParse({ decision: "REJECT" }).success).toBe(false);
    expect(adDecisionSchema.safeParse({ decision: "REJECT", note: "El texto no se entiende" }).success).toBe(true);
  });

  it("el comercio puede aceptar, rechazar o proponer con monto", () => {
    expect(adReplySchema.safeParse({ reply: "ACCEPT" }).success).toBe(true);
    expect(adReplySchema.safeParse({ reply: "DECLINE" }).success).toBe(true);
    expect(adReplySchema.safeParse({ reply: "PROPOSE" }).success).toBe(false);
    expect(adReplySchema.safeParse({ reply: "PROPOSE", amount: 9000 }).success).toBe(true);
  });
});

describe("aviso de inicio de sesión", () => {
  it("describe el dispositivo de forma legible", () => {
    expect(describeDevice(null)).toBe("Dispositivo desconocido");
    expect(describeDevice("okhttp/4.12.0")).toBe("App DePaso · Android");
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36")).toBe("Windows · Chrome");
    expect(describeDevice("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36")).toBe("Android · Chrome");
  });
});