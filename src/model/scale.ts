import { DEVICE_SCALE_PROFILES, type DeviceScaleProfile } from "./deviceProfiles";

export type ScaleStatus = "estimated" | "calibrated";
export type ScaleSource =
  | "saved-calibration"
  | "saved-monitor"
  | "device-model"
  | "device-signature"
  | "css-fallback";
export type ScaleConfidence = "high" | "medium" | "low";

export interface ScaleInfo {
  pxPerCm: number;
  status: ScaleStatus;
  source?: ScaleSource;
  confidence?: ScaleConfidence;
  deviceName?: string;
}

export interface ScaleEstimateInput {
  screenWidthCss?: number;
  screenHeightCss?: number;
  devicePixelRatio?: number;
  platform?: "ios" | "android" | "desktop" | "unknown";
  userAgent?: string;
  deviceModel?: string;
  isMobile?: boolean;
}

export interface CalibrationInput {
  expectedCm: number;
  measuredPx: number;
  basePxPerCm: number;
}

export const CSS_PX_PER_INCH = 96;
export const CM_PER_INCH = 2.54;
const CONSENSUS_TOLERANCE = 0.02;

const fallbackScale = (): ScaleInfo => ({
  pxPerCm: CSS_PX_PER_INCH / CM_PER_INCH,
  status: "estimated",
  source: "css-fallback",
  confidence: "low",
});

export function normalizeScreen(width: number, height: number) {
  return { shortSide: Math.min(width, height), longSide: Math.max(width, height) };
}

export function createScreenSignature(input: ScaleEstimateInput): string | null {
  const { screenWidthCss, screenHeightCss, devicePixelRatio } = input;
  if (
    !Number.isFinite(screenWidthCss) || !Number.isFinite(screenHeightCss) ||
    !Number.isFinite(devicePixelRatio) || screenWidthCss! <= 0 ||
    screenHeightCss! <= 0 || devicePixelRatio! <= 0
  ) return null;

  const screen = normalizeScreen(screenWidthCss!, screenHeightCss!);
  return `${screen.shortSide}x${screen.longSide}@${Number(devicePixelRatio!.toFixed(3))}`;
}

function profilePxPerCm(profile: DeviceScaleProfile, cssShortSide: number): number {
  const native = normalizeScreen(profile.nativeWidthPx, profile.nativeHeightPx);
  const ppi = Math.hypot(profile.nativeWidthPx, profile.nativeHeightPx) / profile.diagonalInches;
  const physicalShortSideCm = (native.shortSide / ppi) * CM_PER_INCH;
  return cssShortSide / physicalShortSideCm;
}

function sameDpr(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.06;
}

export function estimateScale(
  input: ScaleEstimateInput = {},
  profiles: readonly DeviceScaleProfile[] = DEVICE_SCALE_PROFILES,
): ScaleInfo {
  const { screenWidthCss, screenHeightCss, devicePixelRatio } = input;
  if (!input.isMobile || !Number.isFinite(screenWidthCss) ||
      !Number.isFinite(screenHeightCss) || !Number.isFinite(devicePixelRatio) ||
      screenWidthCss! <= 0 || screenHeightCss! <= 0 || devicePixelRatio! <= 0) {
    return fallbackScale();
  }

  const screen = normalizeScreen(screenWidthCss!, screenHeightCss!);
  const modelHaystack = `${input.deviceModel ?? ""} ${input.userAgent ?? ""}`.toLowerCase();
  const platformProfiles = profiles.filter((profile) =>
    !input.platform || input.platform === "unknown" || profile.platform === input.platform,
  );
  const scoredModelMatches = platformProfiles.map((profile) => ({
    profile,
    score: Math.max(0, ...(profile.modelTokens ?? [])
      .filter((token) => modelHaystack.includes(token.toLowerCase()))
      .map((token) => token.length)),
  })).filter(({ score }) => score > 0);
  const bestModelScore = Math.max(0, ...scoredModelMatches.map(({ score }) => score));
  const modelMatches = scoredModelMatches
    .filter(({ score }) => score === bestModelScore)
    .map(({ profile }) => profile);

  if (modelMatches.length === 1) {
    const profile = modelMatches[0];
    return {
      pxPerCm: profilePxPerCm(profile, screen.shortSide),
      status: "estimated",
      source: "device-model",
      confidence: "high",
      deviceName: profile.name,
    };
  }

  const signatureMatches = platformProfiles.filter((profile) =>
    profile.signatures.some((signature) => {
      const candidate = normalizeScreen(signature.screenWidthCss, signature.screenHeightCss);
      return candidate.shortSide === screen.shortSide && candidate.longSide === screen.longSide &&
        sameDpr(signature.devicePixelRatio, devicePixelRatio!);
    }),
  );

  if (signatureMatches.length === 0) return fallbackScale();
  const scales = signatureMatches.map((profile) => profilePxPerCm(profile, screen.shortSide));
  const min = Math.min(...scales);
  const max = Math.max(...scales);
  if (signatureMatches.length > 1 && (max - min) / min > CONSENSUS_TOLERANCE) {
    return fallbackScale();
  }

  const sorted = [...scales].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return {
    pxPerCm: median,
    status: "estimated",
    source: "device-signature",
    confidence: signatureMatches.length === 1 ? "high" : "medium",
    deviceName: signatureMatches.length === 1 ? signatureMatches[0].name : undefined,
  };
}

export function estimateMonitorScale(
  input: Pick<ScaleEstimateInput, "screenWidthCss" | "screenHeightCss" | "devicePixelRatio">,
  diagonalInches: number,
): ScaleInfo | null {
  const { screenWidthCss, screenHeightCss, devicePixelRatio } = input;
  if (!Number.isFinite(diagonalInches) || diagonalInches < 10 || diagonalInches > 100 ||
      !Number.isFinite(screenWidthCss) || !Number.isFinite(screenHeightCss) ||
      !Number.isFinite(devicePixelRatio) || screenWidthCss! <= 0 ||
      screenHeightCss! <= 0 || devicePixelRatio! <= 0) return null;

  const effectiveDiagonalPx = Math.hypot(screenWidthCss!, screenHeightCss!) * devicePixelRatio!;
  const ppi = effectiveDiagonalPx / diagonalInches;
  return {
    pxPerCm: ppi / devicePixelRatio! / CM_PER_INCH,
    status: "estimated",
    source: "saved-monitor",
    confidence: "medium",
  };
}

export function getPixelsForCm(cm: number, scale: ScaleInfo): number {
  return cm * scale.pxPerCm;
}

export function referencePixelsToCalibrationFactor(input: CalibrationInput): number | null {
  if (!Number.isFinite(input.expectedCm) || !Number.isFinite(input.measuredPx) ||
      !Number.isFinite(input.basePxPerCm) || input.expectedCm <= 0 ||
      input.measuredPx <= 0 || input.basePxPerCm <= 0) return null;
  return input.measuredPx / input.expectedCm / input.basePxPerCm;
}

export function applyCalibration(scale: ScaleInfo, factor: number): ScaleInfo {
  if (!Number.isFinite(factor) || factor <= 0) return scale;
  return {
    pxPerCm: scale.pxPerCm * factor,
    status: "calibrated",
    source: "saved-calibration",
    confidence: "high",
  };
}
