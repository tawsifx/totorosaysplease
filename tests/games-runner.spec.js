// tests/games-runner.spec.js - Test Level 5: "Run to Totoro"
import { test, expect } from "@playwright/test";

test.describe("Game 1: Run to Totoro", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => typeof window.goTo === "function");
    await page.evaluate(() => window.goTo("screen-game"));
    await page.waitForSelector("#screen-game.active", { timeout: 5000 });
  });

  test("initializes Runner canvas and runs Phaser scene", async ({ page }) => {
    const screen = page.locator("#screen-game");
    await expect(screen).toHaveClass(/active/);
    await expect(page.locator("#lvl-name")).toHaveText("Run to Totoro");

    const canvas = page.locator("#game-canvas");
    await expect(canvas).toBeVisible();

    // Verify Phaser game instance is mounted
    await page.waitForFunction(() => !!window.Game);
    const hasGame = await page.evaluate(() => typeof window.Game.start === "function");
    expect(hasGame).toBe(true);
  });

  test("handles jump input and updates progress", async ({ page }) => {
    const canvas = page.locator("#game-canvas");
    await canvas.click();

    // Trigger jump
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);

    // Verify game state is running
    await page.waitForFunction(() => {
      const g = window.Game.getInstance ? window.Game.getInstance() : null;
      if (!g) return false;
      const s = g.scene.getScene("RunnerScene");
      return s && s.state === "running";
    }, { timeout: 5000 });

    // Wait 1.5 seconds for distance progress
    await page.waitForTimeout(1500);
    const dist = await page.evaluate(() => {
      const g = window.Game.getInstance ? window.Game.getInstance() : null;
      const s = g ? g.scene.getScene("RunnerScene") : null;
      return s ? s.dist : 0;
    });
    expect(dist).toBeGreaterThan(50);

    // Verify in-game Three.js 3D FX layer is active on RunnerScene without a diorama
    await expect(page.locator(".stage-3d-toggle-btn")).toHaveCount(0);
    const runner3DState = await page.evaluate(() => {
      const g = window.Game.getInstance();
      const s = g.scene.getScene("RunnerScene");
      if (!s || !s.fx3d) return null;
      s.fx3d.onJump(s.astro.x, 248);
      return {
        hasScene: !!s.fx3d.scene,
        clouds3D: s.fx3d.clouds3D.length,
        petals3D: s.fx3d.petals.length,
        shockwaves: s.fx3d.shockwaves.length
      };
    });
    expect(runner3DState).not.toBeNull();
    expect(runner3DState.hasScene).toBe(true);
    expect(runner3DState.clouds3D).toBe(4);
    expect(runner3DState.petals3D).toBeGreaterThan(0);
    expect(runner3DState.shockwaves).toBeGreaterThan(0);
  });
});
