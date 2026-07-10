import {
  DEFAULT_MEASUREMENT,
  type MeasurementState,
  type PresetId,
  type UnitMode,
  roundForUrl,
  validateMeasurement,
} from "./measurement";

export interface ParsedUrlState {
  value: MeasurementState;
  invalidFields: string[];
}

const PRESET_IDS: PresetId[] = ["veale-2015", "belladelli-2023-length", "custom"];
const UNIT_MODES: UnitMode[] = ["metric", "imperial"];

export function serializeUrlState(value: MeasurementState): string {
  const params = new URLSearchParams();
  params.set("l", String(roundForUrl(value.lengthCm)));
  params.set("d", String(roundForUrl(value.diameterCm)));
  params.set("f", String(roundForUrl(value.fatLayerCm)));
  params.set("c", value.color.replace("#", "").toLowerCase());
  params.set("fc", value.fatColor.replace("#", "").toLowerCase());
  params.set("tc", value.tipColor.replace("#", "").toLowerCase());
  params.set("u", value.unitMode);
  params.set("p", value.presetId);

  return `?${params.toString()}`;
}

export function parseUrlState(search: string): ParsedUrlState {
  const params = new URLSearchParams(search);
  const invalidFields: string[] = [];
  const value: MeasurementState = { ...DEFAULT_MEASUREMENT };

  readNumber(params, "l", "lengthCm", value, invalidFields);
  readNumber(params, "d", "diameterCm", value, invalidFields);
  readNumber(params, "f", "fatLayerCm", value, invalidFields);
  readColor(params, "c", "color", value, invalidFields);
  readColor(params, "fc", "fatColor", value, invalidFields);
  readColor(params, "tc", "tipColor", value, invalidFields);
  readUnitMode(params, value, invalidFields);
  readPresetId(params, value, invalidFields);

  const validation = validateMeasurement(value);
  for (const field of Object.keys(validation.errors) as Array<keyof MeasurementState>) {
    resetField(field, value);
    invalidFields.push(fieldToParam(field));
  }

  return {
    value,
    invalidFields: Array.from(new Set(invalidFields)),
  };
}

function readNumber(
  params: URLSearchParams,
  paramName: "l" | "d" | "f",
  field: "lengthCm" | "diameterCm" | "fatLayerCm",
  value: MeasurementState,
  invalidFields: string[],
) {
  const raw = params.get(paramName);
  if (raw === null) return;

  if (raw.trim() === "") {
    invalidFields.push(paramName);
    return;
  }

  const parsed = Number(raw);
  if (Number.isFinite(parsed)) {
    value[field] = parsed;
  } else {
    invalidFields.push(paramName);
  }
}

function readColor(
  params: URLSearchParams,
  paramName: "c" | "fc" | "tc",
  field: "color" | "fatColor" | "tipColor",
  value: MeasurementState,
  invalidFields: string[],
) {
  const raw = params.get(paramName);
  if (raw === null) return;

  const normalized = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    value[field] = normalized.toLowerCase();
  } else {
    invalidFields.push(paramName);
  }
}

function readUnitMode(
  params: URLSearchParams,
  value: MeasurementState,
  invalidFields: string[],
) {
  const raw = params.get("u");
  if (raw === null) return;

  if (UNIT_MODES.includes(raw as UnitMode)) {
    value.unitMode = raw as UnitMode;
  } else {
    invalidFields.push("u");
  }
}

function readPresetId(
  params: URLSearchParams,
  value: MeasurementState,
  invalidFields: string[],
) {
  const raw = params.get("p");
  if (raw === null) return;

  if (PRESET_IDS.includes(raw as PresetId)) {
    value.presetId = raw as PresetId;
  } else {
    invalidFields.push("p");
  }
}

function resetField(field: keyof MeasurementState, value: MeasurementState) {
  switch (field) {
    case "lengthCm":
      value.lengthCm = DEFAULT_MEASUREMENT.lengthCm;
      break;
    case "diameterCm":
      value.diameterCm = DEFAULT_MEASUREMENT.diameterCm;
      break;
    case "fatLayerCm":
      value.fatLayerCm = DEFAULT_MEASUREMENT.fatLayerCm;
      break;
    case "color":
      value.color = DEFAULT_MEASUREMENT.color;
      break;
    case "fatColor":
      value.fatColor = DEFAULT_MEASUREMENT.fatColor;
      break;
    case "tipColor":
      value.tipColor = DEFAULT_MEASUREMENT.tipColor;
      break;
    case "unitMode":
      value.unitMode = DEFAULT_MEASUREMENT.unitMode;
      break;
    case "presetId":
      value.presetId = DEFAULT_MEASUREMENT.presetId;
      break;
  }
}

function fieldToParam(field: keyof MeasurementState): string {
  const map: Record<keyof MeasurementState, string> = {
    lengthCm: "l",
    diameterCm: "d",
    fatLayerCm: "f",
    color: "c",
    fatColor: "fc",
    tipColor: "tc",
    unitMode: "u",
    presetId: "p",
  };

  return map[field];
}
