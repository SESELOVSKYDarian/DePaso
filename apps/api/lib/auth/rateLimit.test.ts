import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitStateForTests } from "./rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
  });

  it("permite hasta `max` intentos dentro de la ventana", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("ip-1", 5, 60_000)).toBe(true);
    }
  });

  it("bloquea el intento que excede `max`", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("ip-2", 5, 60_000);
    expect(checkRateLimit("ip-2", 5, 60_000)).toBe(false);
  });

  it("no comparte contador entre keys distintas", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("ip-3", 5, 60_000);
    expect(checkRateLimit("ip-4", 5, 60_000)).toBe(true);
  });
});
