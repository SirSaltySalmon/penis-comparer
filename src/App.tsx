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
  const [measurement, setMeasurement] = useState(parsed.value);
  const [scale, setScale] = useState(() =>
    estimateScale({ devicePixelRatio: window.devicePixelRatio }),
  );
  const [shareStatus, setShareStatus] = useState("");
  const validation = validateMeasurement(measurement);
  const basePxPerCm = estimateScale().pxPerCm;

  useEffect(() => {
    const query = serializeUrlState(measurement);
    window.history.replaceState(null, "", query);
  }, [measurement]);

  const share = async () => {
    const query = serializeUrlState(measurement);
    const shareUrl = `${window.location.origin}${window.location.pathname}${query}`;
    await navigator.clipboard.writeText(shareUrl);
    setShareStatus("Share link copied.");
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
          {shareStatus && <p className="notice">{shareStatus}</p>}
          <GuideDrawer />
        </aside>
      </div>

      <CalibrationPanel
        basePxPerCm={basePxPerCm}
        onCalibrate={(factor) =>
          setScale((current) => applyCalibration(current, factor))
        }
      />

      <footer className="source-note">
        Default average: Veale et al. 2015. Alternate length benchmark: Belladelli
        et al. 2023.
      </footer>
    </main>
  );
}
