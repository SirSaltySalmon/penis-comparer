import { fireEvent, render, screen } from "@testing-library/react";
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

  it("calibrates from the reference line's rendered height on mobile", async () => {
    const user = userEvent.setup();
    const onCalibrate = vi.fn();
    const basePxPerCm = 96 / 2.54;
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        width: 30,
        height: 240,
        top: 0,
        right: 30,
        bottom: 240,
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

    expect(onCalibrate).toHaveBeenCalledWith(240 / 8.56 / basePxPerCm);
    rectSpy.mockRestore();
  });

  it("keeps calibration estimated when the reference length is empty", async () => {
    const user = userEvent.setup();
    const onCalibrate = vi.fn();

    render(
      <CalibrationPanel
        basePxPerCm={96 / 2.54}
        onCalibrate={onCalibrate}
      />,
    );

    await user.clear(screen.getByRole("spinbutton", { name: /reference length/i }));
    await user.click(screen.getByRole("button", { name: /apply calibration/i }));

    expect(onCalibrate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /reference length must be a positive number/i,
    );
  });

  it("does not calibrate from an invalid measured width", async () => {
    const user = userEvent.setup();
    const onCalibrate = vi.fn();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: Number.NaN,
      height: 18,
      top: 0,
      right: 0,
      bottom: 18,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    render(
      <CalibrationPanel
        basePxPerCm={96 / 2.54}
        onCalibrate={onCalibrate}
      />,
    );
    fireEvent.change(screen.getByRole("slider", { name: /on-screen pixels/i }), {
      target: { value: "0" },
    });

    await user.click(screen.getByRole("button", { name: /apply calibration/i }));

    expect(onCalibrate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /measured width must be a positive number/i,
    );
  });
});
