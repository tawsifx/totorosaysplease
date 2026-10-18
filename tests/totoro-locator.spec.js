// tests/totoro-locator.spec.js - Automated tests for Level 11 Totoro Locator animation
import { test, expect } from "@playwright/test";

test.describe("Level 11: Totoro Locator Animation Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Navigate directly to screen-map (Level 11)
    await page.evaluate(() => {
      window.goTo("screen-map");
    });
    await expect(page.locator("#screen-map")).toHaveClass(/active/);
  });

  test("renders all locator UI elements including Totoro pin SVG, globe, radar and celebration containers", async ({ page }) => {
    await expect(page.locator(".totoro-pin-svg")).toBeVisible();
    await expect(page.locator(".pin-totoro-face")).toBeVisible();
    await expect(page.locator(".totoro-ear-l")).toBeVisible();
    await expect(page.locator(".totoro-ear-r")).toBeVisible();
    await expect(page.locator("#globe")).toBeAttached();
    await expect(page.locator("#globe .globe-ring")).toBeAttached();
    await expect(page.locator("#radar-sweep")).toBeAttached();
    await expect(page.locator("#map-celebration")).toBeAttached();
    await expect(page.locator(".sheet-totoro-avatar")).toHaveText("🐾");

    const spots = page.locator(".spot");
    await expect(spots).toHaveCount(6);
  });

  test("clicking a spot triggers search, radar sweep, bouncy pin drop, celebration, and sheet reveal", async ({ page }) => {
    const firstSpot = page.locator(".spot").first();
    await firstSpot.click({ force: true });

    await expect(firstSpot).toHaveClass(/picked/);
    await expect(page.locator("#map-status")).toContainText("Searching");

    // After ~1.6s, holographic globe and radar sweep should be active
    await expect(page.locator("#radar-sweep")).toHaveClass(/active/, { timeout: 3500 });
    await expect(page.locator("#globe")).toHaveClass(/show/, { timeout: 3500 });

    // After the sequence finishes (~5.5s), map pin drops with bouncy physics, sheet shows, pulse turns on
    await expect(page.locator("#map-pin")).toHaveClass(/drop/, { timeout: 7000 });
    await expect(page.locator("#map-pulse")).toHaveClass(/on/, { timeout: 7000 });
    await expect(page.locator("#map-sheet")).toHaveClass(/show/, { timeout: 7000 });
    await expect(page.locator("#map-status")).toContainText("Right in your heart");
  });

  test("replay button resets the animation cleanly", async ({ page }) => {
    const firstSpot = page.locator(".spot").first();
    await firstSpot.click({ force: true });

    // Wait until pin drops
    await expect(page.locator("#map-pin")).toHaveClass(/drop/, { timeout: 7000 });

    // Click replay
    await page.click("#btn-map-replay");

    // All active classes should be cleanly wiped
    await expect(page.locator("#map-pin")).not.toHaveClass(/drop/);
    await expect(page.locator("#map-pulse")).not.toHaveClass(/on/);
    await expect(page.locator("#map-sheet")).not.toHaveClass(/show/);
    await expect(page.locator("#radar-sweep")).not.toHaveClass(/active/);
    await expect(page.locator("#map-status")).toHaveText("Where is he? Tap a spot to search 👆");
  });
});
