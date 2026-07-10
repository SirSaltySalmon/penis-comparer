import { useEffect, useState } from "react";
import {
  PRESETS,
  cmToInches,
  inchesToCm,
  type MeasurementErrors,
  type MeasurementState,
  type PresetId,
  type UnitMode,
} from "../model/measurement";

export interface MeasurementControlsProps {
  value: MeasurementState;
  errors: MeasurementErrors;
  onChange: (value: MeasurementState) => void;
  onShare: () => void;
}

type NumericField = "lengthCm" | "diameterCm" | "fatLayerCm";

const numericFields: Array<{ field: NumericField; label: string }> = [
  { field: "lengthCm", label: "Length" },
  { field: "diameterCm", label: "Diameter" },
  { field: "fatLayerCm", label: "Fat layer" },
];

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const getDisplayedValues = (
  value: MeasurementState,
): Record<NumericField, number | ""> => {
  const display = (field: NumericField): number | "" => {
    const metricValue = value[field];
    if (!Number.isFinite(metricValue)) return "";

    const converted =
      value.unitMode === "imperial" ? cmToInches(metricValue) : metricValue;
    return roundToTwoDecimals(converted);
  };

  return {
    lengthCm: display("lengthCm"),
    diameterCm: display("diameterCm"),
    fatLayerCm: display("fatLayerCm"),
  };
};

export function MeasurementControls({
  value,
  errors,
  onChange,
  onShare,
}: MeasurementControlsProps) {
  const unitLabel = value.unitMode === "metric" ? "cm" : "in";
  const [displayedValues, setDisplayedValues] = useState<
    Record<NumericField, number | string>
  >(() => getDisplayedValues(value));

  useEffect(() => {
    setDisplayedValues(getDisplayedValues(value));
  }, [
    value.lengthCm,
    value.diameterCm,
    value.fatLayerCm,
    value.unitMode,
  ]);

  const updateNumber = (field: NumericField, raw: string) => {
    setDisplayedValues((current) => ({ ...current, [field]: raw }));
    const parsed = Number(raw);
    const metricValue =
      value.unitMode === "imperial" ? inchesToCm(parsed) : parsed;
    onChange({ ...value, [field]: metricValue, presetId: "custom" });
  };

  const updatePreset = (presetId: PresetId) => {
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
  };

  return (
    <section className="controls" aria-label="measurement controls">
      <label>
        Preset
        <select
          aria-label="Preset"
          value={value.presetId}
          onChange={(event) => updatePreset(event.target.value as PresetId)}
        >
          <option value="veale-2015">Veale 2015 average</option>
          <option value="belladelli-2023-length">Belladelli 2023 length</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      <label>
        Units
        <select
          aria-label="Units"
          value={value.unitMode}
          onChange={(event) =>
            onChange({ ...value, unitMode: event.target.value as UnitMode })
          }
        >
          <option value="metric">Metric</option>
          <option value="imperial">Imperial</option>
        </select>
      </label>

      {numericFields.map(({ field, label }) => (
        <label key={field}>
          {label}
          <span className="input-with-unit">
            <input
              aria-label={label}
              type="number"
              min="0"
              step="0.1"
              value={displayedValues[field]}
              onChange={(event) => updateNumber(field, event.target.value)}
            />
            <span>{unitLabel}</span>
          </span>
          {errors[field] && <span className="field-error">{errors[field]}</span>}
        </label>
      ))}

      <label>
        Color
        <input
          aria-label="Color"
          type="color"
          value={value.color}
          onChange={(event) =>
            onChange({ ...value, color: event.target.value, presetId: "custom" })
          }
        />
      </label>
      {errors.color && <p className="field-error">{errors.color}</p>}

      <button className="primary-action" type="button" onClick={onShare}>
        Copy share link
      </button>
    </section>
  );
}
