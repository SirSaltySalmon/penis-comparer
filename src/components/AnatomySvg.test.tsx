import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_MEASUREMENT } from "../model/measurement";
import { AnatomySvg } from "./AnatomySvg";

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
