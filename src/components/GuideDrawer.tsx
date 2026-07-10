import { useState } from "react";

export function GuideDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <section className="guide">
      <button
        className="guide__toggle"
        type="button"
        aria-expanded={open}
        aria-controls="measurement-guide-body"
        onClick={() => setOpen((current) => !current)}
      >
        How to measure
      </button>
      {open && (
        <div className="guide__body" id="measurement-guide-body">
          <p>
            This adult-only educational tool is a visualization, not medical advice.
          </p>
          <ul>
            <li>
              Length is measured from pubic bone to the furthest tip, including the
              tip/glans.
            </li>
            <li>Diameter is derived from circumference divided by pi.</li>
            <li>
              Scale is estimated until calibrated because browsers do not reliably
              expose physical screen size.
            </li>
            <li>
              Veale et al. 2015 default: 13.12 cm length, 11.66 cm circumference.
            </li>
            <li>
              Belladelli et al. 2023 alternate: 13.93 cm pooled erect length.
            </li>
          </ul>
        </div>
      )}
    </section>
  );
}
