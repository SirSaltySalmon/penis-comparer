import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { AnatomySvg } from "./components/AnatomySvg";
import { CalibrationPanel } from "./components/CalibrationPanel";
import { GuideDrawer } from "./components/GuideDrawer";
import { MeasurementControls } from "./components/MeasurementControls";
import { MonitorSizePanel } from "./components/MonitorSizePanel";
import { validateMeasurement } from "./model/measurement";
import { applyCalibration, estimateMonitorScale, estimateScale, type ScaleEstimateInput, type ScaleInfo } from "./model/scale";
import { clearSavedScale, readSavedScale, saveScale } from "./model/scaleCookie";
import { parseUrlState, serializeUrlState } from "./model/urlState";

type FullscreenMode = "none" | "native" | "fallback";

function getScaleInput(): ScaleEstimateInput {
  const userAgent = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  return {
    screenWidthCss: window.screen.width,
    screenHeightCss: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    platform: isIos ? "ios" : isAndroid ? "android" : "desktop",
    userAgent,
    isMobile: isIos || isAndroid || /Mobi/i.test(userAgent),
  };
}

function scaleLabel(scale: ScaleInfo): string {
  if (scale.source === "saved-calibration") return "Calibrated for this screen";
  if (scale.source === "saved-monitor") return "Estimated from saved monitor size";
  if (scale.deviceName) return `Estimated for ${scale.deviceName}`;
  if (scale.source === "device-signature") return "Estimated from mobile display";
  return "Uncalibrated estimate";
}

export default function App() {
  const parsed = useMemo(() => parseUrlState(window.location.search), []);
  const scaleInput = useMemo(getScaleInput, []);
  const automaticScale = useMemo(() => estimateScale(scaleInput), [scaleInput]);
  const baseScale = useMemo(() => readSavedScale(scaleInput) ?? automaticScale, [automaticScale, scaleInput]);
  const [measurement, setMeasurement] = useState(parsed.value);
  const [renderedMeasurement, setRenderedMeasurement] = useState(parsed.value);
  const [scale, setScale] = useState(baseScale);
  const [shareStatus, setShareStatus] = useState("");
  const [fullscreenMode, setFullscreenMode] =
    useState<FullscreenMode>("none");
  const [visualOffset, setVisualOffset] = useState({ x: 0, y: 0 });
  const visualCardRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const validation = validateMeasurement(measurement);
  const hasValidationErrors = Object.keys(validation.errors).length > 0;
  const isFullscreen = fullscreenMode !== "none";

  useEffect(() => {
    setShareStatus("");
    if (hasValidationErrors) return;

    setRenderedMeasurement(measurement);
    const query = serializeUrlState(measurement);
    window.history.replaceState(null, "", query);
  }, [hasValidationErrors, measurement]);

  useEffect(() => {
    type NavigatorWithHints = Navigator & {
      userAgentData?: { getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string }> };
    };
    const hints = (navigator as NavigatorWithHints).userAgentData;
    if (!scaleInput.isMobile || !hints?.getHighEntropyValues) return;
    let active = true;
    hints.getHighEntropyValues(["model"]).then(({ model }) => {
      if (!active || !model) return;
      const refined = estimateScale({ ...scaleInput, deviceModel: model });
      setScale((current) =>
        current.source === "css-fallback" && refined.confidence !== "low" ? refined : current,
      );
    }).catch(() => undefined);
    return () => { active = false; };
  }, [scaleInput]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement === visualCardRef.current) {
        setFullscreenMode("native");
      } else {
        setFullscreenMode((current) =>
          current === "native" ? "none" : current,
        );
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (fullscreenMode !== "fallback") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const exitOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setFullscreenMode("none");
    };
    document.addEventListener("keydown", exitOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", exitOnEscape);
    };
  }, [fullscreenMode]);

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      if (document.fullscreenElement === visualCardRef.current) {
        await document.exitFullscreen();
      } else {
        setFullscreenMode("none");
      }
      return;
    }

    setVisualOffset({ x: 0, y: 0 });
    const element = visualCardRef.current;
    if (!element?.requestFullscreen) {
      setFullscreenMode("fallback");
      return;
    }

    try {
      await element.requestFullscreen();
      setFullscreenMode("native");
    } catch {
      setFullscreenMode("fallback");
    }
  };

  const startDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (!isFullscreen || event.button !== 0) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: visualOffset.x,
      offsetY: visualOffset.y,
    };
    event.preventDefault();
  };

  const dragVisual = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setVisualOffset({
      x: drag.offsetX + event.clientX - drag.startX,
      y: drag.offsetY + event.clientY - drag.startY,
    });
  };

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const moveVisualWithKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (!isFullscreen || event.target instanceof HTMLButtonElement) return;

    const step = event.shiftKey ? 1 : 10;
    const delta = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }[event.key];
    if (!delta) return;

    event.preventDefault();
    setVisualOffset((current) => ({
      x: current.x + delta.x,
      y: current.y + delta.y,
    }));
  };

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
          <p className="eyebrow"><a href="https://github.com/SirSaltySalmon/penis-comparer">GitHub</a></p>
          <h1>Penis Visualizer</h1>
          <p className="lede">
            Renders an erect penis to scale, to validate claims or compare your penis to the average penis.
          </p>
        </div>
        {parsed.invalidFields.length > 0 && (
          <p className="notice">
            Some shared values were invalid and were reset.
          </p>
        )}
      </header>

      <div className="workspace">
        <section
          ref={visualCardRef}
          className={`visual-card${isFullscreen ? " is-fullscreen" : ""}`}
          aria-label="Scrollable measurement visual"
          aria-describedby="visual-scroll-instructions"
          tabIndex={0}
          onKeyDown={moveVisualWithKeyboard}
        >
          <div className="visual-toolbar">
            <div>
              <p className="scale-summary" data-confidence={scale.confidence}>{scaleLabel(scale)}</p>
              <p className="visual-instructions" id="visual-scroll-instructions">
                {isFullscreen
                  ? "Drag to position the to-scale visual. Arrow keys make 10 px adjustments; hold Shift for 1 px."
                  : "Full screen this visual as needed if it extends beyond the frame."}
              </p>
            </div>
            <div className="visual-actions">
              {isFullscreen && (
                <button
                  className="visual-action"
                  type="button"
                  onClick={() => setVisualOffset({ x: 0, y: 0 })}
                >
                  Reset position
                </button>
              )}
              <button
                className="visual-action visual-action--primary"
                type="button"
                aria-pressed={isFullscreen}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? "Exit full screen" : "Full screen visual"}
              </button>
            </div>
          </div>
          <div
            className="visual-viewport"
            onPointerDown={startDragging}
            onPointerMove={dragVisual}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            <div
              className="visual-pan-surface"
              data-testid="visual-pan-surface"
              style={{
                transform: `translate3d(${visualOffset.x}px, ${visualOffset.y}px, 0)`,
              }}
            >
              <AnatomySvg
                measurement={renderedMeasurement}
                orientation="horizontal"
                pxPerCm={scale.pxPerCm}
                scaleStatus={scale.status}
              />
              <div className="mobile-visual">
                <AnatomySvg
                  measurement={renderedMeasurement}
                  orientation="vertical"
                  pxPerCm={scale.pxPerCm}
                  scaleStatus={scale.status}
                />
              </div>
            </div>
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
        </aside>
      </div>

      <GuideDrawer />

      {!scaleInput.isMobile && scale.source === "css-fallback" && (
        <MonitorSizePanel onApply={(diagonalInches) => {
          const monitorScale = estimateMonitorScale(scaleInput, diagonalInches);
          if (!monitorScale) return false;
          setScale(monitorScale);
          saveScale(scaleInput, monitorScale, "monitor-size", diagonalInches);
          return true;
        }} />
      )}

      <CalibrationPanel
        basePxPerCm={baseScale.pxPerCm}
        onCalibrate={(factor) => {
          const calibrated = applyCalibration(baseScale, factor);
          setScale(calibrated);
          saveScale(scaleInput, calibrated, "manual-calibration");
        }}
      />
      {(scale.source === "saved-calibration" || scale.source === "saved-monitor") && (
        <button className="forget-scale" type="button" onClick={() => {
          clearSavedScale();
          setScale(automaticScale);
        }}>
          Forget saved scale
        </button>
      )}

      <footer className="source-note">
        <a href="https://pubmed.ncbi.nlm.nih.gov/25487360/" target="_blank" rel="noreferrer">
          Veale et al. 2015
        </a>
        <span> default average. </span>
        <a href="https://pubmed.ncbi.nlm.nih.gov/36792094/" target="_blank" rel="noreferrer">
          Belladelli et al. 2023
        </a>
        <span> optional alternative source. Educational visualization only, not medical advice.</span>
        <span>This website collects no data and is completely client-side. It uses cookies to store your calibration settings on revist.</span>
      </footer>
    </main>
  );
}
