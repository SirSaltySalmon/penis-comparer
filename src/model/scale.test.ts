import {
  CM_PER_INCH,
  CSS_PX_PER_INCH,
  applyCalibration,
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

  it("falls back to 1 for invalid reference calibration inputs", () => {
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
      ).toBe(1);
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
