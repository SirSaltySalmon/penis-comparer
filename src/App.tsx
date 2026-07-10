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
import { validateMeasurement } from "./model/measurement";
import { applyCalibration, estimateScale } from "./model/scale";
import { parseUrlState, serializeUrlState } from "./model/urlState";

type FullscreenMode = "none" | "native" | "fallback";

export default function App() {
  const parsed = useMemo(() => parseUrlState(window.location.search), []);
  const baseScale = useMemo(
    () => estimateScale({ devicePixelRatio: window.devicePixelRatio }),
    [],
  );
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
          <p className="eyebrow">Penis Visualizer</p>
          <h1>Penis Visualizer</h1>
          <p className="lede">
            Visualize a penis to scale, to validate claims or compare your penis to the average penis.
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
            <p className="visual-instructions" id="visual-scroll-instructions">
              {isFullscreen
                ? "Drag to position the to-scale visual. Arrow keys make 10 px adjustments; hold Shift for 1 px."
                : "Full screen this visual as needed if it extends beyond the frame."}
            </p>
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
