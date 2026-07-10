import type { MeasurementState } from "../model/measurement";
import type { ScaleStatus } from "../model/scale";

export interface AnatomySvgProps {
  measurement: MeasurementState;
  orientation: "horizontal" | "vertical";
  pxPerCm: number;
  scaleStatus: ScaleStatus;
}

const pixelsForCm = (cm: number, pxPerCm: number): number => cm * pxPerCm;

const rulerValues = (lengthCm: number): number[] =>
  Array.from({ length: Math.ceil(lengthCm) + 1 }, (_, index) => index);

const isMajorRulerValue = (value: number): boolean => value % 5 === 0;

const statusLabel = (scaleStatus: ScaleStatus): string =>
  `${scaleStatus} scale`;

const formatCm = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(2);

const getA11yText = (
  orientation: AnatomySvgProps["orientation"],
  measurement: MeasurementState,
  scaleStatus: ScaleStatus,
) => {
  const titleId = `anatomy-svg-${orientation}-title`;
  const descId = `anatomy-svg-${orientation}-desc`;

  return {
    titleId,
    descId,
    title: `abstract measurement visual - ${orientation} ${scaleStatus} measurement visual`,
    desc: `length ${formatCm(measurement.lengthCm)} cm, diameter ${formatCm(measurement.diameterCm)} cm, fat layer ${formatCm(measurement.fatLayerCm)} cm`,
  };
};

function HorizontalProjection({
  measurement,
  pxPerCm,
  scaleStatus,
}: Omit<AnatomySvgProps, "orientation">) {
  const a11y = getA11yText("horizontal", measurement, scaleStatus);
  const lengthPx = pixelsForCm(measurement.lengthCm, pxPerCm);
  const diameterPx = pixelsForCm(measurement.diameterCm, pxPerCm);
  const fatPx = pixelsForCm(measurement.fatLayerCm, pxPerCm);
  const referenceX = Math.max(150, fatPx + 60);
  const centerY = Math.max(220, diameterPx / 2 + 120);
  const tipLength = Math.min(lengthPx, diameterPx * 0.82);
  const tipX = referenceX + lengthPx;
  const bodyEndX = tipX - tipLength;
  const bodyLength = bodyEndX - referenceX;
  const topY = centerY - diameterPx / 2;
  const bottomY = centerY + diameterPx / 2;
  const rulerY = bottomY + 70;
  const rulerEndX =
    referenceX + Math.ceil(measurement.lengthCm) * pxPerCm;
  const width = Math.ceil(
    Math.max(620, rulerEndX + 60, tipX + 150),
  );
  const height = Math.ceil(rulerY + 55);
  const ticks = rulerValues(measurement.lengthCm);

  return (
    <svg
      className="anatomy-svg anatomy-svg--horizontal"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-labelledby={`${a11y.titleId} ${a11y.descId}`}
      data-px-per-cm={pxPerCm}
    >
      <title id={a11y.titleId}>{a11y.title}</title>
      <desc id={a11y.descId}>{a11y.desc}</desc>
      <rect className="svg-bg" width={width} height={height} rx="18" />
      <rect
        className="svg-stage"
        x="28"
        y="78"
        width={width - 56}
        height={rulerY - 108}
        rx="14"
      />
      {ticks.map((value) => {
        const x = referenceX + value * pxPerCm;
        return (
          <line
            key={`grid-${value}`}
            className={isMajorRulerValue(value) ? "svg-grid-strong" : "svg-grid-soft"}
            x1={x}
            x2={x}
            y1="90"
            y2={rulerY - 20}
          />
        );
      })}

      <line className="svg-ruler" x1={referenceX} y1={rulerY} x2={rulerEndX} y2={rulerY} />
      {ticks.map((value) => {
        const x = referenceX + value * pxPerCm;
        return (
          <line
            key={`tick-${value}`}
            data-testid="ruler-tick"
            data-ruler-value={value}
            className="svg-tick"
            x1={x}
            x2={x}
            y1={rulerY - (isMajorRulerValue(value) ? 10 : 7)}
            y2={rulerY + (isMajorRulerValue(value) ? 10 : 7)}
          />
        );
      })}
      {ticks.filter(isMajorRulerValue).map((value) => (
        <text
          key={`label-${value}`}
          className="svg-small"
          data-testid="ruler-label"
          x={referenceX + value * pxPerCm}
          y={rulerY + 34}
          textAnchor="middle"
        >
          {value} cm
        </text>
      ))}

      <rect
        className="svg-fat"
        x={referenceX - fatPx}
        y={topY - 35}
        width={fatPx}
        height={diameterPx + 70}
        rx="12"
      />
      <line className="svg-bone" x1={referenceX} y1={topY - 45} x2={referenceX} y2={bottomY + 45} />
      <text className="svg-small" x={Math.max(12, referenceX - 120)} y={topY - 55}>
        pubic/fat reference
      </text>

      <rect
        className="svg-body"
        x={referenceX}
        y={topY}
        width={bodyLength}
        height={diameterPx}
        rx={Math.min(diameterPx / 2, bodyLength / 2)}
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
        <line x1={referenceX} y1={topY - 28} x2={tipX} y2={topY - 28} />
        <path d={`M ${referenceX} ${topY - 38} V${topY - 18} M ${tipX} ${topY - 38} V${topY - 18}`} />
      </g>
      <text className="svg-measure-label" x={(referenceX + tipX) / 2 - 42} y={topY - 40}>
        length to tip
      </text>

      <g className="svg-measure" data-testid="diameter-marker">
        <line x1={tipX + 38} y1={topY} x2={tipX + 38} y2={bottomY} />
        <path d={`M ${tipX + 28} ${topY} H ${tipX + 48} M ${tipX + 28} ${bottomY} H ${tipX + 48}`} />
      </g>
      <text className="svg-measure-label" x={tipX + 54} y={centerY + 5}>
        diameter
      </text>

      <text className="svg-status" x={width - 180} y="50">
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
  const a11y = getA11yText("vertical", measurement, scaleStatus);
  const lengthPx = pixelsForCm(measurement.lengthCm, pxPerCm);
  const diameterPx = pixelsForCm(measurement.diameterCm, pxPerCm);
  const fatPx = pixelsForCm(measurement.fatLayerCm, pxPerCm);
  const rulerMaximum = Math.ceil(measurement.lengthCm);
  const rulerOverhangPx =
    (rulerMaximum - measurement.lengthCm) * pxPerCm;
  const tipY = Math.max(100, rulerOverhangPx + 40);
  const referenceY = tipY + lengthPx;
  const centerX = Math.max(140, diameterPx / 2 + 70);
  const tipLength = Math.min(lengthPx, diameterPx * 0.82);
  const bodyTopY = tipY + tipLength;
  const bodyLength = referenceY - bodyTopY;
  const leftX = centerX - diameterPx / 2;
  const rightX = centerX + diameterPx / 2;
  const diameterMarkerY = tipY + lengthPx / 2;
  const rulerX = 16;
  const markerX = rightX + 20;
  const width = Math.ceil(Math.max(280, markerX + 30, rightX + 50));
  const height = Math.ceil(referenceY + fatPx + 80);
  const ticks = rulerValues(measurement.lengthCm);
  const rulerEndY = referenceY - rulerMaximum * pxPerCm;

  return (
    <svg
      className="anatomy-svg anatomy-svg--vertical"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-labelledby={`${a11y.titleId} ${a11y.descId}`}
      data-testid="mobile-projection"
      data-px-per-cm={pxPerCm}
    >
      <title id={a11y.titleId}>{a11y.title}</title>
      <desc id={a11y.descId}>{a11y.desc}</desc>
      <rect className="svg-bg" width={width} height={height} rx="18" />
      <rect
        className="svg-stage"
        x="44"
        y="78"
        width={width - 62}
        height={referenceY - 48}
        rx="14"
      />
      {ticks.map((value) => {
        return (
          <line
            key={`grid-${value}`}
            className={isMajorRulerValue(value) ? "svg-grid-strong" : "svg-grid-soft"}
            x1="44"
            x2={width - 18}
            y1={referenceY - value * pxPerCm}
            y2={referenceY - value * pxPerCm}
          />
        );
      })}

      <line className="svg-ruler" x1={rulerX} y1={referenceY} x2={rulerX} y2={rulerEndY} />
      {ticks.map((value) => {
        const y = referenceY - value * pxPerCm;
        return (
          <line
            key={`tick-${value}`}
            data-testid="ruler-tick"
            data-ruler-value={value}
            className="svg-tick"
            x1={rulerX - (isMajorRulerValue(value) ? 10 : 7)}
            x2={rulerX + (isMajorRulerValue(value) ? 10 : 7)}
            y1={y}
            y2={y}
          />
        );
      })}
      {ticks.filter(isMajorRulerValue).map((value) => (
        <text
          key={`label-${value}`}
          className="svg-small"
          data-testid="ruler-label"
          x="30"
          y={referenceY - value * pxPerCm + 5}
        >
          {value} cm
        </text>
      ))}

      <rect
        className="svg-fat"
        x={leftX - 25}
        y={referenceY}
        width={diameterPx + 50}
        height={fatPx}
        rx="12"
      />
      <line className="svg-bone" x1={leftX - 35} y1={referenceY} x2={rightX + 35} y2={referenceY} />
      <text className="svg-small" x={leftX} y={referenceY + fatPx + 28}>
        pubic/fat reference
      </text>

      <rect
        className="svg-body"
        x={leftX}
        y={bodyTopY}
        width={diameterPx}
        height={bodyLength}
        rx={Math.min(diameterPx / 2, bodyLength / 2)}
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
        <line x1={markerX} y1={referenceY} x2={markerX} y2={tipY} />
        <path d={`M ${markerX - 10} ${referenceY} H${markerX + 10} M${markerX - 10} ${tipY} H${markerX + 10}`} />
      </g>
      <text className="svg-measure-label" x={centerX} y={(referenceY + tipY) / 2 - 16} textAnchor="middle">
        length to tip
      </text>

      <g
        className="svg-measure"
        data-testid="diameter-marker"
        data-marker-y={diameterMarkerY}
      >
        <line x1={leftX} y1={diameterMarkerY} x2={rightX} y2={diameterMarkerY} />
        <path d={`M ${leftX} ${diameterMarkerY - 10} V ${diameterMarkerY + 10} M ${rightX} ${diameterMarkerY - 10} V ${diameterMarkerY + 10}`} />
      </g>
      <text className="svg-measure-label" x={centerX - 34} y={diameterMarkerY - 16}>
        diameter
      </text>

      <text className="svg-status" x={width - 184} y="52">
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
