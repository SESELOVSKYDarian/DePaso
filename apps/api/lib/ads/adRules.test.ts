import { adRequestInputSchema, AD_PRICE_PER_DAY, MAX_ACTIVE_ADS, minAdAmount } from "@depaso/validation";
import { describe, expect, it } from "vitest";

const base = { title: "Hoy 2x1", durationDays: 7 };

describe("reglas de la publicidad", () => {
  it("el mínimo es el precio base por día por la cantidad de días", () => {
    expect(minAdAmount("VIDEO", 7)).toBe(AD_PRICE_PER_DAY.VIDEO * 7);
    expect(MAX_ACTIVE_ADS).toBe(3);
  });

  it("el mínimo sale de los precios que fije el administrador", () => {
    const custom = { ...AD_PRICE_PER_DAY, BANNER: 1000 };
    expect(minAdAmount("BANNER", 7, custom)).toBe(7000);
    expect(minAdAmount("BANNER", 7)).toBe(AD_PRICE_PER_DAY.BANNER * 7);
  });

  it("el banner puede llevar imagen o no", () => {
    const offeredAmount = minAdAmount("BANNER", 7);
    expect(adRequestInputSchema.safeParse({ ...base, kind: "BANNER", offeredAmount }).success).toBe(true);
    const imageData = "data:image/jpeg;base64,AAAA";
    expect(adRequestInputSchema.safeParse({ ...base, kind: "BANNER", offeredAmount, imageData }).success).toBe(true);
  });

  it("la imagen necesita su imagen", () => {
    const offeredAmount = minAdAmount("IMAGE", 7);
    expect(adRequestInputSchema.safeParse({ ...base, kind: "IMAGE", offeredAmount }).success).toBe(false);
    const imageData = "data:image/jpeg;base64,AAAA";
    expect(adRequestInputSchema.safeParse({ ...base, kind: "IMAGE", offeredAmount, imageData }).success).toBe(true);
  });

  it("el video necesita un enlace https", () => {
    const offeredAmount = minAdAmount("VIDEO", 7);
    expect(adRequestInputSchema.safeParse({ ...base, kind: "VIDEO", offeredAmount }).success).toBe(false);
    expect(adRequestInputSchema.safeParse({ ...base, kind: "VIDEO", offeredAmount, videoUrl: "http://x.com/a.mp4" }).success).toBe(false);
    expect(adRequestInputSchema.safeParse({ ...base, kind: "VIDEO", offeredAmount, videoUrl: "https://x.com/a.mp4" }).success).toBe(true);
  });

  it("el producto destacado necesita su producto", () => {
    const offeredAmount = minAdAmount("FEATURED_PRODUCT", 7);
    expect(adRequestInputSchema.safeParse({ ...base, kind: "FEATURED_PRODUCT", offeredAmount }).success).toBe(false);
    expect(adRequestInputSchema.safeParse({ ...base, kind: "FEATURED_PRODUCT", offeredAmount, productId: "p1" }).success).toBe(true);
  });
});
