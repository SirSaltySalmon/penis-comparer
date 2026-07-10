import {
  CM_PER_INCH,
  CSS_PX_PER_INCH,
  applyCalibration,
  estimateMonitorScale,
  estimateScale,
  getPixelsForCm,
  referencePixelsToCalibrationFactor,
} from "./scale";
import { describe, expect, it } from "vitest";

describe("scale model", () => {
  it("estimates CSS pixels per centimeter from the browser fallback", () => {
    const scale = estimateScale({ devicePixelRatio: 2 });

    expect(scale.status).toBe("estimated");
    expect(scale.pxPerCm).toBeCloseTo(CSS_PX_PER_INCH / CM_PER_INCH);
  });

  it("uses a recognized mobile signature", () => {
    const scale = estimateScale({
      screenWidthCss: 390,
      screenHeightCss: 844,
      devicePixelRatio: 3,
      platform: "ios",
      isMobile: true,
    });

    expect(scale.source).toBe("device-signature");
    expect(scale.confidence).toBe("high");
    expect(scale.deviceName).toMatch(/iPhone 12/);
    expect(scale.pxPerCm).toBeGreaterThan(55);
  });

  it("prefers the most specific Android model token", () => {
    const scale = estimateScale({
      screenWidthCss: 412,
      screenHeightCss: 892,
      devicePixelRatio: 3.5,
      platform: "android",
      deviceModel: "Pixel 6 Pro",
      isMobile: true,
    });

    expect(scale.source).toBe("device-model");
    expect(scale.deviceName).toBe("Google Pixel 6–8 Pro");
  });

  it("matches the same device in landscape", () => {
    const portrait = estimateScale({ screenWidthCss: 393, screenHeightCss: 852, devicePixelRatio: 3, platform: "ios", isMobile: true });
    const landscape = estimateScale({ screenWidthCss: 852, screenHeightCss: 393, devicePixelRatio: 3, platform: "ios", isMobile: true });
    expect(landscape.pxPerCm).toBeCloseTo(portrait.pxPerCm);
  });

  it("derives desktop scale from diagonal monitor size", () => {
    const scale = estimateMonitorScale({ screenWidthCss: 2560, screenHeightCss: 1440, devicePixelRatio: 1.5 }, 27);
    expect(scale?.source).toBe("saved-monitor");
    expect(scale?.pxPerCm).toBeCloseTo(Math.hypot(2560, 1440) / 27 / 2.54);
  });

  it("converts centimeters to pixels for a scale", () => {
    expect(getPixelsForCm(10, { pxPerCm: 40, status: "estimated" })).toBe(400);
  });

  it("derives a calibration factor from a reference measurement", () => {
    const expectedCm = 8.56;
    const measuredPx = 400;
    const basePxPerCm = CSS_PX_PER_INCH / CM_PER_INCH;
    const factor = referencePixelsToCalibrationFactor({
      expectedCm,
      measuredPx,
      basePxPerCm,
    });
    const expected = (measuredPx / expectedCm) / basePxPerCm;

    expect(factor).toBeCloseTo(expected, 6);
  });

  it("rejects invalid reference calibration inputs", () => {
    const validInput = {
      expectedCm: 8.56,
      measuredPx: 400,
      basePxPerCm: CSS_PX_PER_INCH / CM_PER_INCH,
    };
    const invalidCases = [
      { field: "expectedCm", value: 0 },
      { field: "expectedCm", value: -1 },
      { field: "expectedCm", value: Number.NaN },
      { field: "expectedCm", value: Number.POSITIVE_INFINITY },
      { field: "measuredPx", value: 0 },
      { field: "measuredPx", value: -1 },
      { field: "measuredPx", value: Number.NaN },
      { field: "measuredPx", value: Number.POSITIVE_INFINITY },
      { field: "basePxPerCm", value: 0 },
      { field: "basePxPerCm", value: -1 },
      { field: "basePxPerCm", value: Number.NaN },
      { field: "basePxPerCm", value: Number.POSITIVE_INFINITY },
    ] as const;

    for (const { field, value } of invalidCases) {
      expect(
        referencePixelsToCalibrationFactor({
          ...validInput,
          [field]: value,
        }),
      ).toBeNull();
    }
  });

  it("applies valid calibration factors", () => {
    const calibrated = applyCalibration(
      { pxPerCm: CSS_PX_PER_INCH / CM_PER_INCH, status: "estimated" },
      1.2,
    );

    expect(calibrated.status).toBe("calibrated");
    expect(calibrated.pxPerCm).toBeCloseTo((CSS_PX_PER_INCH / CM_PER_INCH) * 1.2);
  });

  it("returns the unchanged scale for invalid calibration factors", () => {
    const scale = { pxPerCm: CSS_PX_PER_INCH / CM_PER_INCH, status: "estimated" } as const;

    expect(applyCalibration(scale, 0)).toBe(scale);
    expect(applyCalibration(scale, -1)).toBe(scale);
    expect(applyCalibration(scale, Number.NaN)).toBe(scale);
    expect(applyCalibration(scale, Number.POSITIVE_INFINITY)).toBe(scale);
  });
});
