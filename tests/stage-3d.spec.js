// tests/stage-3d.spec.js - Test Three.js 3D Dhaka Diorama & Voxel World Integration
import { test, expect } from "@playwright/test";

test.describe("Three.js 3D Diorama & Voxel Engine", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app to settle
    await page.waitForFunction(() => window.totoroGamesReady === true);
  });

  test("window.Stage3D is exported and available globally", async ({ page }) => {
    const hasStage3D = await page.evaluate(() => typeof window.Stage3D === "function");
    expect(hasStage3D).toBe(true);
  });

  test("toggle 3D Dhaka Diorama on Level 7 (Run to the Bus Stop)", async ({ page }) => {
    // Navigate directly to Level 7
    await page.evaluate(() => window.goTo("screen-mario"));
    await expect(page.locator("#screen-mario")).toHaveClass(/active/);

    const toggleBtn = page.locator('.stage-3d-toggle-btn[data-target="mario"]');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveText(/3D Dhaka Diorama/i);

    const wrap = page.locator("#stage-3d-wrap-mario");
    await expect(wrap).toHaveClass(/hidden/);

    // Click to toggle 3D mode
    await toggleBtn.click();
    await expect(wrap).not.toHaveClass(/hidden/);
    await expect(toggleBtn).toHaveText(/2D Retro View/i);

    // Verify Three.js WebGL canvas is mounted inside #stage-3d-viewport-mario
    const threeCanvas = page.locator("#stage-3d-viewport-mario canvas.three-canvas");
    await expect(threeCanvas).toBeVisible();

    // Verify window.activeStage3D is set and has functional methods
    const stageStatus = await page.evaluate(() => {
      const s = window.activeStage3D;
      if (!s) return null;
      return {
        hasScene: !!s.scene,
        hasCamera: !!s.camera,
        hasRenderer: !!s.renderer,
        hasTotoro: !!s.totoroGroup,
        hasRickshaw: !!s.rickshawGroup,
        hasCNG: !!s.cngGroup,
        hasBusStop: !!s.busStopGroup,
        coinsCount: s.coins ? s.coins.length : 0,
        petalsCount: s.petalData ? s.petalData.length : 0
      };
    });

    expect(stageStatus).not.toBeNull();
    expect(stageStatus.hasScene).toBe(true);
    expect(stageStatus.hasCamera).toBe(true);
    expect(stageStatus.hasRenderer).toBe(true);
    expect(stageStatus.hasTotoro).toBe(true);
    expect(stageStatus.hasRickshaw).toBe(true);
    expect(stageStatus.hasCNG).toBe(true);
    expect(stageStatus.hasBusStop).toBe(true);
    expect(stageStatus.coinsCount).toBeGreaterThan(0);
    expect(stageStatus.petalsCount).toBeGreaterThan(0);

    // Test interactive toolbar buttons
    const jumpBtn = page.locator('.stage-3d-btn[data-target="mario"][data-action="jump"]');
    await expect(jumpBtn).toBeVisible();
    await jumpBtn.click();

    const glowBtn = page.locator('.stage-3d-btn[data-target="mario"][data-action="glow"]');
    await expect(glowBtn).toBeVisible();
    await glowBtn.click();

    const cheerBtn = page.locator('.stage-3d-btn[data-target="mario"][data-action="cheer"]');
    await expect(cheerBtn).toBeVisible();
    await cheerBtn.click();

    // Verify stage switching (Hatirjheel & Old Dhaka)
    const hatirjheelBtn = page.locator('.stage-3d-btn[data-target="mario"][data-stage="1"]');
    await hatirjheelBtn.click();
    const stageIdx = await page.evaluate(() => window.activeStage3D.options.stage);
    expect(stageIdx).toBe(1);

    const oldDhakaBtn = page.locator('.stage-3d-btn[data-target="mario"][data-stage="2"]');
    await oldDhakaBtn.click();
    const stageIdx2 = await page.evaluate(() => window.activeStage3D.options.stage);
    expect(stageIdx2).toBe(2);

    // Toggle back to 2D view
    await toggleBtn.click();
    await expect(wrap).toHaveClass(/hidden/);
    await expect(toggleBtn).toHaveText(/3D Dhaka Diorama/i);
    await expect(page.locator("#mario-canvas")).toBeVisible();
  });

  test("toggle 3D Dhaka Diorama on Level 5 (Run to Totoro)", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-game"));
    await expect(page.locator("#screen-game")).toHaveClass(/active/);

    const toggleBtn = page.locator('.stage-3d-toggle-btn[data-target="runner"]');
    await expect(toggleBtn).toBeVisible();

    await toggleBtn.click();
    const wrap = page.locator("#stage-3d-wrap-runner");
    await expect(wrap).not.toHaveClass(/hidden/);

    const threeCanvas = page.locator("#stage-3d-viewport-runner canvas.three-canvas");
    await expect(threeCanvas).toBeVisible();

    // Verify Jump and Celebrate event reactivity
    await page.evaluate(() => {
      window.activeStage3D.onJump();
      window.activeStage3D.onScore();
      window.activeStage3D.onWin();
    });

    const isCelebrating = await page.evaluate(() => window.activeStage3D.celebrateTimer > 0);
    expect(isCelebrating).toBe(true);

    // Toggle back
    await toggleBtn.click();
    await expect(wrap).toHaveClass(/hidden/);
  });
});
