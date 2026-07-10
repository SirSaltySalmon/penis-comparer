import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_MEASUREMENT, PRESETS } from "../model/measurement";
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

  it("updates the tip color independently from the shaft color", () => {
    const onChange = vi.fn();

    render(
      <MeasurementControls
        value={DEFAULT_MEASUREMENT}
        errors={{}}
        onChange={onChange}
        onShare={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tip color"), {
      target: { value: "#123456" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_MEASUREMENT,
      tipColor: "#123456",
      presetId: "custom",
    });
  });

  it("updates the fat layer color independently", () => {
    const onChange = vi.fn();

    render(
      <MeasurementControls
        value={DEFAULT_MEASUREMENT}
        errors={{}}
        onChange={onChange}
        onShare={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Fat layer color"), {
      target: { value: "#654321" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_MEASUREMENT,
      fatColor: "#654321",
      presetId: "custom",
    });
  });

  it("restores shaft, fat layer, and tip colors from a preset", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <MeasurementControls
        value={{
          ...DEFAULT_MEASUREMENT,
          color: "#111111",
          fatColor: "#222222",
          tipColor: "#333333",
          unitMode: "imperial",
          presetId: "custom",
        }}
        errors={{}}
        onChange={onChange}
        onShare={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Preset"), "veale-2015");

    const preset = PRESETS["veale-2015"];
    expect(onChange).toHaveBeenCalledWith({
      lengthCm: preset.lengthCm,
      diameterCm: preset.diameterCm,
      fatLayerCm: preset.fatLayerCm,
      color: preset.color,
      fatColor: preset.fatColor,
      tipColor: preset.tipColor,
      unitMode: "imperial",
      presetId: "veale-2015",
    });
  });

  it("connects invalid fields to accessible error messages", () => {
    render(
      <MeasurementControls
        value={DEFAULT_MEASUREMENT}
        errors={{
          lengthCm: "Length error",
          diameterCm: "Diameter error",
          fatLayerCm: "Fat layer error",
          tipColor: "Tip color error",
          color: "Shaft color error",
          fatColor: "Fat layer color error",
        }}
        onChange={vi.fn()}
        onShare={vi.fn()}
      />,
    );

    const fields = [
      ["Length", "measurement-length", "measurement-length-error"],
      ["Diameter", "measurement-diameter", "measurement-diameter-error"],
      ["Fat layer", "measurement-fat-layer", "measurement-fat-layer-error"],
      ["Tip color", "measurement-tip-color", "measurement-tip-color-error"],
      ["Shaft color", "measurement-color", "measurement-color-error"],
      ["Fat layer color", "measurement-fat-color", "measurement-fat-color-error"],
    ];

    for (const [label, inputId, errorId] of fields) {
      const input = screen.getByLabelText(label);
      expect(input).toHaveAttribute("id", inputId);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", errorId);
      expect(document.getElementById(errorId)).toBeInTheDocument();
    }
  });
});
