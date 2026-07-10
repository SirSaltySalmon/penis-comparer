import { describe, expect, it } from "vitest";
import { DEVICE_SCALE_PROFILES } from "./deviceProfiles";

describe("device scale profiles", () => {
  it("contains valid, sourced, plausibly scaled profiles", () => {
    const ids = new Set<string>();
    for (const profile of DEVICE_SCALE_PROFILES) {
      expect(ids.has(profile.id), `duplicate profile id ${profile.id}`).toBe(false);
      ids.add(profile.id);
      expect(profile.sourceUrl).toMatch(/^https:\/\//);
      expect(profile.nativeWidthPx).toBeGreaterThan(0);
      expect(profile.nativeHeightPx).toBeGreaterThan(0);
      expect(profile.diagonalInches).toBeGreaterThan(4);
      for (const signature of profile.signatures) {
        expect(signature.screenWidthCss).toBeLessThanOrEqual(signature.screenHeightCss);
        const ppi = Math.hypot(profile.nativeWidthPx, profile.nativeHeightPx) / profile.diagonalInches;
        const physicalWidthCm = Math.min(profile.nativeWidthPx, profile.nativeHeightPx) / ppi * 2.54;
        expect(signature.screenWidthCss / physicalWidthCm).toBeGreaterThan(35);
        expect(signature.screenWidthCss / physicalWidthCm).toBeLessThan(80);
      }
    }
  });
});
