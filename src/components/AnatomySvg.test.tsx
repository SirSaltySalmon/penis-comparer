import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_MEASUREMENT } from "../model/measurement";
import { AnatomySvg } from "./AnatomySvg";

describe("AnatomySvg", () => {
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
});
