import { describe, expect, it } from "vitest";
import { dayStamp, msUntilMidnight } from "./dayStamp";

describe("dayStamp", () => {
  it("devuelve la fecha local con ceros a la izquierda", () => {
    expect(dayStamp(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("cambia justo a las 00:00", () => {
    expect(dayStamp(new Date(2026, 9, 29, 23, 59, 59))).not.toBe(dayStamp(new Date(2026, 9, 30, 0, 0, 0)));
  });
});

describe("msUntilMidnight", () => {
  it("cuenta lo que falta hasta las 00:00 del día siguiente", () => {
    expect(msUntilMidnight(new Date(2026, 9, 29, 23, 0, 0))).toBe(60 * 60 * 1000);
  });

  it("a las 00:00 en punto falta un día entero", () => {
    expect(msUntilMidnight(new Date(2026, 9, 29, 0, 0, 0))).toBe(24 * 60 * 60 * 1000);
  });
});
