import { describe, expect, it } from "vitest";
import { joinSpeech, speechVolumeToLevel } from "./useLiveSpeech";

describe("dictado en vivo", () => {
  it("une lo confirmado con lo que se está diciendo", () => {
    expect(joinSpeech("dos leches", "y un pan")).toBe("dos leches y un pan");
    expect(joinSpeech("", "hola")).toBe("hola");
    expect(joinSpeech("  hola  ", "")).toBe("hola");
  });

  it("el volumen queda entre 0 y 1", () => {
    expect(speechVolumeToLevel(-2)).toBe(0);
    expect(speechVolumeToLevel(10)).toBe(1);
    expect(speechVolumeToLevel(4)).toBeCloseTo(0.5, 5);
    expect(speechVolumeToLevel(Number.NaN)).toBe(0);
  });
});