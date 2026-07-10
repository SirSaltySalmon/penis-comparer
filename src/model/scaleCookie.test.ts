import { beforeEach, describe, expect, it } from "vitest";
import { clearSavedScale, readSavedScale, saveScale } from "./scaleCookie";
import type { ScaleEstimateInput, ScaleInfo } from "./scale";

const input: ScaleEstimateInput = {
  screenWidthCss: 1440,
  screenHeightCss: 900,
  devicePixelRatio: 1.5,
  platform: "desktop",
  isMobile: false,
};
const scale: ScaleInfo = {
  pxPerCm: 43.2,
  status: "calibrated",
  source: "saved-calibration",
  confidence: "high",
};

describe("saved scale cookie", () => {
  beforeEach(clearSavedScale);

  it("restores a calibration for the same screen", () => {
    saveScale(input, scale, "manual-calibration");
    expect(readSavedScale(input)).toMatchObject({
      pxPerCm: 43.2,
      status: "calibrated",
      source: "saved-calibration",
    });
  });

  it("does not apply a saved scale to another screen", () => {
    saveScale(input, scale, "manual-calibration");
    expect(readSavedScale({ ...input, screenWidthCss: 1920 })).toBeNull();
  });

  it("clears a saved scale", () => {
    saveScale(input, scale, "manual-calibration");
    clearSavedScale();
    expect(readSavedScale(input)).toBeNull();
  });
});
