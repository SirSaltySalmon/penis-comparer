import { expect, test } from "@playwright/test";

test("shows visual and shareable url state", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Measurement Visualizer" }),
  ).toBeVisible();

  const visibleVisual = page.locator("svg:visible").first();
  await expect(visibleVisual).toHaveAccessibleName(
    /abstract measurement visual/i,
  );
  await expect(visibleVisual).toBeVisible();
  await expect(visibleVisual.getByText("length to tip").first()).toBeVisible();

  await page.getByRole("spinbutton", { name: "Length", exact: true }).fill("14");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("l"))
    .toBe("14");
});

test("desktop uses horizontal projection", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only assertion");

  await page.goto("/");

  await expect(page.locator(".anatomy-svg--horizontal")).toBeVisible();
});

test("mobile uses vertical projection", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");

  await page.goto("/");

  await expect(page.locator(".anatomy-svg--horizontal")).toBeHidden();
  const mobileProjection = page.getByTestId("mobile-projection");
  await expect(mobileProjection).toBeVisible();
  await expect(
    mobileProjection.getByText("length to tip").first(),
  ).toBeVisible();
});

test("guide explains pubic-bone-to-tip measurement", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "How to measure" }).click();
  await expect(
    page.getByText(/pubic bone to the furthest tip/i),
  ).toBeVisible();
  await expect(page.getByText(/not medical advice/i)).toBeVisible();
});
