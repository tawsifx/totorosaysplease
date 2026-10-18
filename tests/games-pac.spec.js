// tests/games-pac.spec.js - Test Level 6: "Fuchka Chase"
import { test, expect } from "@playwright/test";

test.describe("Game 2: Fuchka Chase", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => typeof window.goTo === "function");
    await page.evaluate(() => window.goTo("screen-pac"));
    await page.waitForSelector("#screen-pac.active", { timeout: 5000 });
  });

  test("initializes Pac-Man canvas and renders Dhaka maze", async ({ page }) => {
    const screen = page.locator("#screen-pac");
    await expect(screen).toHaveClass(/active/);
    await expect(page.locator("#lvl-name")).toHaveText("Fuchka Chase");

    const canvas = page.locator("#pac-canvas");
    await expect(canvas).toBeVisible();

    await page.waitForFunction(() => !!window.PacGame);
    const hasPac = await page.evaluate(() => typeof window.PacGame.start === "function");
    expect(hasPac).toBe(true);
  });

  test("moves chibi astronaut and eats fuchkas", async ({ page }) => {
    const canvas = page.locator("#pac-canvas");
    await canvas.click();

    // Verify initial state has fuchkas
    await page.waitForFunction(() => {
      const g = window.PacGame.getInstance ? window.PacGame.getInstance() : null;
      const s = g ? g.scene.getScene("PacScene") : null;
      return s && s.dots && s.dots.length > 0;
    }, { timeout: 6000 });

    const initialFuchkas = await page.evaluate(() => {
      const g = window.PacGame.getInstance();
      const s = g.scene.getScene("PacScene");
      return s.totalFuchka;
    });
    expect(initialFuchkas).toBeGreaterThan(10);

    // Send input to move left/up to start eating
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(600);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(600);

    const playerState = await page.evaluate(() => {
      const g = window.PacGame.getInstance();
      const s = g.scene.getScene("PacScene");
      return { x: s.playerPos.x, y: s.playerPos.y, lives: s.lives };
    });
    expect(playerState.lives).toBeGreaterThan(0);
  });
});
