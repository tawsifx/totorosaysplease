// tests/games-mario.spec.js - Test Level 7: "Run to the Bus Stop"
import { test, expect } from "@playwright/test";

test.describe("Game 3: Run to the Bus Stop", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => typeof window.goTo === "function");
    await page.evaluate(() => window.goTo("screen-mario"));
    await page.waitForSelector("#screen-mario.active", { timeout: 5000 });
  });

  test("initializes platformer canvas and HUD", async ({ page }) => {
    const screen = page.locator("#screen-mario");
    await expect(screen).toHaveClass(/active/);
    await expect(page.locator("#lvl-name")).toHaveText("Run to the Bus Stop");

    const canvas = page.locator("#mario-canvas");
    await expect(canvas).toBeVisible();

    await page.waitForFunction(() => !!window.MarioGame);
    const hasMario = await page.evaluate(() => typeof window.MarioGame.start === "function");
    expect(hasMario).toBe(true);
  });

  test("runs, jumps, and responds to touch pad controls", async ({ page }) => {
    const canvas = page.locator("#mario-canvas");
    await canvas.click();

    // Verify initial lives and position
    await page.waitForFunction(() => {
      const g = window.MarioGame.getInstance ? window.MarioGame.getInstance() : null;
      const s = g ? g.scene.getScene("MarioScene") : null;
      return s && s.p && s.lives === 3;
    }, { timeout: 6000 });

    const initialX = await page.evaluate(() => {
      const g = window.MarioGame.getInstance();
      const s = g.scene.getScene("MarioScene");
      return s.p.x;
    });

    // Press right using keyboard
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(400);
    await page.keyboard.up("ArrowRight");

    // Press jump using on-screen touch pad
    const jumpBtn = page.locator('.pad-btn[data-k="jump"]');
    await jumpBtn.dispatchEvent("pointerdown");
    await page.waitForTimeout(200);
    await jumpBtn.dispatchEvent("pointerup");

    await page.waitForTimeout(300);

    const afterX = await page.evaluate(() => {
      const g = window.MarioGame.getInstance();
      const s = g.scene.getScene("MarioScene");
      return s.p.x;
    });

    expect(afterX).toBeGreaterThan(initialX);
  });

  test("renders enhanced enemy sprites and keeps flying birds facing their flight direction", async ({ page }) => {
    await page.waitForFunction(() => {
      const g = window.MarioGame.getInstance ? window.MarioGame.getInstance() : null;
      const s = g ? g.scene.getScene("MarioScene") : null;
      return s && s.enemies && s.enemies.length > 0;
    }, { timeout: 6000 });

    const orientationCheck = await page.evaluate(() => {
      const g = window.MarioGame.getInstance();
      const s = g.scene.getScene("MarioScene");

      // Check initial enemy orientations (vx < 0 => flipX === true)
      const initialValid = s.enemies.every(e => e.sprite.flipX === (e.vx < 0));
      const flyers = s.enemies.filter(e => e.isFlyer);

      // Force a flyer past minX and maxX to verify turn-around orientation never flies backwards
      if (flyers.length > 0) {
        const bird = flyers[0];
        bird.sprite.x = bird.minX - 5;
        s.updateEnemies(1000, 0.016);
        const rightTurnValid = bird.vx > 0 && bird.sprite.flipX === false;

        bird.sprite.x = bird.maxX + 5;
        s.updateEnemies(1016, 0.016);
        const leftTurnValid = bird.vx < 0 && bird.sprite.flipX === true;

        return {
          initialValid,
          rightTurnValid,
          leftTurnValid,
          crowWidth: s.textures.get("crow").getSourceImage().width,
          rickWidth: s.textures.get("rick").getSourceImage().width,
          cngWidth: s.textures.get("cng").getSourceImage().width
        };
      }
      return { initialValid, rightTurnValid: false, leftTurnValid: false };
    });

    expect(orientationCheck.initialValid).toBe(true);
    expect(orientationCheck.rightTurnValid).toBe(true);
    expect(orientationCheck.leftTurnValid).toBe(true);
    expect(orientationCheck.crowWidth).toBe(72);
    expect(orientationCheck.rickWidth).toBe(88);
    expect(orientationCheck.cngWidth).toBe(88);
  });
});
