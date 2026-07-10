export interface DeviceScaleProfile {
  id: string;
  name: string;
  platform: "ios" | "android";
  nativeWidthPx: number;
  nativeHeightPx: number;
  diagonalInches: number;
  signatures: readonly {
    screenWidthCss: number;
    screenHeightCss: number;
    devicePixelRatio: number;
  }[];
  modelTokens?: readonly string[];
  sourceUrl: string;
}

const apple = "https://support.apple.com/specs/iphone";
const google = "https://store.google.com/category/phones";
const samsung = "https://www.samsung.com/us/smartphones/galaxy-s-series/";
const sig = (w: number, h: number, dpr: number) => [{ screenWidthCss: w, screenHeightCss: h, devicePixelRatio: dpr }];

// Profiles are grouped when generations share the same display geometry. The
// scale calculation uses observed CSS width plus manufacturer display geometry,
// so it remains correct when native pixels do not map 1:1 through DPR.
export const DEVICE_SCALE_PROFILES: readonly DeviceScaleProfile[] = [
  { id: "iphone-12-13-mini", name: "iPhone 12/13 mini", platform: "ios", nativeWidthPx: 1080, nativeHeightPx: 2340, diagonalInches: 5.4, signatures: sig(375, 812, 3), sourceUrl: apple },
  { id: "iphone-12-14", name: "iPhone 12–14", platform: "ios", nativeWidthPx: 1170, nativeHeightPx: 2532, diagonalInches: 6.1, signatures: sig(390, 844, 3), sourceUrl: apple },
  { id: "iphone-12-14-pro-max", name: "iPhone 12–14 Plus/Pro Max", platform: "ios", nativeWidthPx: 1284, nativeHeightPx: 2778, diagonalInches: 6.7, signatures: sig(428, 926, 3), sourceUrl: apple },
  { id: "iphone-14-16", name: "iPhone 14/15 Pro or iPhone 16", platform: "ios", nativeWidthPx: 1179, nativeHeightPx: 2556, diagonalInches: 6.1, signatures: sig(393, 852, 3), sourceUrl: apple },
  { id: "iphone-14-16-large", name: "iPhone 14–16 Plus or 14/15 Pro Max", platform: "ios", nativeWidthPx: 1290, nativeHeightPx: 2796, diagonalInches: 6.7, signatures: sig(430, 932, 3), sourceUrl: apple },
  { id: "iphone-16-17-pro", name: "iPhone 16 Pro or iPhone 17/17 Pro", platform: "ios", nativeWidthPx: 1206, nativeHeightPx: 2622, diagonalInches: 6.3, signatures: sig(402, 874, 3), sourceUrl: apple },
  { id: "iphone-16-pro-max", name: "iPhone 16/17 Pro Max", platform: "ios", nativeWidthPx: 1320, nativeHeightPx: 2868, diagonalInches: 6.9, signatures: sig(440, 956, 3), sourceUrl: apple },

  { id: "pixel-6", name: "Google Pixel 6", platform: "android", nativeWidthPx: 1080, nativeHeightPx: 2400, diagonalInches: 6.4, signatures: sig(412, 915, 2.625), modelTokens: ["pixel 6"], sourceUrl: google },
  { id: "pixel-6-8-pro", name: "Google Pixel 6–8 Pro", platform: "android", nativeWidthPx: 1440, nativeHeightPx: 3120, diagonalInches: 6.7, signatures: sig(412, 892, 3.5), modelTokens: ["pixel 6 pro", "pixel 7 pro", "pixel 8 pro"], sourceUrl: google },
  { id: "pixel-7-8", name: "Google Pixel 7/8", platform: "android", nativeWidthPx: 1080, nativeHeightPx: 2400, diagonalInches: 6.2, signatures: sig(412, 915, 2.625), modelTokens: ["pixel 7", "pixel 8"], sourceUrl: google },
  { id: "pixel-9-10", name: "Google Pixel 9/10", platform: "android", nativeWidthPx: 1080, nativeHeightPx: 2424, diagonalInches: 6.3, signatures: sig(412, 924, 2.625), modelTokens: ["pixel 9", "pixel 10"], sourceUrl: google },
  { id: "pixel-9-10-pro-xl", name: "Google Pixel 9/10 Pro XL", platform: "android", nativeWidthPx: 1344, nativeHeightPx: 2992, diagonalInches: 6.8, signatures: sig(412, 917, 3.25), modelTokens: ["pixel 9 pro xl", "pixel 10 pro xl"], sourceUrl: google },

  { id: "galaxy-s20-s22", name: "Samsung Galaxy S20–S22", platform: "android", nativeWidthPx: 1440, nativeHeightPx: 3200, diagonalInches: 6.2, signatures: sig(360, 800, 3), modelTokens: ["sm-g980", "sm-g981", "sm-g991", "sm-s901"], sourceUrl: samsung },
  { id: "galaxy-s20-s22-plus", name: "Samsung Galaxy S20–S22+", platform: "android", nativeWidthPx: 1440, nativeHeightPx: 3200, diagonalInches: 6.7, signatures: sig(384, 854, 3.75), modelTokens: ["sm-g985", "sm-g986", "sm-g996", "sm-s906"], sourceUrl: samsung },
  { id: "galaxy-s23-s26", name: "Samsung Galaxy S23–S26", platform: "android", nativeWidthPx: 1080, nativeHeightPx: 2340, diagonalInches: 6.2, signatures: sig(360, 780, 3), modelTokens: ["sm-s911", "sm-s921", "sm-s931", "sm-s941"], sourceUrl: samsung },
  { id: "galaxy-s23-plus", name: "Samsung Galaxy S23+", platform: "android", nativeWidthPx: 1080, nativeHeightPx: 2340, diagonalInches: 6.6, signatures: sig(384, 832, 3), modelTokens: ["sm-s916"], sourceUrl: samsung },
  { id: "galaxy-s24-s26-plus", name: "Samsung Galaxy S24–S26+", platform: "android", nativeWidthPx: 1440, nativeHeightPx: 3120, diagonalInches: 6.7, signatures: sig(384, 832, 3.75), modelTokens: ["sm-s926", "sm-s936", "sm-s946"], sourceUrl: samsung },
  { id: "galaxy-s20-s26-ultra", name: "Samsung Galaxy S Ultra", platform: "android", nativeWidthPx: 1440, nativeHeightPx: 3120, diagonalInches: 6.8, signatures: sig(384, 832, 3.75), modelTokens: ["sm-g988", "sm-g998", "sm-s908", "sm-s918", "sm-s928", "sm-s938", "sm-s948"], sourceUrl: samsung },
];
