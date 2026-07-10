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
    expect(
      referencePixelsToCalibrationFactor({
        expectedCm: 8.56,
        measuredPx: 400,
        basePxPerCm: CSS_PX_PER_INCH / CM_PER_INCH,
      }),
    ).toBeCloseTo(1.227, 1);
  });

  it("applies valid calibration factors", () => {
    const calibrated = applyCalibration(
      { pxPerCm: CSS_PX_PER_INCH / CM_PER_INCH, status: "estimated" },
      1.2,
    );

    expect(calibrated.status).toBe("calibrated");
    expect(calibrated.pxPerCm).toBeCloseTo((CSS_PX_PER_INCH / CM_PER_INCH) * 1.2);
  });
});
