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
    expect(tipPoints).toContainEqual([markerEndX, 260]);
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
    expect(tipPoints).toContainEqual([178, markerEndY]);
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
});
