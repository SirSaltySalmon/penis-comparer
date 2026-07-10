import { createScreenSignature, type ScaleEstimateInput, type ScaleInfo } from "./scale";

export const SCALE_COOKIE_NAME = "physical_scale_v1";
const YEAR_SECONDS = 31_536_000;

export interface SavedScaleCookie {
  version: 1;
  pxPerCm: number;
  source: "manual-calibration" | "monitor-size";
  screenSignature: string;
  diagonalInches?: number;
  savedAt: string;
}

export function readSavedScale(input: ScaleEstimateInput): ScaleInfo | null {
  const signature = createScreenSignature(input);
  if (!signature) return null;
  const raw = document.cookie.split("; ").find((item) => item.startsWith(`${SCALE_COOKIE_NAME}=`))?.split("=").slice(1).join("=");
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as SavedScaleCookie;
    if (value.version !== 1 || value.screenSignature !== signature ||
        !Number.isFinite(value.pxPerCm) || value.pxPerCm < 20 || value.pxPerCm > 120 ||
        !["manual-calibration", "monitor-size"].includes(value.source)) return null;
    return {
      pxPerCm: value.pxPerCm,
      status: value.source === "manual-calibration" ? "calibrated" : "estimated",
      source: value.source === "manual-calibration" ? "saved-calibration" : "saved-monitor",
      confidence: value.source === "manual-calibration" ? "high" : "medium",
    };
  } catch {
    return null;
  }
}

export function saveScale(input: ScaleEstimateInput, scale: ScaleInfo, source: SavedScaleCookie["source"], diagonalInches?: number) {
  const screenSignature = createScreenSignature(input);
  if (!screenSignature || !Number.isFinite(scale.pxPerCm)) return;
  const value: SavedScaleCookie = { version: 1, pxPerCm: scale.pxPerCm, source, screenSignature, diagonalInches, savedAt: new Date().toISOString() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SCALE_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${YEAR_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export function clearSavedScale() {
  document.cookie = `${SCALE_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}
