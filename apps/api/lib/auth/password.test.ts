import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifica correctamente la contraseña correcta", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("nunca guarda la contraseña en texto plano dentro del hash almacenado", async () => {
    const plain = "correct horse battery staple";
    const hash = await hashPassword(plain);
    expect(hash).not.toContain(plain);
  });

  it("genera un salt distinto en cada llamada (dos hashes de la misma password difieren)", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a).not.toBe(b);
  });

  it("rechaza un hash con formato inválido en vez de tirar excepción", async () => {
    await expect(verifyPassword("cualquiera", "no-tiene-el-formato-esperado")).resolves.toBe(
      false
    );
  });
});
