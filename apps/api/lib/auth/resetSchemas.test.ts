import { resetPasswordRequestSchema, verifyResetCodeRequestSchema } from "@depaso/validation";
import { describe, expect, it } from "vitest";

describe("schemas de recuperación de contraseña", () => {
  it("verify-reset-code acepta 8 dígitos y rechaza el resto", () => {
    const ok = verifyResetCodeRequestSchema.safeParse({ email: "Persona@Correo.com ", code: "12345678" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.email).toBe("persona@correo.com");

    for (const code of ["1234567", "123456789", "abcdefgh", "dddddddd", "1234 678", ""]) {
      expect(verifyResetCodeRequestSchema.safeParse({ email: "a@b.com", code }).success).toBe(false);
    }
  });

  it("reset-password acepta código de 8 dígitos o token, y exige contraseña mínima", () => {
    expect(
      resetPasswordRequestSchema.safeParse({ email: "a@b.com", code: "00123456", password: "12345678" }).success,
    ).toBe(true);
    expect(resetPasswordRequestSchema.safeParse({ token: "abcdefghijkl", password: "12345678" }).success).toBe(true);
    expect(
      resetPasswordRequestSchema.safeParse({ email: "a@b.com", code: "dddddddd", password: "12345678" }).success,
    ).toBe(false);
    expect(resetPasswordRequestSchema.safeParse({ email: "a@b.com", code: "00123456", password: "corta" }).success).toBe(
      false,
    );
  });
});
