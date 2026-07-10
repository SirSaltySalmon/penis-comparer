import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GuideDrawer } from "./GuideDrawer";

describe("GuideDrawer", () => {
  it("reveals measurement guidance", async () => {
    const user = userEvent.setup();
    render(<GuideDrawer />);

    await user.click(screen.getByRole("button", { name: /how to measure/i }));

    expect(screen.getByText(/pubic bone to the furthest tip/i)).toBeInTheDocument();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });
});
