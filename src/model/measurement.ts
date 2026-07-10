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

const DEFAULT_COLOR = "#d79b88";
const VEALE_LENGTH_CM = 13.12;
const VEALE_CIRCUMFERENCE_CM = 11.66;
const VEALE_DIAMETER_CM = circumferenceToDiameter(VEALE_CIRCUMFERENCE_CM);

export const PRESETS: Record<Exclude<PresetId, "custom">, MeasurementPreset> = {
  "veale-2015": {
    lengthCm: VEALE_LENGTH_CM,
    diameterCm: VEALE_DIAMETER_CM,
    fatLayerCm: 1,
    color: DEFAULT_COLOR,
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
    color: DEFAULT_COLOR,
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
