# Adult Measurement Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static React + Vite app that renders an adult-only educational SVG measurement visual, supports metric/imperial editing, optional calibration, an expandable guide, and shareable query-param URLs.

**Architecture:** The app is client-only. Measurement values are canonical metric values flowing through focused model, URL, scale, calibration, and SVG-rendering modules. React components compose those modules into a desktop horizontal canvas and mobile vertical canvas.

**Tech Stack:** React, Vite, TypeScript, SVG, Vitest, React Testing Library, Playwright.

---

## File Structure

- Create `package.json`: scripts, dependencies, and dev dependencies.
- Create `index.html`: Vite root document.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`: TypeScript and Vite configuration.
- Create `src/main.tsx`: React entry point.
- Create `src/App.tsx`: top-level state orchestration and page layout.
- Create `src/styles.css`: responsive layout, controls, visual surface, guide drawer, validation states.
- Create `src/model/measurement.ts`: presets, canonical measurement state, unit conversions, validation.
- Create `src/model/urlState.ts`: query-param parse/serialize and invalid-field reporting.
- Create `src/model/scale.ts`: estimated CSS-pixel-to-centimeter scale and optional calibration math.
- Create `src/components/AnatomySvg.tsx`: pure SVG visual renderer for desktop and mobile orientations.
- Create `src/components/GuideDrawer.tsx`: expandable measurement guidance, adult framing, citations, disclaimer.
- Create `src/components/MeasurementControls.tsx`: inputs for length, diameter, fat layer, color, unit mode, preset, share action.
- Create `src/components/CalibrationPanel.tsx`: optional bottom calibration tool.
- Create `src/test/setup.ts`: test environment setup.
- Create `src/model/*.test.ts`: unit tests for model, URL, and scale logic.
- Create `src/components/*.test.tsx`: component tests for controls, guide drawer, and SVG markers.
- Create `tests/e2e/visual.spec.ts`: Playwright responsive smoke checks.

---

## Task 1: Scaffold React + Vite + Test Tooling

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create package and config files**

Create `package.json`:

```json
{
  "name": "penis-comparer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.7",
    "typescript": "^5.7.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Adult Measurement Visualizer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Create minimal React entry**

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>Adult Measurement Visualizer</h1>
      <p className="lede">
        Educational, adult-only measurement visualization. Estimated scale until calibrated.
      </p>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #17212b;
  background: #f6f7f9;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 28px 0 48px;
}

.lede {
  color: #526173;
  max-width: 680px;
}
```

- [ ] **Step 3: Install dependencies**

Run:

```powershell
npm install
```

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 4: Verify scaffold**

Run:

```powershell
npm test
npm run build
```

Expected: Vitest reports no tests found or passes after configuration; Vite build completes successfully.

- [ ] **Step 5: Commit scaffold**

```powershell
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src
git commit -m "chore: scaffold react app"
```

---

## Task 2: Measurement Model And URL State

**Files:**
- Create: `src/model/measurement.ts`
- Create: `src/model/measurement.test.ts`
- Create: `src/model/urlState.ts`
- Create: `src/model/urlState.test.ts`

- [ ] **Step 1: Write failing measurement model tests**

Create `src/model/measurement.test.ts`:

```ts
import {
  cmToInches,
  circumferenceToDiameter,
  getPreset,
  inchesToCm,
  validateMeasurement,
} from "./measurement";

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
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- src/model/measurement.test.ts
```

Expected: FAIL because `src/model/measurement.ts` does not exist.

- [ ] **Step 3: Implement measurement model**

Create `src/model/measurement.ts`:

```ts
export type UnitMode = "metric" | "imperial";
export type PresetId = "veale-2015" | "belladelli-2023-length" | "custom";

export interface MeasurementState {
  lengthCm: number;
  diameterCm: number;
  fatLayerCm: number;
  color: string;
  unitMode: UnitMode;
  presetId: PresetId;
}

export interface MeasurementPreset extends MeasurementState {
  sourceLabel: string;
  sourceUrl: string;
  note: string;
}

export type MeasurementErrors = Partial<Record<keyof MeasurementState, string>>;

const VEALE_DIAMETER_CM = circumferenceToDiameter(11.66);

export const PRESETS: Record<Exclude<PresetId, "custom">, MeasurementPreset> = {
  "veale-2015": {
    lengthCm: 13.12,
    diameterCm: VEALE_DIAMETER_CM,
    fatLayerCm: 1,
    color: "#d79b88",
    unitMode: "metric",
    presetId: "veale-2015",
    sourceLabel: "Veale et al. 2015 average",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/25487360/",
    note: "Default preset because the source includes length and circumference.",
  },
  "belladelli-2023-length": {
    lengthCm: 13.93,
    diameterCm: VEALE_DIAMETER_CM,
    fatLayerCm: 1,
    color: "#d79b88",
    unitMode: "metric",
    presetId: "belladelli-2023-length",
    sourceLabel: "Belladelli et al. 2023 length benchmark",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/36792094/",
    note: "Length-only benchmark paired with Veale-derived diameter.",
  },
};

export const DEFAULT_MEASUREMENT: MeasurementState = {
  lengthCm: PRESETS["veale-2015"].lengthCm,
  diameterCm: PRESETS["veale-2015"].diameterCm,
  fatLayerCm: PRESETS["veale-2015"].fatLayerCm,
  color: PRESETS["veale-2015"].color,
  unitMode: "metric",
  presetId: "veale-2015",
};

export function circumferenceToDiameter(circumferenceCm: number): number {
  return circumferenceCm / Math.PI;
}

export function cmToInches(cm: number): number {
  return cm / 2.54;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

export function getPreset(id: Exclude<PresetId, "custom">): MeasurementPreset {
  return PRESETS[id];
}

export function roundForUrl(value: number): number {
  return Math.round(value * 100) / 100;
}

export function validateMeasurement(input: MeasurementState): {
  value: MeasurementState;
  errors: MeasurementErrors;
} {
  const errors: MeasurementErrors = {};

  if (!Number.isFinite(input.lengthCm) || input.lengthCm <= 0) {
    errors.lengthCm = "Length must be greater than 0 cm.";
  } else if (input.lengthCm > 40) {
    errors.lengthCm = "Length must be 40 cm or less.";
  }

  if (!Number.isFinite(input.diameterCm) || input.diameterCm <= 0) {
    errors.diameterCm = "Diameter must be greater than 0 cm.";
  } else if (input.diameterCm > 20) {
    errors.diameterCm = "Diameter must be 20 cm or less.";
  }

  if (!Number.isFinite(input.fatLayerCm) || input.fatLayerCm < 0) {
    errors.fatLayerCm = "Fat layer must be 0 cm or greater.";
  } else if (input.fatLayerCm > 10) {
    errors.fatLayerCm = "Fat layer must be 10 cm or less.";
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(input.color)) {
    errors.color = "Color must be a 6-digit hex value.";
  }

  return { value: input, errors };
}
```

- [ ] **Step 4: Verify measurement tests pass**

Run:

```powershell
npm test -- src/model/measurement.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing URL state tests**

Create `src/model/urlState.test.ts`:

```ts
import { DEFAULT_MEASUREMENT } from "./measurement";
import { parseUrlState, serializeUrlState } from "./urlState";

describe("url state", () => {
  it("serializes canonical metric values", () => {
    const query = serializeUrlState({
      lengthCm: 13.12,
      diameterCm: 3.71,
      fatLayerCm: 1,
      color: "#d79b88",
      unitMode: "imperial",
      presetId: "custom",
    });

    expect(query).toBe("?l=13.12&d=3.71&f=1&c=d79b88&u=imperial&p=custom");
  });

  it("parses valid params", () => {
    const result = parseUrlState("?l=15&d=4&f=0.5&c=abcdef&u=imperial&p=custom");

    expect(result.value.lengthCm).toBe(15);
    expect(result.value.diameterCm).toBe(4);
    expect(result.value.fatLayerCm).toBe(0.5);
    expect(result.value.color).toBe("#abcdef");
    expect(result.value.unitMode).toBe("imperial");
    expect(result.invalidFields).toEqual([]);
  });

  it("resets only invalid fields", () => {
    const result = parseUrlState("?l=-1&d=4&f=bad&c=zzzzzz&u=metric&p=unknown");

    expect(result.value.lengthCm).toBe(DEFAULT_MEASUREMENT.lengthCm);
    expect(result.value.diameterCm).toBe(4);
    expect(result.value.fatLayerCm).toBe(DEFAULT_MEASUREMENT.fatLayerCm);
    expect(result.value.color).toBe(DEFAULT_MEASUREMENT.color);
    expect(result.value.presetId).toBe(DEFAULT_MEASUREMENT.presetId);
    expect(result.invalidFields.sort()).toEqual(["c", "f", "l", "p"]);
  });
});
```

- [ ] **Step 6: Run URL tests to verify failure**

Run:

```powershell
npm test -- src/model/urlState.test.ts
```

Expected: FAIL because `src/model/urlState.ts` does not exist.

- [ ] **Step 7: Implement URL state**

Create `src/model/urlState.ts`:

```ts
import {
  DEFAULT_MEASUREMENT,
  MeasurementState,
  PresetId,
  UnitMode,
  roundForUrl,
  validateMeasurement,
} from "./measurement";

export interface ParsedUrlState {
  value: MeasurementState;
  invalidFields: string[];
}

const presetIds: PresetId[] = ["veale-2015", "belladelli-2023-length", "custom"];
const unitModes: UnitMode[] = ["metric", "imperial"];

export function serializeUrlState(value: MeasurementState): string {
  const params = new URLSearchParams();
  params.set("l", String(roundForUrl(value.lengthCm)));
  params.set("d", String(roundForUrl(value.diameterCm)));
  params.set("f", String(roundForUrl(value.fatLayerCm)));
  params.set("c", value.color.replace("#", "").toLowerCase());
  params.set("u", value.unitMode);
  params.set("p", value.presetId);
  return `?${params.toString()}`;
}

export function parseUrlState(search: string): ParsedUrlState {
  const params = new URLSearchParams(search);
  const invalidFields: string[] = [];
  const next: MeasurementState = { ...DEFAULT_MEASUREMENT };

  readNumber(params, "l", "lengthCm", next, invalidFields);
  readNumber(params, "d", "diameterCm", next, invalidFields);
  readNumber(params, "f", "fatLayerCm", next, invalidFields);

  const color = params.get("c");
  if (color !== null) {
    const normalized = color.startsWith("#") ? color : `#${color}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      next.color = normalized.toLowerCase();
    } else {
      invalidFields.push("c");
    }
  }

  const unit = params.get("u");
  if (unit !== null) {
    if (unitModes.includes(unit as UnitMode)) {
      next.unitMode = unit as UnitMode;
    } else {
      invalidFields.push("u");
    }
  }

  const preset = params.get("p");
  if (preset !== null) {
    if (presetIds.includes(preset as PresetId)) {
      next.presetId = preset as PresetId;
    } else {
      invalidFields.push("p");
    }
  }

  const validated = validateMeasurement(next);
  for (const key of Object.keys(validated.errors) as Array<keyof MeasurementState>) {
    const param = fieldToParam(key);
    invalidFields.push(param);
    next[key] = DEFAULT_MEASUREMENT[key] as never;
  }

  return {
    value: next,
    invalidFields: Array.from(new Set(invalidFields)),
  };
}

function readNumber(
  params: URLSearchParams,
  paramName: string,
  field: "lengthCm" | "diameterCm" | "fatLayerCm",
  next: MeasurementState,
  invalidFields: string[],
) {
  const raw = params.get(paramName);
  if (raw === null) return;

  const parsed = Number(raw);
  if (Number.isFinite(parsed)) {
    next[field] = parsed;
  } else {
    invalidFields.push(paramName);
  }
}

function fieldToParam(field: keyof MeasurementState): string {
  const map: Record<keyof MeasurementState, string> = {
    lengthCm: "l",
    diameterCm: "d",
    fatLayerCm: "f",
    color: "c",
    unitMode: "u",
    presetId: "p",
  };
  return map[field];
}
```

- [ ] **Step 8: Verify model and URL tests**

Run:

```powershell
npm test -- src/model/measurement.test.ts src/model/urlState.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit model and URL state**

```powershell
git add src/model
git commit -m "feat: add measurement model and url state"
```

---

## Task 3: Scale Estimation And Calibration Logic

**Files:**
- Create: `src/model/scale.ts`
- Create: `src/model/scale.test.ts`

- [ ] **Step 1: Write failing scale tests**

Create `src/model/scale.test.ts`:

```ts
import {
  applyCalibration,
  estimateScale,
  getPixelsForCm,
  referencePixelsToCalibrationFactor,
} from "./scale";

describe("scale", () => {
  it("uses CSS 96 px per inch as estimated fallback", () => {
    const scale = estimateScale({ devicePixelRatio: 2 });

    expect(scale.status).toBe("estimated");
    expect(scale.pxPerCm).toBeCloseTo(96 / 2.54, 4);
  });

  it("converts centimeters to pixels", () => {
    expect(getPixelsForCm(10, { pxPerCm: 40, status: "estimated" })).toBe(400);
  });

  it("computes calibration factor from a reference object", () => {
    const factor = referencePixelsToCalibrationFactor({
      expectedCm: 8.56,
      measuredPx: 400,
      basePxPerCm: 96 / 2.54,
    });

    expect(factor).toBeCloseTo(1.227, 3);
  });

  it("applies calibration factor and marks scale calibrated", () => {
    const calibrated = applyCalibration(
      { pxPerCm: 96 / 2.54, status: "estimated" },
      1.2,
    );

    expect(calibrated.status).toBe("calibrated");
    expect(calibrated.pxPerCm).toBeCloseTo((96 / 2.54) * 1.2);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm test -- src/model/scale.test.ts
```

Expected: FAIL because `src/model/scale.ts` does not exist.

- [ ] **Step 3: Implement scale logic**

Create `src/model/scale.ts`:

```ts
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

const CSS_PX_PER_INCH = 96;
const CM_PER_INCH = 2.54;

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
  if (input.expectedCm <= 0 || input.measuredPx <= 0 || input.basePxPerCm <= 0) {
    return 1;
  }

  const observedPxPerCm = input.measuredPx / input.expectedCm;
  return observedPxPerCm / input.basePxPerCm;
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
```

- [ ] **Step 4: Verify scale tests pass**

Run:

```powershell
npm test -- src/model/scale.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit scale logic**

```powershell
git add src/model/scale.ts src/model/scale.test.ts
git commit -m "feat: add scale estimation logic"
```

---

## Task 4: SVG Renderer With Desktop And Mobile Projections

**Files:**
- Create: `src/components/AnatomySvg.tsx`
- Create: `src/components/AnatomySvg.test.tsx`

- [ ] **Step 1: Write failing renderer tests**

Create `src/components/AnatomySvg.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { AnatomySvg } from "./AnatomySvg";

const measurement = {
  lengthCm: 13.12,
  diameterCm: 3.71,
  fatLayerCm: 1,
  color: "#d79b88",
  unitMode: "metric" as const,
  presetId: "veale-2015" as const,
};

describe("AnatomySvg", () => {
  it("renders desktop length marker to the tip", () => {
    render(
      <AnatomySvg
        measurement={measurement}
        orientation="horizontal"
        pxPerCm={20}
        scaleStatus="estimated"
      />,
    );

    expect(screen.getByLabelText("abstract measurement visual")).toBeInTheDocument();
    expect(screen.getByText("length to tip")).toBeInTheDocument();
    expect(screen.getByTestId("length-marker")).toHaveAttribute("data-measures", "pubic-bone-to-tip");
  });

  it("renders mobile vertical projection", () => {
    render(
      <AnatomySvg
        measurement={measurement}
        orientation="vertical"
        pxPerCm={20}
        scaleStatus="calibrated"
      />,
    );

    expect(screen.getByText("calibrated scale")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-projection")).toBeInTheDocument();
    expect(screen.getByText("diameter")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run renderer tests to verify failure**

Run:

```powershell
npm test -- src/components/AnatomySvg.test.tsx
```

Expected: FAIL because `AnatomySvg.tsx` does not exist.

- [ ] **Step 3: Implement SVG renderer**

Create `src/components/AnatomySvg.tsx`:

```tsx
import { MeasurementState } from "../model/measurement";
import { ScaleStatus } from "../model/scale";

interface AnatomySvgProps {
  measurement: MeasurementState;
  orientation: "horizontal" | "vertical";
  pxPerCm: number;
  scaleStatus: ScaleStatus;
}

export function AnatomySvg({
  measurement,
  orientation,
  pxPerCm,
  scaleStatus,
}: AnatomySvgProps) {
  if (orientation === "vertical") {
    return (
      <svg
        className="anatomy-svg anatomy-svg--vertical"
        viewBox="0 0 360 680"
        role="img"
        aria-label="abstract measurement visual"
        data-testid="mobile-projection"
      >
        <Grid width={360} height={680} />
        <text x="22" y="38" className="svg-status">
          {scaleStatus} scale
        </text>
        <VerticalRuler />
        <VerticalFigure measurement={measurement} pxPerCm={pxPerCm} />
      </svg>
    );
  }

  return (
    <svg
      className="anatomy-svg anatomy-svg--horizontal"
      viewBox="0 0 920 520"
      role="img"
      aria-label="abstract measurement visual"
    >
      <Grid width={920} height={520} />
      <text x="620" y="82" className="svg-status">
        {scaleStatus} scale
      </text>
      <HorizontalRuler />
      <HorizontalFigure measurement={measurement} pxPerCm={pxPerCm} />
    </svg>
  );
}

function Grid({ width, height }: { width: number; height: number }) {
  return (
    <>
      <defs>
        <pattern id={`grid-${width}-${height}`} width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M0 0H30" className="svg-grid-strong" />
          <path d="M0 0V30" className="svg-grid-soft" />
        </pattern>
      </defs>
      <rect width={width} height={height} className="svg-bg" />
      <rect
        x={width > 500 ? 88 : 62}
        y={width > 500 ? 48 : 70}
        width={width > 500 ? 752 : 236}
        height={width > 500 ? 338 : 492}
        rx="12"
        fill={`url(#grid-${width}-${height})`}
        className="svg-stage"
      />
    </>
  );
}

function HorizontalRuler() {
  return (
    <g aria-label="horizontal ruler">
      <rect x="112" y="402" width="690" height="46" className="svg-ruler" />
      {Array.from({ length: 18 }, (_, index) => {
        const x = 130 + index * 38;
        const long = index % 2 === 0;
        return <path key={x} d={`M${x} 402V${long ? 448 : 428}`} className="svg-tick" />;
      })}
      <text x="124" y="470" className="svg-small">0</text>
      <text x="500" y="470" className="svg-small">10</text>
      <text x="728" y="470" className="svg-small">16 cm</text>
    </g>
  );
}

function VerticalRuler() {
  return (
    <g aria-label="vertical ruler">
      <rect x="16" y="88" width="34" height="456" className="svg-ruler" />
      {Array.from({ length: 15 }, (_, index) => {
        const y = 526 - index * 30;
        const long = index % 2 === 0;
        return <path key={y} d={`M${long ? 16 : 30} ${y}H50`} className="svg-tick" />;
      })}
      <text x="17" y="542" className="svg-small">0</text>
      <text x="17" y="302" className="svg-small">8</text>
      <text x="17" y="122" className="svg-small">14</text>
    </g>
  );
}

function HorizontalFigure({
  measurement,
  pxPerCm,
}: {
  measurement: MeasurementState;
  pxPerCm: number;
}) {
  const lengthPx = Math.min(560, measurement.lengthCm * pxPerCm);
  const diameterPx = Math.max(40, Math.min(150, measurement.diameterCm * pxPerCm));
  const startX = 184;
  const tipX = startX + lengthPx;
  const centerY = 240;

  return (
    <g>
      <rect x="130" y="128" width="38" height="154" rx="18" className="svg-fat" />
      <path d="M184 112C194 150 195 252 184 300" className="svg-bone" />
      <path
        d={`M${startX} ${centerY - diameterPx / 2}
          C214 184 276 174 354 176
          L${tipX - 56} 181
          C${tipX - 20} 182 ${tipX} 211 ${tipX} 239
          C${tipX} 268 ${tipX - 20} 297 ${tipX - 56} 299
          L354 304
          C276 306 214 296 ${startX} ${centerY + diameterPx / 2}
          C170 264 170 216 ${startX} ${centerY - diameterPx / 2}Z`}
        fill={measurement.color}
        className="svg-body"
      />
      <ellipse cx={tipX} cy={centerY} rx="46" ry="62" className="svg-tip" />
      <path
        data-testid="length-marker"
        data-measures="pubic-bone-to-tip"
        d={`M${startX} 344H${tipX}`}
        className="svg-measure"
      />
      <path d={`M${startX} 334V354M${tipX} 334V354`} className="svg-measure" />
      <text x="388" y="334" className="svg-measure-label">length to tip</text>
      <path d={`M562 ${centerY - diameterPx / 2}V${centerY + diameterPx / 2}`} className="svg-measure" />
      <text x="582" y="246" className="svg-measure-label">diameter</text>
    </g>
  );
}

function VerticalFigure({
  measurement,
  pxPerCm,
}: {
  measurement: MeasurementState;
  pxPerCm: number;
}) {
  const lengthPx = Math.min(454, measurement.lengthCm * pxPerCm);
  const diameterPx = Math.max(44, Math.min(140, measurement.diameterCm * pxPerCm));
  const baseY = 512;
  const tipY = baseY - lengthPx;
  const centerX = 170;

  return (
    <g>
      <rect x="124" y="512" width="92" height="28" rx="14" className="svg-fat" />
      <path d="M122 508C150 492 190 492 218 508" className="svg-bone" />
      <path
        d={`M${centerX - diameterPx / 2} ${baseY}
          C124 476 118 420 119 354
          L122 ${tipY + 84}
          C123 ${tipY + 36} 145 ${tipY} ${centerX} ${tipY}
          C195 ${tipY} 217 ${tipY + 36} 218 ${tipY + 84}
          L221 354
          C222 420 216 476 ${centerX + diameterPx / 2} ${baseY}
          C192 528 148 528 ${centerX - diameterPx / 2} ${baseY}Z`}
        fill={measurement.color}
        className="svg-body"
      />
      <ellipse cx={centerX} cy={tipY} rx="48" ry="36" className="svg-tip" />
      <path
        data-testid="length-marker"
        data-measures="pubic-bone-to-tip"
        d={`M258 ${baseY}V${tipY - 36}`}
        className="svg-measure"
      />
      <path d={`M246 ${baseY}H270M246 ${tipY - 36}H270`} className="svg-measure" />
      <text x="218" y="76" className="svg-measure-label">length to tip</text>
      <path d={`M${centerX - diameterPx / 2} 330H${centerX + diameterPx / 2}`} className="svg-measure" />
      <text x="234" y="334" className="svg-measure-label">diameter</text>
    </g>
  );
}
```

- [ ] **Step 4: Add SVG styles**

Append to `src/styles.css`:

```css
.anatomy-svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: min(76vh, 680px);
}

.svg-bg {
  fill: #fbfcfe;
}

.svg-stage {
  stroke: #d6dee8;
}

.svg-grid-strong {
  stroke: #e2e8f0;
  stroke-width: 1;
}

.svg-grid-soft {
  stroke: #eef2f7;
  stroke-width: 1;
}

.svg-status,
.svg-small {
  fill: #334155;
  font-size: 14px;
}

.svg-small {
  font-size: 11px;
}

.svg-ruler {
  fill: #fff;
  stroke: #aeb8c7;
}

.svg-tick {
  stroke: #334155;
  stroke-width: 1;
}

.svg-fat {
  fill: #fbe7dc;
  stroke: #d6a895;
  stroke-width: 2;
}

.svg-bone {
  fill: none;
  stroke: #8b5c53;
  stroke-width: 3;
}

.svg-body {
  stroke: #8b5c53;
  stroke-width: 4;
}

.svg-tip {
  fill: #c98275;
  stroke: #8b5c53;
  stroke-width: 4;
}

.svg-measure {
  fill: none;
  stroke: #2f6f7a;
  stroke-width: 4;
}

.svg-measure-label {
  fill: #1f5862;
  font-size: 14px;
  font-weight: 700;
}
```

- [ ] **Step 5: Verify renderer tests**

Run:

```powershell
npm test -- src/components/AnatomySvg.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit SVG renderer**

```powershell
git add src/components/AnatomySvg.tsx src/components/AnatomySvg.test.tsx src/styles.css
git commit -m "feat: render responsive measurement svg"
```

---

## Task 5: Controls, Guide Drawer, Calibration Panel, And App Wiring

**Files:**
- Create: `src/components/MeasurementControls.tsx`
- Create: `src/components/MeasurementControls.test.tsx`
- Create: `src/components/GuideDrawer.tsx`
- Create: `src/components/GuideDrawer.test.tsx`
- Create: `src/components/CalibrationPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing component tests**

Create `src/components/GuideDrawer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuideDrawer } from "./GuideDrawer";

describe("GuideDrawer", () => {
  it("opens measurement guidance", async () => {
    render(<GuideDrawer />);

    await userEvent.click(screen.getByRole("button", { name: /how to measure/i }));

    expect(screen.getByText(/pubic bone to the furthest tip/i)).toBeInTheDocument();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });
});
```

Create `src/components/MeasurementControls.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_MEASUREMENT } from "../model/measurement";
import { MeasurementControls } from "./MeasurementControls";

describe("MeasurementControls", () => {
  it("emits metric length changes", async () => {
    const onChange = vi.fn();
    render(<MeasurementControls value={DEFAULT_MEASUREMENT} errors={{}} onChange={onChange} onShare={vi.fn()} />);

    const input = screen.getByLabelText(/length/i);
    await userEvent.clear(input);
    await userEvent.type(input, "14");

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ lengthCm: 14, presetId: "custom" }));
  });

  it("calls share handler", async () => {
    const onShare = vi.fn();
    render(<MeasurementControls value={DEFAULT_MEASUREMENT} errors={{}} onChange={vi.fn()} onShare={onShare} />);

    await userEvent.click(screen.getByRole("button", { name: /copy share link/i }));

    expect(onShare).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run component tests to verify failure**

Run:

```powershell
npm test -- src/components/GuideDrawer.test.tsx src/components/MeasurementControls.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement guide drawer**

Create `src/components/GuideDrawer.tsx`:

```tsx
import { useState } from "react";

export function GuideDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <section className="guide">
      <button className="guide__toggle" type="button" onClick={() => setOpen((value) => !value)}>
        How to measure
      </button>
      {open && (
        <div className="guide__body">
          <p>This adult-only educational tool is for visualization and is not medical advice.</p>
          <p>Length is measured from the pubic bone to the furthest tip, including the tip/glans.</p>
          <p>Diameter is derived from circumference with circumference divided by pi.</p>
          <p>Scale is estimated until calibrated because browsers do not reliably expose physical screen size.</p>
          <ul>
            <li>Default preset: Veale et al. 2015, 13.12 cm length and 11.66 cm circumference.</li>
            <li>Alternate length benchmark: Belladelli et al. 2023, 13.93 cm pooled erect length.</li>
          </ul>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Implement measurement controls**

Create `src/components/MeasurementControls.tsx`:

```tsx
import {
  MeasurementErrors,
  MeasurementState,
  PRESETS,
  PresetId,
  UnitMode,
  cmToInches,
  inchesToCm,
} from "../model/measurement";

interface MeasurementControlsProps {
  value: MeasurementState;
  errors: MeasurementErrors;
  onChange: (value: MeasurementState) => void;
  onShare: () => void;
}

export function MeasurementControls({
  value,
  errors,
  onChange,
  onShare,
}: MeasurementControlsProps) {
  const lengthDisplay = value.unitMode === "metric" ? value.lengthCm : cmToInches(value.lengthCm);
  const diameterDisplay = value.unitMode === "metric" ? value.diameterCm : cmToInches(value.diameterCm);
  const fatDisplay = value.unitMode === "metric" ? value.fatLayerCm : cmToInches(value.fatLayerCm);
  const unitLabel = value.unitMode === "metric" ? "cm" : "in";

  function updateNumber(field: "lengthCm" | "diameterCm" | "fatLayerCm", raw: string) {
    const parsed = Number(raw);
    const metricValue = value.unitMode === "metric" ? parsed : inchesToCm(parsed);
    onChange({ ...value, [field]: metricValue, presetId: "custom" });
  }

  function applyPreset(presetId: PresetId) {
    if (presetId === "custom") {
      onChange({ ...value, presetId });
      return;
    }

    const preset = PRESETS[presetId];
    onChange({
      lengthCm: preset.lengthCm,
      diameterCm: preset.diameterCm,
      fatLayerCm: preset.fatLayerCm,
      color: preset.color,
      unitMode: value.unitMode,
      presetId,
    });
  }

  return (
    <section className="controls" aria-label="measurement controls">
      <label>
        Preset
        <select value={value.presetId} onChange={(event) => applyPreset(event.target.value as PresetId)}>
          <option value="veale-2015">Veale 2015 average</option>
          <option value="belladelli-2023-length">Belladelli 2023 length</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      <label>
        Units
        <select
          value={value.unitMode}
          onChange={(event) => onChange({ ...value, unitMode: event.target.value as UnitMode })}
        >
          <option value="metric">Metric</option>
          <option value="imperial">Imperial</option>
        </select>
      </label>
      <NumberField label="Length" unit={unitLabel} value={lengthDisplay} error={errors.lengthCm} onChange={(raw) => updateNumber("lengthCm", raw)} />
      <NumberField label="Diameter" unit={unitLabel} value={diameterDisplay} error={errors.diameterCm} onChange={(raw) => updateNumber("diameterCm", raw)} />
      <NumberField label="Fat layer" unit={unitLabel} value={fatDisplay} error={errors.fatLayerCm} onChange={(raw) => updateNumber("fatLayerCm", raw)} />
      <label>
        Color
        <input
          type="color"
          value={value.color}
          onChange={(event) => onChange({ ...value, color: event.target.value, presetId: "custom" })}
        />
      </label>
      {errors.color && <p className="field-error">{errors.color}</p>}
      <button type="button" className="primary-action" onClick={onShare}>
        Copy share link
      </button>
    </section>
  );
}

function NumberField({
  label,
  unit,
  value,
  error,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  error?: string;
  onChange: (raw: string) => void;
}) {
  return (
    <label>
      {label}
      <span className="input-with-unit">
        <input
          aria-label={label}
          type="number"
          min="0"
          step="0.1"
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : ""}
          onChange={(event) => onChange(event.target.value)}
        />
        <span>{unit}</span>
      </span>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
```

- [ ] **Step 5: Implement calibration panel**

Create `src/components/CalibrationPanel.tsx`:

```tsx
import { useState } from "react";
import { referencePixelsToCalibrationFactor } from "../model/scale";

interface CalibrationPanelProps {
  basePxPerCm: number;
  onCalibrate: (factor: number) => void;
}

export function CalibrationPanel({ basePxPerCm, onCalibrate }: CalibrationPanelProps) {
  const [referenceCm, setReferenceCm] = useState(8.56);
  const [measuredPx, setMeasuredPx] = useState(Math.round(8.56 * basePxPerCm));

  function calibrate() {
    onCalibrate(
      referencePixelsToCalibrationFactor({
        expectedCm: referenceCm,
        measuredPx,
        basePxPerCm,
      }),
    );
  }

  return (
    <section className="calibration" aria-label="optional calibration">
      <h2>Optional calibration</h2>
      <p>Adjust this if the on-screen ruler does not match a known physical object.</p>
      <label>
        Reference length
        <span className="input-with-unit">
          <input type="number" min="1" step="0.01" value={referenceCm} onChange={(event) => setReferenceCm(Number(event.target.value))} />
          <span>cm</span>
        </span>
      </label>
      <label>
        On-screen pixels
        <input type="range" min="120" max="800" value={measuredPx} onChange={(event) => setMeasuredPx(Number(event.target.value))} />
      </label>
      <div className="reference-line" style={{ width: `${measuredPx}px` }} />
      <button type="button" onClick={calibrate}>Apply calibration</button>
    </section>
  );
}
```

- [ ] **Step 6: Wire app state**

Replace `src/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { AnatomySvg } from "./components/AnatomySvg";
import { CalibrationPanel } from "./components/CalibrationPanel";
import { GuideDrawer } from "./components/GuideDrawer";
import { MeasurementControls } from "./components/MeasurementControls";
import { DEFAULT_MEASUREMENT, MeasurementState, validateMeasurement } from "./model/measurement";
import { applyCalibration, estimateScale } from "./model/scale";
import { parseUrlState, serializeUrlState } from "./model/urlState";

export default function App() {
  const parsed = useMemo(() => parseUrlState(window.location.search), []);
  const [measurement, setMeasurement] = useState<MeasurementState>(parsed.value);
  const [scale, setScale] = useState(() => estimateScale({ devicePixelRatio: window.devicePixelRatio }));
  const [shareStatus, setShareStatus] = useState("");
  const validation = validateMeasurement(measurement);

  useEffect(() => {
    const query = serializeUrlState(measurement);
    window.history.replaceState(null, "", query);
  }, [measurement]);

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}${serializeUrlState(measurement)}`;
    await navigator.clipboard.writeText(url);
    setShareStatus("Share link copied.");
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Adult-only educational visualizer</p>
          <h1>Measurement Visualizer</h1>
          <p className="lede">
            Compare measurements against an abstract reference visual. Scale is estimated until calibrated.
          </p>
        </div>
        {parsed.invalidFields.length > 0 && (
          <p className="notice">Some shared values were invalid and were reset.</p>
        )}
      </header>

      <section className="workspace">
        <div className="visual-card">
          <AnatomySvg
            measurement={validation.value}
            orientation="horizontal"
            pxPerCm={scale.pxPerCm}
            scaleStatus={scale.status}
          />
          <div className="mobile-visual">
            <AnatomySvg
              measurement={validation.value}
              orientation="vertical"
              pxPerCm={scale.pxPerCm}
              scaleStatus={scale.status}
            />
          </div>
        </div>
        <aside className="side-stack">
          <MeasurementControls
            value={measurement}
            errors={validation.errors}
            onChange={setMeasurement}
            onShare={share}
          />
          {shareStatus && <p className="notice">{shareStatus}</p>}
          <GuideDrawer />
        </aside>
      </section>

      <CalibrationPanel
        basePxPerCm={estimateScale().pxPerCm}
        onCalibrate={(factor) => setScale((current) => applyCalibration(current, factor))}
      />
      <footer className="source-note">
        Default average: Veale et al. 2015. Alternate length benchmark: Belladelli et al. 2023.
      </footer>
    </main>
  );
}
```

- [ ] **Step 7: Add UI styles**

Append to `src/styles.css`:

```css
.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: start;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #2f6f7a;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 34px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}

.visual-card,
.controls,
.guide,
.calibration {
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #fff;
}

.visual-card {
  padding: 12px;
}

.side-stack {
  display: grid;
  gap: 14px;
}

.controls,
.guide,
.calibration {
  padding: 16px;
}

.controls {
  display: grid;
  gap: 12px;
}

.controls label,
.calibration label {
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.controls input,
.controls select,
.calibration input {
  width: 100%;
  border: 1px solid #c7d2df;
  border-radius: 6px;
  padding: 8px 10px;
  background: #fff;
  color: #17212b;
}

.input-with-unit {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.field-error {
  color: #a33b2f;
  font-size: 12px;
  font-weight: 600;
}

.primary-action,
.guide__toggle,
.calibration button {
  min-height: 38px;
  border: 0;
  border-radius: 6px;
  background: #2f6f7a;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.guide__body {
  color: #475569;
  line-height: 1.5;
}

.notice {
  border: 1px solid #c4d7dc;
  border-radius: 6px;
  background: #edf7f9;
  color: #1f5862;
  padding: 10px 12px;
}

.mobile-visual {
  display: none;
}

.reference-line {
  max-width: 100%;
  height: 18px;
  border-radius: 9px;
  background: #2f6f7a;
}

.source-note {
  margin-top: 20px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 820px) {
  .hero,
  .workspace {
    display: block;
  }

  .side-stack {
    margin-top: 14px;
  }

  .anatomy-svg--horizontal {
    display: none;
  }

  .mobile-visual {
    display: block;
  }

  h1 {
    font-size: 28px;
  }
}
```

- [ ] **Step 8: Verify component tests**

Run:

```powershell
npm test -- src/components/GuideDrawer.test.tsx src/components/MeasurementControls.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Verify build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 10: Commit app wiring**

```powershell
git add src/App.tsx src/components src/styles.css
git commit -m "feat: wire measurement visualizer ui"
```

---

## Task 6: Browser Verification And Responsive Checks

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/visual.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Create Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
```

- [ ] **Step 2: Write e2e checks**

Create `tests/e2e/visual.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("desktop shows horizontal visual and shareable url state", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Measurement Visualizer" })).toBeVisible();
  await expect(page.getByLabel("abstract measurement visual").first()).toBeVisible();
  await expect(page.getByText("length to tip").first()).toBeVisible();

  await page.getByLabel("Length").fill("14");
  await expect(page).toHaveURL(/l=14/);

  if (testInfo.project.name === "desktop") {
    await expect(page.locator(".anatomy-svg--horizontal")).toBeVisible();
  }
});

test("mobile uses vertical projection", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");

  await page.goto("/");
  await expect(page.locator(".anatomy-svg--horizontal")).toBeHidden();
  await expect(page.getByTestId("mobile-projection")).toBeVisible();
  await expect(page.getByText("length to tip").first()).toBeVisible();
});

test("guide explains pubic-bone-to-tip measurement", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /how to measure/i }).click();
  await expect(page.getByText(/pubic bone to the furthest tip/i)).toBeVisible();
  await expect(page.getByText(/not medical advice/i)).toBeVisible();
});
```

- [ ] **Step 3: Install Playwright browsers**

Run:

```powershell
npx playwright install chromium
```

Expected: Chromium browser download/install completes successfully.

- [ ] **Step 4: Run full verification**

Run:

```powershell
npm test
npm run build
npm run e2e
```

Expected: all unit tests pass, production build passes, Playwright desktop and mobile checks pass.

- [ ] **Step 5: Commit verification**

```powershell
git add playwright.config.ts tests package.json package-lock.json
git commit -m "test: add responsive browser checks"
```

---

## Task 7: Final Polish, Source Copy, And README

**Files:**
- Modify: `README.md`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Update README**

Replace `README.md`:

```md
# Adult Measurement Visualizer

Client-side React app for adult-only educational measurement visualization.

The app renders an abstract 2D SVG visual with:

- estimated actual-size ruler display,
- optional calibration,
- metric and imperial units,
- shareable URL query parameters,
- Veale et al. 2015 default average preset,
- optional Belladelli et al. 2023 length benchmark,
- mobile portrait projection where length is measured from pubic bone to furthest tip.

## Development

```powershell
npm install
npm run dev
```

## Verification

```powershell
npm test
npm run build
npm run e2e
```

## Notes

The visual is abstract and non-erotic. The app is not medical advice. Browser physical screen-size detection is not reliable, so scale is estimated until calibrated.
```

- [ ] **Step 2: Add external source links in app footer**

In `src/App.tsx`, replace the `footer` element with:

```tsx
<footer className="source-note">
  <a href="https://pubmed.ncbi.nlm.nih.gov/25487360/" target="_blank" rel="noreferrer">
    Veale et al. 2015
  </a>
  <span> default average. </span>
  <a href="https://pubmed.ncbi.nlm.nih.gov/36792094/" target="_blank" rel="noreferrer">
    Belladelli et al. 2023
  </a>
  <span> optional length benchmark. Educational visualization only, not medical advice.</span>
</footer>
```

- [ ] **Step 3: Add footer link styling**

Append to `src/styles.css`:

```css
.source-note a {
  color: #1f5862;
  font-weight: 700;
}

.source-note a:focus-visible,
.primary-action:focus-visible,
.guide__toggle:focus-visible,
.calibration button:focus-visible {
  outline: 3px solid #92c7d0;
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run final verification**

Run:

```powershell
npm test
npm run build
npm run e2e
```

Expected: all checks pass.

- [ ] **Step 5: Commit final polish**

```powershell
git add README.md src/App.tsx src/styles.css
git commit -m "docs: document visualizer usage and sources"
```

---

## Self-Review Notes

Spec coverage:

- Adult-only clinical-playful tone: Tasks 5 and 7.
- React + Vite + TypeScript: Task 1.
- SVG visual with desktop horizontal and mobile vertical projections: Task 4.
- Length measured to furthest tip: Tasks 4, 5, and 6.
- Default Veale preset and optional Belladelli benchmark: Tasks 2, 5, and 7.
- Metric canonical values and imperial display: Tasks 2 and 5.
- Shareable query-param URL with no backend and no PNG: Tasks 2 and 5.
- Estimated scale with optional calibration: Tasks 3 and 5.
- Guide drawer and non-medical disclaimer: Tasks 5 and 7.
- Validation and malformed URL reset behavior: Task 2.
- Unit, component, and browser tests: Tasks 2, 3, 4, 5, and 6.

Placeholder scan:

- No task contains `TBD`, `TODO`, or open-ended "add appropriate" instructions.
- Each code step includes exact file content or exact replacement snippets.

Type consistency:

- `MeasurementState`, `UnitMode`, `PresetId`, `ScaleStatus`, and component props are introduced before use.
- URL params use `l`, `d`, `f`, `c`, `u`, and `p` consistently.
- The length marker uses `data-measures="pubic-bone-to-tip"` in both orientations.
