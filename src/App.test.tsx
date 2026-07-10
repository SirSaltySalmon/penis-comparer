import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});
