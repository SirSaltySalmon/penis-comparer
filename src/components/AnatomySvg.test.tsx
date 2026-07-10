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
      screen.getByRole("img", { name: "abstract measurement visual" }),
    ).toHaveClass("anatomy-svg", "anatomy-svg--horizontal");
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
    const markerEndX = markerLine.getAttribute("x2");
    const centerY = "260";

    expect(marker).toHaveAttribute("data-measures", "pubic-bone-to-tip");
    expect(markerEndX).not.toBeNull();
    expect(tipShape.getAttribute("d")).toContain(`${markerEndX} ${centerY}`);
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
    const centerX = "178";
    const markerEndY = markerLine.getAttribute("y2");

    expect(marker).toHaveAttribute("data-measures", "pubic-bone-to-tip");
    expect(markerEndY).not.toBeNull();
    expect(tipShape.getAttribute("d")).toContain(`${centerX} ${markerEndY}`);
  });
});
