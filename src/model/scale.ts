export type ScaleStatus = "estimated" | "calibrated";

export interface ScaleInfo {
  pxPerCm: number;
  status: ScaleStatus;
}

export interface ScaleEstimateInput {
  devicePixelRatio?: number;
}

export interface CalibrationInput {
  expectedCm: number;
  measuredPx: number;
  basePxPerCm: number;
}

export const CSS_PX_PER_INCH = 96;
export const CM_PER_INCH = 2.54;

export function estimateScale(_input: ScaleEstimateInput = {}): ScaleInfo {
  return {
    pxPerCm: CSS_PX_PER_INCH / CM_PER_INCH,
    status: "estimated",
  };
}

export function getPixelsForCm(cm: number, scale: ScaleInfo): number {
  return cm * scale.pxPerCm;
}

export function referencePixelsToCalibrationFactor(input: CalibrationInput): number {
  if (
    !Number.isFinite(input.expectedCm) ||
    !Number.isFinite(input.measuredPx) ||
    !Number.isFinite(input.basePxPerCm) ||
    input.expectedCm <= 0 ||
    input.measuredPx <= 0 ||
    input.basePxPerCm <= 0
  ) {
    return 1;
  }

  return input.measuredPx / input.expectedCm / input.basePxPerCm;
}

export function applyCalibration(scale: ScaleInfo, factor: number): ScaleInfo {
  if (!Number.isFinite(factor) || factor <= 0) {
    return scale;
  }

  return {
    pxPerCm: scale.pxPerCm * factor,
    status: "calibrated",
  };
}
