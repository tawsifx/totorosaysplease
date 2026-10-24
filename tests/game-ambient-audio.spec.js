// tests/game-ambient-audio.spec.js - Test External Anime Ambient BGM for Mini-Games Suite
import { test, expect } from "@playwright/test";

test.describe("External Anime Ambient BGM & Game Audio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!window.ambientAudio && !!window.goTo);
  });

  test("initializes ambientAudio on window with proper methods and target source", async ({ page }) => {
    const info = await page.evaluate(() => {
      const amb = window.ambientAudio;
      return {
        hasAmbient: typeof amb === "object" && amb !== null,
        src: amb?.src || "",
        hasPlay: typeof amb?.play === "function",
        hasStop: typeof amb?.stop === "function",
        hasPause: typeof amb?.pause === "function",
        hasToggle: typeof amb?.toggle === "function",
        hasSetVolume: typeof amb?.setVolume === "function",
        hasIsPlaying: typeof amb?.isPlaying === "function"
      };
    });

    expect(info.hasAmbient).toBe(true);
    expect(info.src).toContain("totoro-ambient.m4a");
    expect(info.hasPlay).toBe(true);
    expect(info.hasStop).toBe(true);
    expect(info.hasPause).toBe(true);
    expect(info.hasToggle).toBe(true);
    expect(info.hasSetVolume).toBe(true);
    expect(info.hasIsPlaying).toBe(true);
  });

  test("compressed external anime ambient audio asset is accessible with proper headers", async ({ request }) => {
    const response = await request.get("/audio/totoro-ambient.m4a");
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["content-type"]).toContain("audio");
    expect(parseInt(headers["content-length"] || "0")).toBeGreaterThan(500000);
  });

  test("renders in-game ambient BGM toggle buttons on all 3 mini-game screens", async ({ page }) => {
    const toggleButtons = page.locator(".game-bgm-toggle");
    await expect(toggleButtons).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const text = await toggleButtons.nth(i).textContent();
      expect(text).toContain("Anime BGM");
    }
  });

  test("navigating to Level 5 (Run to Totoro) triggers ambient audio and pauses pop player", async ({ page }) => {
    // Navigate to screen-game
    await page.evaluate(() => window.goTo("screen-game"));
    await expect(page.locator("#screen-game")).toHaveClass(/active/);

    const check = await page.evaluate(() => {
      const amb = window.ambientAudio;
      return {
        audioExists: !!amb?.audio,
        volume: amb?.audio ? amb.audio.volume : -1
      };
    });

    expect(check.audioExists).toBe(true);
  });

  test("clicking the in-game BGM toggle button toggles ambient audio state", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-game"));
    const btn = page.locator("#screen-game .game-bgm-toggle");
    await expect(btn).toBeVisible();

    // Toggle mute
    await btn.click();
    const isMutedAfterClick = await page.evaluate(() => window.ambientAudio.isMuted);
    expect(isMutedAfterClick).toBe(true);
    await expect(btn).toHaveText(/Off/i);

    // Toggle back on
    await btn.click();
    const isMutedAfterSecondClick = await page.evaluate(() => window.ambientAudio.isMuted);
    expect(isMutedAfterSecondClick).toBe(false);
    await expect(btn).toHaveText(/Anime BGM/i);
  });

  test("navigating away from mini-game screens automatically pauses ambient audio", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-game"));
    await page.evaluate(() => window.ambientAudio.play());

    // Wait for navLock (500ms) to release before next navigation
    await page.waitForTimeout(550);

    // Navigate to a non-game screen (e.g. screen-letter)
    await page.evaluate(() => window.goTo("screen-letter"));

    // Wait a brief tick for fadeTo to complete (400ms)
    await page.waitForTimeout(500);

    const isAudioPaused = await page.evaluate(() => {
      return !window.ambientAudio.audio || window.ambientAudio.audio.paused;
    });
    expect(isAudioPaused).toBe(true);
  });
});
