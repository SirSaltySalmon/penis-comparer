import { useState } from "react";
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

const numericFields: Array<{
  field: NumericField;
  label: string;
  inputId: string;
}> = [
  { field: "lengthCm", label: "Length", inputId: "measurement-length" },
  {
    field: "diameterCm",
    label: "Diameter",
    inputId: "measurement-diameter",
  },
  {
    field: "fatLayerCm",
    label: "Fat layer",
    inputId: "measurement-fat-layer",
  },
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
    const nextValue: MeasurementState = {
      lengthCm: preset.lengthCm,
      diameterCm: preset.diameterCm,
      fatLayerCm: preset.fatLayerCm,
      color: preset.color,
      unitMode: value.unitMode,
      presetId,
    };
    setDisplayedValues(getDisplayedValues(nextValue));
    onChange(nextValue);
  };

  const updateUnits = (unitMode: UnitMode) => {
    const nextValue = { ...value, unitMode };
    setDisplayedValues(getDisplayedValues(nextValue));
    onChange(nextValue);
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
          onChange={(event) => updateUnits(event.target.value as UnitMode)}
        >
          <option value="metric">Metric</option>
          <option value="imperial">Imperial</option>
        </select>
      </label>

      {numericFields.map(({ field, label, inputId }) => {
        const errorId = `${inputId}-error`;

        return (
          <label key={field} htmlFor={inputId}>
            {label}
            <span className="input-with-unit">
              <input
                id={inputId}
                aria-label={label}
                aria-invalid={Boolean(errors[field])}
                aria-describedby={errors[field] ? errorId : undefined}
                type="number"
                min="0"
                step="0.1"
                value={displayedValues[field]}
                onChange={(event) => updateNumber(field, event.target.value)}
              />
              <span>{unitLabel}</span>
            </span>
            {errors[field] && (
              <span className="field-error" id={errorId}>
                {errors[field]}
              </span>
            )}
          </label>
        );
      })}

      <label htmlFor="measurement-color">
        Color
        <input
          id="measurement-color"
          aria-label="Color"
          aria-invalid={Boolean(errors.color)}
          aria-describedby={errors.color ? "measurement-color-error" : undefined}
          type="color"
          value={value.color}
          onChange={(event) =>
            onChange({ ...value, color: event.target.value, presetId: "custom" })
          }
        />
      </label>
      {errors.color && (
        <p className="field-error" id="measurement-color-error">
          {errors.color}
        </p>
      )}

      <button className="primary-action" type="button" onClick={onShare}>
        Copy share link
      </button>
    </section>
  );
}
