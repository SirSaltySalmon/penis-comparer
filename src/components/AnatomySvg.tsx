import type { MeasurementState } from "../model/measurement";
import type { ScaleStatus } from "../model/scale";

export interface AnatomySvgProps {
  measurement: MeasurementState;
  orientation: "horizontal" | "vertical";
  pxPerCm: number;
  scaleStatus: ScaleStatus;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const scaledCm = (
  cm: number,
  pxPerCm: number,
  minPx: number,
  maxPx: number,
): number => {
  if (!Number.isFinite(cm) || !Number.isFinite(pxPerCm) || pxPerCm <= 0) {
    return minPx;
  }

  return clamp(cm * pxPerCm, minPx, maxPx);
};

const statusLabel = (scaleStatus: ScaleStatus): string =>
  `${scaleStatus} scale`;

function HorizontalProjection({
  measurement,
  pxPerCm,
  scaleStatus,
}: Omit<AnatomySvgProps, "orientation">) {
  const referenceX = 210;
  const centerY = 260;
  const lengthPx = scaledCm(measurement.lengthCm, pxPerCm, 120, 560);
  const diameterPx = scaledCm(measurement.diameterCm, pxPerCm, 36, 120);
  const fatPx = scaledCm(measurement.fatLayerCm, pxPerCm, 14, 80);
  const tipLength = clamp(diameterPx * 0.82, 34, 86);
  const tipX = referenceX + lengthPx;
  const bodyEndX = tipX - tipLength;
  const bodyLength = bodyEndX - referenceX;
  const topY = centerY - diameterPx / 2;
  const bottomY = centerY + diameterPx / 2;

  return (
    <svg
      className="anatomy-svg anatomy-svg--horizontal"
      viewBox="0 0 920 520"
      role="img"
      aria-label="abstract measurement visual"
    >
      <rect className="svg-bg" width="920" height="520" rx="18" />
      <path className="svg-grid-soft" d="M80 140 H840 M80 260 H840 M80 380 H840" />
      <path
        className="svg-grid-strong"
        d="M160 100 V420 M320 100 V420 M480 100 V420 M640 100 V420 M800 100 V420"
      />
      <rect className="svg-stage" x="86" y="98" width="748" height="324" rx="14" />

      <line className="svg-ruler" x1="120" y1="455" x2="800" y2="455" />
      <path className="svg-tick" d="M120 445 V465 M290 448 V462 M460 445 V465 M630 448 V462 M800 445 V465" />
      <text className="svg-small" x="118" y="486">
        horizontal ruler
      </text>

      <rect
        className="svg-fat"
        x={referenceX - fatPx}
        y={centerY - 112}
        width={fatPx}
        height="224"
        rx="12"
      />
      <line className="svg-bone" x1={referenceX} y1="130" x2={referenceX} y2="390" />
      <text className="svg-small" x={referenceX - 82} y="122">
        pubic/fat reference
      </text>

      <rect
        className="svg-body"
        x={referenceX}
        y={topY}
        width={bodyLength}
        height={diameterPx}
        rx={diameterPx / 2}
        fill={measurement.color}
      />
      <path
        className="svg-tip"
        data-testid="tip-shape"
        d={`M ${bodyEndX} ${topY} C ${bodyEndX + tipLength * 0.72} ${topY + 6}, ${tipX} ${centerY - diameterPx * 0.28}, ${tipX} ${centerY} C ${tipX} ${centerY + diameterPx * 0.28}, ${bodyEndX + tipLength * 0.72} ${bottomY - 6}, ${bodyEndX} ${bottomY} Z`}
      />

      <g
        className="svg-measure"
        data-testid="length-marker"
        data-measures="pubic-bone-to-tip"
        data-marker-end-x={tipX}
        data-tip-x={tipX}
      >
        <line x1={referenceX} y1="162" x2={tipX} y2="162" />
        <path d={`M ${referenceX} 152 V172 M ${tipX} 152 V172`} />
      </g>
      <text className="svg-measure-label" x={(referenceX + tipX) / 2 - 42} y="150">
        length to tip
      </text>

      <g className="svg-measure">
        <line x1={tipX + 38} y1={topY} x2={tipX + 38} y2={bottomY} />
        <path d={`M ${tipX + 28} ${topY} H ${tipX + 48} M ${tipX + 28} ${bottomY} H ${tipX + 48}`} />
      </g>
      <text className="svg-measure-label" x={tipX + 54} y={centerY + 5}>
        diameter
      </text>

      <text className="svg-status" x="690" y="82">
        {statusLabel(scaleStatus)}
      </text>
    </svg>
  );
}

function VerticalProjection({
  measurement,
  pxPerCm,
  scaleStatus,
}: Omit<AnatomySvgProps, "orientation">) {
  const referenceY = 548;
  const centerX = 178;
  const lengthPx = scaledCm(measurement.lengthCm, pxPerCm, 150, 440);
  const diameterPx = scaledCm(measurement.diameterCm, pxPerCm, 34, 104);
  const fatPx = scaledCm(measurement.fatLayerCm, pxPerCm, 14, 70);
  const tipLength = clamp(diameterPx * 0.82, 32, 76);
  const tipY = referenceY - lengthPx;
  const bodyTopY = tipY + tipLength;
  const bodyLength = referenceY - bodyTopY;
  const leftX = centerX - diameterPx / 2;
  const rightX = centerX + diameterPx / 2;

  return (
    <svg
      className="anatomy-svg anatomy-svg--vertical"
      viewBox="0 0 360 680"
      role="img"
      aria-label="abstract measurement visual"
      data-testid="mobile-projection"
    >
      <rect className="svg-bg" width="360" height="680" rx="18" />
      <path className="svg-grid-soft" d="M54 160 H306 M54 300 H306 M54 440 H306" />
      <path className="svg-grid-strong" d="M92 96 V594 M178 96 V594 M264 96 V594" />
      <rect className="svg-stage" x="42" y="80" width="276" height="536" rx="14" />

      <line className="svg-ruler" x1="34" y1="100" x2="34" y2="590" />
      <path className="svg-tick" d="M24 100 H44 M27 222 H41 M24 344 H44 M27 466 H41 M24 588 H44" />
      <text className="svg-small" x="58" y="104">
        vertical ruler
      </text>

      <rect
        className="svg-fat"
        x="74"
        y={referenceY}
        width="208"
        height={fatPx}
        rx="12"
      />
      <line className="svg-bone" x1="74" y1={referenceY} x2="282" y2={referenceY} />
      <text className="svg-small" x="92" y={referenceY + fatPx + 28}>
        pubic/fat reference
      </text>

      <rect
        className="svg-body"
        x={leftX}
        y={bodyTopY}
        width={diameterPx}
        height={bodyLength}
        rx={diameterPx / 2}
        fill={measurement.color}
      />
      <path
        className="svg-tip"
        data-testid="tip-shape"
        d={`M ${leftX} ${bodyTopY} C ${leftX + 6} ${bodyTopY - tipLength * 0.72}, ${centerX - diameterPx * 0.28} ${tipY}, ${centerX} ${tipY} C ${centerX + diameterPx * 0.28} ${tipY}, ${rightX - 6} ${bodyTopY - tipLength * 0.72}, ${rightX} ${bodyTopY} Z`}
      />

      <g
        className="svg-measure"
        data-testid="length-marker"
        data-measures="pubic-bone-to-tip"
        data-marker-end-y={tipY}
        data-tip-y={tipY}
      >
        <line x1="304" y1={referenceY} x2="304" y2={tipY} />
        <path d={`M 294 ${referenceY} H314 M294 ${tipY} H314`} />
      </g>
      <text className="svg-measure-label" x="210" y={(referenceY + tipY) / 2}>
        length to tip
      </text>

      <g className="svg-measure">
        <line x1={leftX} y1={bodyTopY + 74} x2={rightX} y2={bodyTopY + 74} />
        <path d={`M ${leftX} ${bodyTopY + 64} V ${bodyTopY + 84} M ${rightX} ${bodyTopY + 64} V ${bodyTopY + 84}`} />
      </g>
      <text className="svg-measure-label" x={centerX - 34} y={bodyTopY + 58}>
        diameter
      </text>

      <text className="svg-status" x="176" y="52">
        {statusLabel(scaleStatus)}
      </text>
    </svg>
  );
}

export function AnatomySvg(props: AnatomySvgProps) {
  if (props.orientation === "vertical") {
    return <VerticalProjection {...props} />;
  }

  return <HorizontalProjection {...props} />;
}
