import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_MEASUREMENT } from "../model/measurement";
import {
  AnatomySvg,
  RULER_LABEL_MIN_SPACING_PX,
  chooseRulerLabelInterval,
} from "./AnatomySvg";

describe("AnatomySvg", () => {
  const edgeCaseMeasurement = {
    ...DEFAULT_MEASUREMENT,
    lengthCm: 1,
    diameterCm: 20,
    fatLayerCm: 1,
    presetId: "custom" as const,
  };

  const getOnlyLine = (container: HTMLElement): Element => {
    const line = container.querySelector("line");

    if (line?.tagName !== "line") {
      throw new Error("Expected marker to contain a line");
    }

    return line;
  };

  const getPathPoints = (path: Element): Array<[number, number]> => {
    const values =
      path
        .getAttribute("d")
        ?.match(/-?\d+(?:\.\d+)?/g)
        ?.map(Number) ?? [];
    const points: Array<[number, number]> = [];

    for (let index = 0; index < values.length; index += 2) {
      points.push([values[index], values[index + 1]]);
    }

    return points;
  };

  const markerDelta = (
    measurement: typeof DEFAULT_MEASUREMENT,
    orientation: "horizontal" | "vertical",
    pxPerCm: number,
  ): number => {
    const { unmount } = render(
      <AnatomySvg
        measurement={measurement}
        orientation={orientation}
        pxPerCm={pxPerCm}
        scaleStatus="estimated"
      />,
    );
    const line = getOnlyLine(screen.getByTestId("length-marker"));
    const delta =
      orientation === "horizontal"
        ? Number(line.getAttribute("x2")) - Number(line.getAttribute("x1"))
        : Number(line.getAttribute("y1")) - Number(line.getAttribute("y2"));
    unmount();
    return delta;
  };

  it("renders the horizontal projection with a pubic-bone-to-tip length marker", () => {
    render(
      <AnatomySvg
        measurement={DEFAULT_MEASUREMENT}
        orientation="horizontal"
        pxPerCm={20}
        scaleStatus="estimated"
      />,
    );

    expect(
      screen.getByRole("img", { name: /abstract measurement visual/i }),
    ).toHaveClass("anatomy-svg", "anatomy-svg--horizontal");
    expect(screen.getByText(/horizontal estimated measurement visual/i)).toBeInTheDocument();
    expect(
      screen.getByText(/length 13\.12 cm, diameter 3\.71 cm, fat layer 1 cm/i),
    ).toBeInTheDocument();
    expect(screen.getByText("length to tip")).toBeVisible();
    expect(screen.getByTestId("length-marker")).toHaveAttribute(
      "data-measures",
      "pubic-bone-to-tip",
    );
  });

  it("keeps the horizontal marker endpoint aligned with the visual tip for short large-diameter values", () => {
    render(
      <AnatomySvg
        measurement={edgeCaseMeasurement}
        orientation="horizontal"
        pxPerCm={20}
        scaleStatus="estimated"
      />,
    );

    const marker = screen.getByTestId("length-marker");
    const markerLine = getOnlyLine(marker);
    const tipShape = screen.getByTestId("tip-shape");
    const markerEndX = Number(markerLine.getAttribute("x2"));
    const tipPoints = getPathPoints(tipShape);
    const maxTipX = Math.max(...tipPoints.map(([x]) => x));

    expect(marker).toHaveAttribute("data-measures", "pubic-bone-to-tip");
    expect(maxTipX).toBe(markerEndX);
    expect(tipPoints.some(([x]) => x === markerEndX)).toBe(true);
  });

  it("renders the vertical mobile projection with calibrated scale and diameter labels", () => {
    render(
      <AnatomySvg
        measurement={DEFAULT_MEASUREMENT}
        orientation="vertical"
        pxPerCm={20}
        scaleStatus="calibrated"
      />,
    );

    expect(screen.getByTestId("mobile-projection")).toHaveClass(
      "anatomy-svg",
      "anatomy-svg--vertical",
    );
    expect(screen.getByText("calibrated scale")).toBeVisible();
    expect(screen.getByText("diameter")).toBeVisible();
  });

  it.each(["horizontal", "vertical"] as const)(
    "renders the %s tip using its independent color",
    (orientation) => {
      render(
        <AnatomySvg
          measurement={{
            ...DEFAULT_MEASUREMENT,
            color: "#112233",
            tipColor: "#abcdef",
            presetId: "custom",
          }}
          orientation={orientation}
          pxPerCm={20}
          scaleStatus="estimated"
        />,
      );

      expect(screen.getByTestId("tip-shape")).toHaveAttribute("fill", "#abcdef");
    },
  );

  const renderFatLayer = (
    orientation: "horizontal" | "vertical",
    fatLayerCm: number,
  ) => {
    const result = render(
      <AnatomySvg
        measurement={{
          ...DEFAULT_MEASUREMENT,
          fatLayerCm,
          fatColor: "#abcdef",
          presetId: "custom",
        }}
        orientation={orientation}
        pxPerCm={20}
        scaleStatus="estimated"
      />,
    );
    const layer = screen.getByTestId("fat-layer");
    const body = result.container.querySelector(".svg-body");
    if (!body) throw new Error("Expected shaft body");

    const rect = (element: Element) => ({
      x: Number(element.getAttribute("x")),
      y: Number(element.getAttribute("y")),
      width: Number(element.getAttribute("width")),
      height: Number(element.getAttribute("height")),
    });
    const value = { layer: rect(layer), body: rect(body) };
    result.unmount();
    return value;
  };

  it("renders a vertical fat layer across the horizontal shaft", () => {
    const oneCm = renderFatLayer("horizontal", 1);
    const twoCm = renderFatLayer("horizontal", 2);

    expect(oneCm.layer.width).toBe(20);
    expect(twoCm.layer.width).toBe(40);
    expect(twoCm.layer.x).toBe(oneCm.layer.x);
    expect(oneCm.layer.height).toBe(oneCm.body.height + 30);
    expect(oneCm.layer.y).toBe(oneCm.body.y - 15);
  });

  it("renders a wider horizontal fat layer that grows upward on the vertical shaft", () => {
    const oneCm = renderFatLayer("vertical", 1);
    const twoCm = renderFatLayer("vertical", 2);

    expect(oneCm.layer.height).toBe(20);
    expect(twoCm.layer.height).toBe(40);
    expect(twoCm.layer.y).toBe(oneCm.layer.y - 20);
    expect(twoCm.layer.y + twoCm.layer.height).toBe(
      oneCm.layer.y + oneCm.layer.height,
    );
    expect(oneCm.layer.width).toBe(oneCm.body.width + 30);
    expect(oneCm.layer.x).toBe(oneCm.body.x - 15);
  });

  it.each(["horizontal", "vertical"] as const)(
    "uses the selected fat color in the %s projection",
    (orientation) => {
      render(
        <AnatomySvg
          measurement={{
            ...DEFAULT_MEASUREMENT,
            fatColor: "#abcdef",
            presetId: "custom",
          }}
          orientation={orientation}
          pxPerCm={20}
          scaleStatus="estimated"
        />,
      );
      expect(screen.getByTestId("fat-layer")).toHaveAttribute(
        "fill",
        "#abcdef",
      );
    },
  );

  it("keeps vertical canvas space below the reference stable at fat-layer boundaries", () => {
    const renderBoundary = (fatLayerCm: number) => {
      const result = render(
        <AnatomySvg
          measurement={{
            ...DEFAULT_MEASUREMENT,
            fatLayerCm,
            presetId: "custom",
          }}
          orientation="vertical"
          pxPerCm={20}
          scaleStatus="estimated"
        />,
      );
      const svg = screen.getByTestId("mobile-projection");
      const layer = screen.getByTestId("fat-layer");
      const body = result.container.querySelector(".svg-body");
      const referenceLabel = screen.getByText("pubic bone");
      if (!body) throw new Error("Expected shaft body");

      const bodyBottom =
        Number(body.getAttribute("y")) + Number(body.getAttribute("height"));
      const value = {
        svgHeight: Number(svg.getAttribute("height")),
        layerY: Number(layer.getAttribute("y")),
        layerHeight: Number(layer.getAttribute("height")),
        layerBottom:
          Number(layer.getAttribute("y")) +
          Number(layer.getAttribute("height")),
        bodyBottom,
        referenceLabelY: Number(referenceLabel.getAttribute("y")),
      };
      result.unmount();
      return value;
    };

    const zero = renderBoundary(0);
    const maximum = renderBoundary(10);

    expect(zero.layerHeight).toBe(0);
    expect(maximum.layerHeight).toBe(200);
    expect(maximum.layerY).toBeGreaterThanOrEqual(0);
    expect(zero.layerBottom).toBe(zero.bodyBottom);
    expect(maximum.layerBottom).toBe(maximum.bodyBottom);
    expect(maximum.svgHeight).toBe(zero.svgHeight);
    expect(maximum.referenceLabelY).toBe(zero.referenceLabelY);
  });

  it("keeps the vertical marker endpoint aligned with the visual tip for short large-diameter values", () => {
    render(
      <AnatomySvg
        measurement={edgeCaseMeasurement}
        orientation="vertical"
        pxPerCm={20}
        scaleStatus="calibrated"
      />,
    );

    const marker = screen.getByTestId("length-marker");
    const markerLine = getOnlyLine(marker);
    const tipShape = screen.getByTestId("tip-shape");
    const markerEndY = Number(markerLine.getAttribute("y2"));
    const tipPoints = getPathPoints(tipShape);
    const minTipY = Math.min(...tipPoints.map(([, y]) => y));

    expect(marker).toHaveAttribute("data-measures", "pubic-bone-to-tip");
    expect(minTipY).toBe(markerEndY);
    expect(tipPoints.some(([, y]) => y === markerEndY)).toBe(true);
  });

  it("keeps the vertical diameter marker inside the body above the pubic-bone reference", () => {
    render(
      <AnatomySvg
        measurement={edgeCaseMeasurement}
        orientation="vertical"
        pxPerCm={20}
        scaleStatus="calibrated"
      />,
    );

    const marker = screen.getByTestId("diameter-marker");
    const markerLine = getOnlyLine(marker);
    const markerY = Number(marker.getAttribute("data-marker-y"));
    const lineY = Number(markerLine.getAttribute("y1"));

    expect(markerY).toBe(lineY);
    expect(markerY).toBeLessThan(548);
  });

  it.each(["horizontal", "vertical"] as const)(
    "keeps %s length geometry monotonic and exact across supported values",
    (orientation) => {
      const pxPerCm = 20;
      const lengths = [1, 13.12, 13.93, 40];
      const deltas = lengths.map((lengthCm) =>
        markerDelta(
          {
            ...DEFAULT_MEASUREMENT,
            lengthCm,
            presetId: "custom",
          },
          orientation,
          pxPerCm,
        ),
      );

      expect(deltas).toEqual(lengths.map((length) => length * pxPerCm));
      expect(deltas).toEqual([...deltas].sort((a, b) => a - b));
    },
  );

  it("chooses human-readable label intervals with documented minimum spacing", () => {
    expect(RULER_LABEL_MIN_SPACING_PX).toBe(56);
    expect(chooseRulerLabelInterval(96 / 2.54)).toBe(2);
    expect(chooseRulerLabelInterval(20)).toBe(5);
    expect(chooseRulerLabelInterval(3)).toBe(20);
  });

  it.each(["horizontal", "vertical"] as const)(
    "keeps low-scale %s ruler labels separated and includes the range endpoint",
    (orientation) => {
      render(
        <AnatomySvg
          measurement={{
            ...DEFAULT_MEASUREMENT,
            lengthCm: 40,
            presetId: "custom",
          }}
          orientation={orientation}
          pxPerCm={3}
          scaleStatus="calibrated"
        />,
      );
      const labels = screen.getAllByTestId("ruler-label");
      const positions = labels.map((label) =>
        Number(label.getAttribute(orientation === "horizontal" ? "x" : "y")),
      );

      expect(labels.map((label) => label.textContent)).toEqual([
        "0 cm",
        "20 cm",
        "40 cm",
      ]);
      expect(labels.map((label) => label.getAttribute("data-ruler-value"))).toEqual([
        "0",
        "20",
        "40",
      ]);
      for (let index = 1; index < positions.length; index += 1) {
        expect(Math.abs(positions[index] - positions[index - 1])).toBeGreaterThanOrEqual(
          56,
        );
      }
    },
  );

  it.each(["horizontal", "vertical"] as const)(
    "uses exact %s diameter geometry across supported values",
    (orientation) => {
      const pxPerCm = 20;

      for (const diameterCm of [0.1, 3.71, 20]) {
        const { unmount } = render(
          <AnatomySvg
            measurement={{
              ...DEFAULT_MEASUREMENT,
              diameterCm,
              presetId: "custom",
            }}
            orientation={orientation}
            pxPerCm={pxPerCm}
            scaleStatus="estimated"
          />,
        );
        const marker = screen.getByTestId("diameter-marker");
        const line = getOnlyLine(marker);
        const delta =
          orientation === "horizontal"
            ? Number(line.getAttribute("y2")) - Number(line.getAttribute("y1"))
            : Number(line.getAttribute("x2")) - Number(line.getAttribute("x1"));

        expect(delta).toBeCloseTo(diameterCm * pxPerCm, 8);
        unmount();
      }
    },
  );

  it.each(["horizontal", "vertical"] as const)(
    "uses one intrinsic CSS pixel per %s viewBox unit and scale-based ruler ticks",
    (orientation) => {
      render(
        <AnatomySvg
          measurement={DEFAULT_MEASUREMENT}
          orientation={orientation}
          pxPerCm={20}
          scaleStatus="estimated"
        />,
      );
      const svg = screen.getByRole("img", {
        name: new RegExp(`${orientation} estimated measurement visual`, "i"),
      });
      const [, , viewBoxWidth, viewBoxHeight] = svg
        .getAttribute("viewBox")!
        .split(/\s+/)
        .map(Number);
      const ticks = screen.getAllByTestId("ruler-tick");
      const first = ticks[0];
      const second = ticks[1];
      const spacing =
        orientation === "horizontal"
          ? Number(second.getAttribute("x1")) - Number(first.getAttribute("x1"))
          : Number(first.getAttribute("y1")) - Number(second.getAttribute("y1"));

      expect(svg).toHaveAttribute("width", String(viewBoxWidth));
      expect(svg).toHaveAttribute("height", String(viewBoxHeight));
      expect(spacing).toBe(20);
    },
  );

  it("labels the horizontal ruler from the pubic-bone origin through the ceiling value", () => {
    render(
      <AnatomySvg
        measurement={DEFAULT_MEASUREMENT}
        orientation="horizontal"
        pxPerCm={20}
        scaleStatus="estimated"
      />,
    );
    const lengthLine = getOnlyLine(screen.getByTestId("length-marker"));
    const ticks = screen.getAllByTestId("ruler-tick");
    const zeroTick = ticks.find(
      (tick) => tick.getAttribute("data-ruler-value") === "0",
    )!;
    const finalTick = ticks.find(
      (tick) => tick.getAttribute("data-ruler-value") === "14",
    )!;

    expect(ticks).toHaveLength(15);
    expect(zeroTick).toHaveAttribute("x1", lengthLine.getAttribute("x1"));
    expect(Number(finalTick.getAttribute("x1"))).toBe(
      Number(zeroTick.getAttribute("x1")) + 14 * 20,
    );
    expect(screen.getByText("0 cm")).toBeInTheDocument();
    expect(screen.getByText("5 cm")).toBeInTheDocument();
    expect(screen.getByText("10 cm")).toBeInTheDocument();
    expect(screen.getByText("14 cm")).toBeInTheDocument();
  });

  it("labels the vertical ruler upward from zero at the pubic-bone base", () => {
    render(
      <AnatomySvg
        measurement={DEFAULT_MEASUREMENT}
        orientation="vertical"
        pxPerCm={20}
        scaleStatus="estimated"
      />,
    );
    const lengthLine = getOnlyLine(screen.getByTestId("length-marker"));
    const ticks = screen.getAllByTestId("ruler-tick");
    const zeroTick = ticks.find(
      (tick) => tick.getAttribute("data-ruler-value") === "0",
    )!;
    const fiveTick = ticks.find(
      (tick) => tick.getAttribute("data-ruler-value") === "5",
    )!;
    const finalTick = ticks.find(
      (tick) => tick.getAttribute("data-ruler-value") === "14",
    )!;
    const referenceY = Number(lengthLine.getAttribute("y1"));

    expect(ticks).toHaveLength(15);
    expect(Number(zeroTick.getAttribute("y1"))).toBe(referenceY);
    expect(Number(fiveTick.getAttribute("y1"))).toBe(referenceY - 5 * 20);
    expect(Number(finalTick.getAttribute("y1"))).toBe(referenceY - 14 * 20);
    expect(screen.getByText("0 cm")).toBeInTheDocument();
    expect(screen.getByText("5 cm")).toBeInTheDocument();
    expect(screen.getByText("10 cm")).toBeInTheDocument();
    expect(screen.getByText("14 cm")).toBeInTheDocument();
  });

  it.each(["horizontal", "vertical"] as const)(
    "expands the %s viewport so valid maximum geometry is not clipped",
    (orientation) => {
      render(
        <AnatomySvg
          measurement={{
            ...DEFAULT_MEASUREMENT,
            lengthCm: 40,
            diameterCm: 20,
            fatLayerCm: 10,
            presetId: "custom",
          }}
          orientation={orientation}
          pxPerCm={20}
          scaleStatus="estimated"
        />,
      );
      const svg = screen.getByRole("img", {
        name: new RegExp(`${orientation} estimated measurement visual`, "i"),
      });
      const [, , width, height] = svg
        .getAttribute("viewBox")!
        .split(/\s+/)
        .map(Number);
      const marker = screen.getByTestId("length-marker");
      const diameter = screen.getByTestId("diameter-marker");
      const markerLine = getOnlyLine(marker);
      const diameterLine = getOnlyLine(diameter);
      const coordinates = [markerLine, diameterLine].flatMap((line) =>
        ["x1", "x2", "y1", "y2"].map((name) =>
          Number(line.getAttribute(name)),
        ),
      );
      const xs = coordinates.filter((_, index) => index % 4 < 2);
      const ys = coordinates.filter((_, index) => index % 4 >= 2);

      expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...xs)).toBeLessThanOrEqual(width);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...ys)).toBeLessThanOrEqual(height);
    },
  );
});
