import { useState } from "react";

interface MonitorSizePanelProps {
  onApply: (diagonalInches: number) => boolean;
}

export function MonitorSizePanel({ onApply }: MonitorSizePanelProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const apply = () => {
    const diagonal = Number(value);
    if (!Number.isFinite(diagonal) || diagonal < 10 || diagonal > 100 || !onApply(diagonal)) {
      setError("Enter a monitor size from 10 to 100 inches.");
      return;
    }
    setError("");
  };

  return (
    <section className="monitor-size" aria-label="monitor size estimate">
      <p><strong>Improve the scale estimate</strong></p>
      <p>Enter the advertised diagonal size of this monitor. This assumes native resolution and 100% page zoom.</p>
      <label>
        Monitor size
        <span className="input-with-unit">
          <input aria-label="Monitor size" type="number" min="10" max="100" step="0.1"
            value={value} onChange={(event) => setValue(event.target.value)} />
          <span>inches</span>
        </span>
      </label>
      <button type="button" onClick={apply}>Apply monitor size</button>
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>
  );
}
