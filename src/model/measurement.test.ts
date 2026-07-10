import {
  cmToInches,
  circumferenceToDiameter,
  getPreset,
  inchesToCm,
  validateMeasurement,
} from "./measurement";
import { describe, expect, it } from "vitest";

describe("measurement model", () => {
  it("converts circumference to diameter", () => {
    expect(circumferenceToDiameter(11.66)).toBeCloseTo(3.711, 3);
  });

  it("converts between metric and imperial", () => {
    expect(cmToInches(2.54)).toBeCloseTo(1);
    expect(inchesToCm(1)).toBeCloseTo(2.54);
  });

  it("loads the Veale preset with derived diameter", () => {
    const preset = getPreset("veale-2015");

    expect(preset.lengthCm).toBe(13.12);
    expect(preset.diameterCm).toBeCloseTo(3.711, 3);
    expect(preset.sourceLabel).toContain("Veale");
  });

  it("loads the Belladelli length-only preset with Veale diameter fallback", () => {
    const preset = getPreset("belladelli-2023-length");

    expect(preset.lengthCm).toBe(13.93);
    expect(preset.diameterCm).toBeCloseTo(3.711, 3);
    expect(preset.sourceLabel).toContain("Belladelli");
  });

  it("validates measurement ranges and keeps valid values", () => {
    const result = validateMeasurement({
      lengthCm: 13,
      diameterCm: 3.7,
      fatLayerCm: 1,
      color: "#d79b88",
      unitMode: "metric",
      presetId: "custom",
    });

    expect(result.value.lengthCm).toBe(13);
    expect(result.errors).toEqual({});
  });

  it("reports invalid negative and extreme values", () => {
    const result = validateMeasurement({
      lengthCm: -1,
      diameterCm: 50,
      fatLayerCm: -2,
      color: "pink",
      unitMode: "metric",
      presetId: "custom",
    });

    expect(result.errors.lengthCm).toContain("greater than 0");
    expect(result.errors.diameterCm).toContain("20 cm");
    expect(result.errors.fatLayerCm).toContain("0 cm or greater");
    expect(result.errors.color).toContain("hex");
  });
});
