import { useRef, useState } from "react";
import { referencePixelsToCalibrationFactor } from "../model/scale";

export interface CalibrationPanelProps {
  basePxPerCm: number;
  onCalibrate: (factor: number) => void;
}

export function CalibrationPanel({
  basePxPerCm,
  onCalibrate,
}: CalibrationPanelProps) {
  const [referenceCm, setReferenceCm] = useState("8.56");
  const [measuredPx, setMeasuredPx] = useState(
    Math.round(8.56 * basePxPerCm),
  );
  const [error, setError] = useState("");
  const referenceLineRef = useRef<HTMLDivElement>(null);

  const apply = () => {
    const renderedWidth = referenceLineRef.current?.getBoundingClientRect().width;
    const effectiveMeasuredPx =
      renderedWidth === 0 || renderedWidth === undefined
        ? measuredPx
        : renderedWidth;
    const expectedCm = Number(referenceCm);
    const factor = referencePixelsToCalibrationFactor({
      expectedCm,
      measuredPx: effectiveMeasuredPx,
      basePxPerCm,
    });

    if (factor === null) {
      setError(
        !Number.isFinite(expectedCm) || expectedCm <= 0
          ? "Reference length must be a positive number."
          : "Measured width must be a positive number.",
      );
      return;
    }

    setError("");
    onCalibrate(factor);
  };

  return (
    <section className="calibration" aria-label="optional calibration">
      <h2>Optional calibration</h2>
      <p>
        Adjust the scale when the on-screen ruler does not match a known physical
        object.
      </p>
      <label>
        Reference length
        <span className="input-with-unit">
          <input
            aria-label="Reference length"
            type="number"
            min="1"
            step=".01"
            value={referenceCm}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "calibration-error" : undefined}
            onChange={(event) => setReferenceCm(event.target.value)}
          />
          <span>cm</span>
        </span>
      </label>
      <label>
        On-screen pixels
        <input
          aria-label="On-screen pixels"
          type="range"
          min="120"
          max="800"
          value={measuredPx}
          onChange={(event) => setMeasuredPx(Number(event.target.value))}
        />
      </label>
      <div
        ref={referenceLineRef}
        className="reference-line"
        style={{ width: `${measuredPx}px` }}
      />
      <button type="button" onClick={apply}>
        Apply calibration
      </button>
      {error && (
        <p className="field-error" id="calibration-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
