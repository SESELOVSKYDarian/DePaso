import { beforeAll, describe, expect, it } from "vitest";
import { createResetCode, createResetToken, peekResetUserId, verifyResetCode, verifyResetToken } from "./passwordReset";

beforeAll(() => {
  process.env.AUTH_SESSION_SECRET = "test-secret";
});

describe("password reset token", () => {
  it("valida con el usuario y el hash vigentes", () => {
    const token = createResetToken("u1", "hash-viejo");
    expect(peekResetUserId(token)).toBe("u1");
    expect(verifyResetToken(token, "u1", "hash-viejo")).toBe(true);
  });

  it("deja de valer cuando cambia la contraseña (un solo uso)", () => {
    const token = createResetToken("u1", "hash-viejo");
    expect(verifyResetToken(token, "u1", "hash-nuevo")).toBe(false);
  });

  it("vence a los 30 minutos", () => {
    const now = 1_000_000;
    const token = createResetToken("u1", "h", now);
    expect(verifyResetToken(token, "u1", "h", now + 29 * 60_000)).toBe(true);
    expect(verifyResetToken(token, "u1", "h", now + 31 * 60_000)).toBe(false);
  });

  it("código de 8 dígitos: válido ~30 min, un solo uso y ligado al usuario", () => {
    const now = Date.UTC(2026, 9, 13, 12, 0, 0);
    const code = createResetCode("u1", "hash-viejo", now);
    expect(code).toMatch(/^\d{8}$/);
    expect(verifyResetCode(code, "u1", "hash-viejo", now + 5 * 60_000)).toBe(true);
    expect(verifyResetCode(code, "u1", "hash-viejo", now + 25 * 60_000)).toBe(true);
    expect(verifyResetCode(code, "u1", "hash-viejo", now + 45 * 60_000)).toBe(false);
    expect(verifyResetCode(code, "u1", "hash-nuevo", now)).toBe(false);
    expect(verifyResetCode(code, "u2", "hash-viejo", now)).toBe(false);
    expect(verifyResetCode("1234", "u1", "hash-viejo", now)).toBe(false);
  });

  it("rechaza otro usuario y firmas alteradas", () => {
    const token = createResetToken("u1", "h");
    expect(verifyResetToken(token, "u2", "h")).toBe(false);
    expect(verifyResetToken(`${token}x`, "u1", "h")).toBe(false);
    expect(verifyResetToken("basura", "u1", "h")).toBe(false);
  });
});
