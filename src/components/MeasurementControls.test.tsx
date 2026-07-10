import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_MEASUREMENT } from "../model/measurement";
import { MeasurementControls } from "./MeasurementControls";

describe("MeasurementControls", () => {
  it("updates length in canonical centimeters and marks the value custom", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MeasurementControls
        value={DEFAULT_MEASUREMENT}
        errors={{}}
        onChange={onChange}
        onShare={vi.fn()}
      />,
    );

    const lengthInput = screen.getByRole("spinbutton", { name: /length/i });
    await user.clear(lengthInput);
    await user.type(lengthInput, "14");

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ lengthCm: 14, presetId: "custom" }),
    );
  });

  it("shares the current measurement", async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();

    render(
      <MeasurementControls
        value={DEFAULT_MEASUREMENT}
        errors={{}}
        onChange={vi.fn()}
        onShare={onShare}
      />,
    );

    await user.click(screen.getByRole("button", { name: /copy share link/i }));

    expect(onShare).toHaveBeenCalled();
  });
});
