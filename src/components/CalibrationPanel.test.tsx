import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalibrationPanel } from "./CalibrationPanel";

describe("CalibrationPanel", () => {
  it("calibrates from the reference line's rendered width", async () => {
    const user = userEvent.setup();
    const onCalibrate = vi.fn();
    const basePxPerCm = 96 / 2.54;
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        width: 200,
        height: 18,
        top: 0,
        right: 200,
        bottom: 18,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

    render(
      <CalibrationPanel
        basePxPerCm={basePxPerCm}
        onCalibrate={onCalibrate}
      />,
    );

    await user.click(screen.getByRole("button", { name: /apply calibration/i }));

    expect(onCalibrate).toHaveBeenCalledWith(
      200 / 8.56 / basePxPerCm,
    );
    rectSpy.mockRestore();
  });
});
