import { beforeAll, describe, expect, it } from "vitest";
import { createResetToken, peekResetUserId, verifyResetToken } from "./passwordReset";

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

  it("rechaza otro usuario y firmas alteradas", () => {
    const token = createResetToken("u1", "h");
    expect(verifyResetToken(token, "u2", "h")).toBe(false);
    expect(verifyResetToken(`${token}x`, "u1", "h")).toBe(false);
    expect(verifyResetToken("basura", "u1", "h")).toBe(false);
  });
});
