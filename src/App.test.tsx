import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  const horizontalLengthDelta = (): number => {
    const line = screen
      .getAllByTestId("length-marker")[0]
      .querySelector("line");

    if (!line) throw new Error("Expected horizontal length marker line");
    return Number(line.getAttribute("x2")) - Number(line.getAttribute("x1"));
  };

  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    document.cookie = "physical_scale_v1=; Max-Age=0; Path=/";
    Object.defineProperty(window.screen, "width", { configurable: true, value: 1440 });
    Object.defineProperty(window.screen, "height", { configurable: true, value: 900 });
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 1.5 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("links the cited studies from the educational source note", () => {
    render(<App />);

    const vealeLink = screen.getByRole("link", { name: "Veale et al. 2015" });
    const belladelliLink = screen.getByRole("link", {
      name: "Belladelli et al. 2023",
    });

    expect(vealeLink).toHaveAttribute(
      "href",
      "https://pubmed.ncbi.nlm.nih.gov/25487360/",
    );
    expect(vealeLink).toHaveAttribute("target", "_blank");
    expect(vealeLink).toHaveAttribute("rel", "noreferrer");
    expect(belladelliLink).toHaveAttribute(
      "href",
      "https://pubmed.ncbi.nlm.nih.gov/36792094/",
    );
    expect(belladelliLink).toHaveAttribute("target", "_blank");
    expect(belladelliLink).toHaveAttribute("rel", "noreferrer");
    expect(screen.getByText(/educational visualization only/i)).toBeVisible();
  });

  it("does not replace history with invalid measurement values", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    render(<App />);
    const callsWithValidState = replaceState.mock.calls.length;

    fireEvent.change(screen.getByLabelText("Length"), {
      target: { value: "0" },
    });
    await screen.findByText(/length must be greater than 0 cm/i);

    expect(replaceState).toHaveBeenCalledTimes(callsWithValidState);
    expect(window.location.search).not.toContain("l=0");
  });

  it("blocks sharing while measurements are invalid", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<App />);

    fireEvent.change(screen.getByLabelText("Length"), {
      target: { value: "0" },
    });
    await user.click(screen.getByRole("button", { name: /copy share link/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /fix invalid measurements before copying/i,
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it("reports clipboard failures with actionable feedback", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /copy share link/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /could not copy.*address bar/i,
    );
  });

  it("does not compound repeated calibration from the same reference", async () => {
    const user = userEvent.setup();
    render(<App />);
    fireEvent.change(screen.getByRole("slider", { name: /on-screen pixels/i }), {
      target: { value: "280" },
    });

    const applyButton = screen.getByRole("button", {
      name: /apply calibration/i,
    });
    await user.click(applyButton);
    const firstEndpoint = screen
      .getAllByTestId("length-marker")[0]
      .getAttribute("data-marker-end-x");

    await user.click(applyButton);
    const secondEndpoint = screen
      .getAllByTestId("length-marker")[0]
      .getAttribute("data-marker-end-x");

    expect(secondEndpoint).toBe(firstEndpoint);
  });

  it("accepts and remembers an unknown monitor's diagonal size", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole("spinbutton", { name: /monitor size/i }), "27");
    await user.click(screen.getByRole("button", { name: /apply monitor size/i }));

    expect(screen.getByText(/estimated from saved monitor size/i)).toBeVisible();
    expect(document.cookie).toContain("physical_scale_v1=");
    expect(screen.getByRole("button", { name: /forget saved scale/i })).toBeVisible();
  });

  it("renders the last valid measurement while an invalid draft is displayed", () => {
    render(<App />);
    const initialDelta = horizontalLengthDelta();
    const length = screen.getByRole("spinbutton", { name: /^Length$/ });

    fireEvent.change(length, { target: { value: "" } });

    expect(length).toHaveValue(null);
    expect(screen.getByText(/length must be greater than 0 cm/i)).toBeVisible();
    expect(horizontalLengthDelta()).toBe(initialDelta);

    fireEvent.change(length, { target: { value: "14" } });

    expect(horizontalLengthDelta()).toBeGreaterThan(initialDelta);
  });

  it("clears a successful share status when measurements change", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /copy share link/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/share link copied/i);

    fireEvent.change(screen.getByRole("spinbutton", { name: /^Length$/ }), {
      target: { value: "14" },
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hydrates URL measurements and roundtrips subsequent valid edits", () => {
    window.history.replaceState(
      null,
      "",
      "/?l=15&d=4&f=0.5&c=abcdef&u=imperial&p=custom",
    );
    render(<App />);

    expect(screen.getByRole("spinbutton", { name: /^Length$/ })).toHaveValue(
      5.91,
    );
    expect(horizontalLengthDelta()).toBeCloseTo(15 * (96 / 2.54), 6);

    fireEvent.change(screen.getByRole("spinbutton", { name: /^Length$/ }), {
      target: { value: "6" },
    });

    expect(new URLSearchParams(window.location.search).get("l")).toBe("15.24");
  });

  it("keeps imperial edits canonical without conversion drift", () => {
    render(<App />);
    const units = screen.getByRole("combobox", { name: "Units" });
    const length = screen.getByRole("spinbutton", { name: /^Length$/ });

    fireEvent.change(units, { target: { value: "imperial" } });
    fireEvent.change(length, { target: { value: "6" } });
    expect(new URLSearchParams(window.location.search).get("l")).toBe("15.24");

    fireEvent.change(units, { target: { value: "metric" } });
    expect(length).toHaveValue(15.24);
    fireEvent.change(units, { target: { value: "imperial" } });

    expect(length).toHaveValue(6);
    expect(new URLSearchParams(window.location.search).get("l")).toBe("15.24");
  });

  it("updates both diagram rulers when the unit mode changes", () => {
    render(<App />);
    const units = screen.getByRole("combobox", { name: "Units" });

    expect(screen.getAllByText("0 cm")).toHaveLength(2);

    fireEvent.change(units, { target: { value: "imperial" } });

    expect(screen.queryAllByText("0 cm")).toHaveLength(0);
    expect(screen.getAllByText("0 in")).toHaveLength(2);
    expect(screen.getAllByText("6 in")).toHaveLength(2);

    const [firstTick, secondTick] = screen.getAllByTestId("ruler-tick");
    expect(
      Number(secondTick.getAttribute("x1")) -
        Number(firstTick.getAttribute("x1")),
    ).toBeCloseTo(96);
  });

  it("exposes the overflow visual as a keyboard-focusable described region", () => {
    render(<App />);

    const region = screen.getByRole("region", {
      name: /scrollable measurement visual/i,
    });
    const descriptionId = region.getAttribute("aria-describedby");

    expect(region).toHaveAttribute("tabindex", "0");
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId!)).toHaveTextContent(
      /full screen this visual/i,
    );
  });

  it("opens a draggable full-screen fallback without changing visual scale", async () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    const user = userEvent.setup();
    render(<App />);
    const region = screen.getByRole("region", {
      name: /scrollable measurement visual/i,
    });
    const originalScale = screen
      .getAllByRole("img")[0]
      .getAttribute("data-px-per-cm");

    await user.click(
      screen.getByRole("button", { name: /full screen visual/i }),
    );

    expect(region).toHaveClass("is-fullscreen");
    expect(
      screen.getByRole("button", { name: /exit full screen/i }),
    ).toHaveAttribute("aria-pressed", "true");

    const surface = screen.getByTestId("visual-pan-surface");
    const viewport = surface.parentElement!;
    fireEvent.pointerDown(viewport, {
      button: 0,
      pointerId: 1,
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerMove(viewport, {
      pointerId: 1,
      clientX: 55,
      clientY: 65,
    });
    fireEvent.pointerUp(viewport, { pointerId: 1 });

    expect(surface).toHaveStyle({
      transform: "translate3d(45px, 45px, 0)",
    });
    expect(screen.getAllByRole("img")[0]).toHaveAttribute(
      "data-px-per-cm",
      originalScale,
    );

    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(surface).toHaveStyle({
      transform: "translate3d(55px, 45px, 0)",
    });
  });
});
