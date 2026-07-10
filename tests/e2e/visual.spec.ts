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
  const guide = page.locator("#measurement-guide-body");
  await expect(
    guide.getByText(/pubic bone to the furthest tip/i),
  ).toBeVisible();
  await expect(guide.getByText(/not medical advice/i)).toBeVisible();
});

test("rendered SVG keeps a one-to-one CSS pixel to viewBox ratio", async ({
  page,
}) => {
  await page.goto("/");
  const svg = page.locator("svg:visible").first();

  const scale = await svg.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const viewBox = element.viewBox.baseVal;
    return {
      x: box.width / viewBox.width,
      y: box.height / viewBox.height,
      intrinsicWidth: element.getAttribute("width"),
      intrinsicHeight: element.getAttribute("height"),
    };
  });

  expect(scale.x).toBeCloseTo(1, 6);
  expect(scale.y).toBeCloseTo(1, 6);
  expect(Number(scale.intrinsicWidth)).toBeGreaterThan(0);
  expect(Number(scale.intrinsicHeight)).toBeGreaterThan(0);
});

test("calibrated ruler and measurement geometry use the same CSS scale", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("slider", { name: /on-screen pixels/i }).fill("280");
  await page.getByRole("button", { name: /apply calibration/i }).click();
  const svg = page.locator("svg:visible").first();
  await expect(svg.getByText("calibrated scale")).toBeVisible();

  const geometry = await svg.evaluate((element) => {
    const lengthLine = element
      .querySelector('[data-testid="length-marker"] line')!;
    const ticks = element.querySelectorAll('[data-testid="ruler-tick"]');
    const horizontal = element.classList.contains("anatomy-svg--horizontal");
    const lengthDelta = horizontal
      ? Number(lengthLine.getAttribute("x2")) - Number(lengthLine.getAttribute("x1"))
      : Number(lengthLine.getAttribute("y1")) - Number(lengthLine.getAttribute("y2"));
    const tickDelta = horizontal
      ? Number(ticks[1].getAttribute("x1")) - Number(ticks[0].getAttribute("x1"))
      : Number(ticks[0].getAttribute("y1")) - Number(ticks[1].getAttribute("y1"));
    return { lengthDelta, tickDelta };
  });

  expect(geometry.lengthDelta / 13.12).toBeCloseTo(geometry.tickDelta, 6);
  expect(geometry.tickDelta).toBeCloseTo(280 / 8.56, 6);
});

test("default mobile visual fits without horizontal panning", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  const region = page.getByRole("region", {
    name: /scrollable measurement visual/i,
  });

  await expect(region).toBeVisible();
  expect(
    await region.evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
});

test("oversized mobile visual remains keyboard-scrollable", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");
  await page.goto("/");
  await page.getByRole("spinbutton", { name: "Diameter", exact: true }).fill("20");
  const region = page.getByRole("region", {
    name: /scrollable measurement visual/i,
  });

  await expect
    .poll(() =>
      region.evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(true);
  await region.focus();
  await expect(region).toBeFocused();
  await page.keyboard.press("ArrowRight");

  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
});
