import { useEffect, useMemo, useState } from "react";
import { AnatomySvg } from "./components/AnatomySvg";
import { CalibrationPanel } from "./components/CalibrationPanel";
import { GuideDrawer } from "./components/GuideDrawer";
import { MeasurementControls } from "./components/MeasurementControls";
import { validateMeasurement } from "./model/measurement";
import { applyCalibration, estimateScale } from "./model/scale";
import { parseUrlState, serializeUrlState } from "./model/urlState";

export default function App() {
  const parsed = useMemo(() => parseUrlState(window.location.search), []);
  const baseScale = useMemo(
    () => estimateScale({ devicePixelRatio: window.devicePixelRatio }),
    [],
  );
  const [measurement, setMeasurement] = useState(parsed.value);
  const [scale, setScale] = useState(baseScale);
  const [shareStatus, setShareStatus] = useState("");
  const validation = validateMeasurement(measurement);
  const hasValidationErrors = Object.keys(validation.errors).length > 0;

  useEffect(() => {
    if (hasValidationErrors) return;

    const query = serializeUrlState(measurement);
    window.history.replaceState(null, "", query);
  }, [hasValidationErrors, measurement]);

  const share = async () => {
    if (hasValidationErrors) {
      setShareStatus(
        "Fix invalid measurements before copying a share link.",
      );
      return;
    }

    const query = serializeUrlState(measurement);
    const shareUrl = `${window.location.origin}${window.location.pathname}${query}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus("Share link copied.");
    } catch {
      setShareStatus(
        "Could not copy the share link. Copy it from the address bar instead.",
      );
    }
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Adult-only educational visualizer</p>
          <h1>Measurement Visualizer</h1>
          <p className="lede">
            Compare measurements against an abstract reference visual. Scale is
            estimated until calibrated.
          </p>
        </div>
        {parsed.invalidFields.length > 0 && (
          <p className="notice">
            Some shared values were invalid and were reset.
          </p>
        )}
      </header>

      <div className="workspace">
        <section className="visual-card" aria-label="measurement visual">
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
        </section>

        <aside className="side-stack">
          <MeasurementControls
            value={measurement}
            errors={validation.errors}
            onChange={setMeasurement}
            onShare={share}
          />
          {shareStatus && (
            <p className="notice" role="status" aria-live="polite">
              {shareStatus}
            </p>
          )}
          <GuideDrawer />
        </aside>
      </div>

      <CalibrationPanel
        basePxPerCm={baseScale.pxPerCm}
        onCalibrate={(factor) =>
          setScale(applyCalibration(baseScale, factor))
        }
      />

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
    </main>
  );
}
