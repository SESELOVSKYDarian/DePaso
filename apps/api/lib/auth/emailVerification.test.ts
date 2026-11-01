import { beforeAll, describe, expect, it } from "vitest";
import { createEmailCode, verifyEmailCode } from "./emailVerification";

beforeAll(() => {
  process.env.AUTH_SESSION_SECRET = "x".repeat(40);
});

describe("código de confirmación de mail", () => {
  const now = 1_800_000_000_000;

  it("tiene 8 dígitos y valida con el mismo usuario y mail", () => {
    const code = createEmailCode("u1", "a@b.com", now);
    expect(code).toMatch(/^\d{8}$/);
    expect(verifyEmailCode(code, "u1", "a@b.com", now)).toBe(true);
  });

  it("sigue valiendo casi una hora y después vence", () => {
    const code = createEmailCode("u1", "a@b.com", now);
    expect(verifyEmailCode(code, "u1", "a@b.com", now + 40 * 60 * 1000)).toBe(true);
    expect(verifyEmailCode(code, "u1", "a@b.com", now + 3 * 60 * 60 * 1000)).toBe(false);
  });

  it("no sirve para otro usuario ni para otro mail", () => {
    const code = createEmailCode("u1", "a@b.com", now);
    expect(verifyEmailCode(code, "u2", "a@b.com", now)).toBe(false);
    expect(verifyEmailCode(code, "u1", "otro@b.com", now)).toBe(false);
  });

  it("rechaza formatos raros", () => {
    expect(verifyEmailCode("1234", "u1", "a@b.com", now)).toBe(false);
    expect(verifyEmailCode("abcdefgh", "u1", "a@b.com", now)).toBe(false);
  });
});
