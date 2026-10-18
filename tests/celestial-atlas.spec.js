// tests/celestial-atlas.spec.js - Automated tests for Level 12 Celestial Star Atlas
import { test, expect } from "@playwright/test";

test.describe("Level 12: Celestial Star Atlas Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Navigate directly to screen-telescope (Level 12)
    await page.evaluate(() => {
      window.goTo("screen-telescope");
    });
    await expect(page.locator("#screen-telescope")).toHaveClass(/active/);
  });

  test("renders all celestial elements including astrolabe gears, reticle, nebulas, meteors and constellation asterisms", async ({ page }) => {
    await expect(page.locator("#tele-viewport")).toBeVisible();
    await expect(page.locator("#tele-clear-svg")).toBeAttached();
    await expect(page.locator(".tele-lens")).toBeVisible();
    await expect(page.locator(".tele-lens-gear")).toBeAttached();
    await expect(page.locator(".tele-lens-target")).toBeAttached();
    await expect(page.locator(".tele-lens-brackets")).toBeAttached();
    await expect(page.locator("#tele-nebulas")).toBeAttached();
    await expect(page.locator(".tele-meteor").first()).toBeAttached();

    const pills = page.locator(".claude-const-pill");
    await expect(pills).toHaveCount(4);

    const constellations = page.locator(".constellation");
    await expect(constellations).toHaveCount(4);
  });

  test("clicking constellation tabs smoothly glides astrolabe lens and discovers each star", async ({ page }) => {
    const pills = page.locator(".claude-const-pill");

    // Click Constellation 1: Fuchka Minor
    await pills.nth(0).click();
    await expect(pills.nth(0)).toHaveClass(/discovered/);
    await expect(page.locator("#tele-title")).toContainText("Fuchka Minor");

    // Click Constellation 3: Umbrella Borealis (before Rickshaw to avoid crossing Moonwalker)
    await pills.nth(2).click();
    await expect(pills.nth(2)).toHaveClass(/discovered/);

    // Click Constellation 2: Rickshaw Major
    await pills.nth(1).click();
    await expect(pills.nth(1)).toHaveClass(/discovered/);
    await expect(page.locator("#tele-title")).toContainText("Rickshaw Major");

    // Click Constellation 4: Alpha Moon Walker (The Centerpiece)
    await pills.nth(3).click();
    await expect(pills.nth(3)).toHaveClass(/discovered/);
    await expect(page.locator("#tele-progress")).toHaveText("CATALOGUED: 4 / 4");
    await expect(page.locator("#tele-title")).toContainText("Alpha Moon Walker");
    await expect(page.locator("#tele-lock-card")).toBeVisible();
    await expect(page.locator(".tele-lens")).toHaveClass(/locked/);

    // All 4 discovered reveals the Royal Dhaka Observatory completion certificate
    await expect(page.locator("#tele-complete-banner")).toBeVisible();
    await expect(page.locator("#tele-complete-banner")).toContainText("CERTIFICATE OF COMPLETION");
  });

  test("toggling Clear All Smog switches viewport clipping and button text", async ({ page }) => {
    const smogBtn = page.locator("#btn-tele-sky-mode");
    await expect(smogBtn).toHaveText("Clear All Smog ✨");

    await smogBtn.click();
    await expect(smogBtn).toHaveText("Use Brass Lens 🔭");

    await smogBtn.click();
    await expect(smogBtn).toHaveText("Clear All Smog ✨");
  });
});
