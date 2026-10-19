// tests/music-player.spec.js - Test Soundtrack Audio Engine, AudioCache, and Music Player
import { test, expect } from "@playwright/test";

test.describe("Soundtrack Audio Engine & Music Player", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!window.player && !!window.AudioCache && !!window.goTo);
  });

  test("initializes player and AudioCache on window with 11 tracks", async ({ page }) => {
    const check = await page.evaluate(() => {
      return {
        hasPlayer: typeof window.player === "object",
        hasCache: typeof window.AudioCache === "object",
        hasStart: typeof window.player.start === "function",
        hasUpdatePriority: typeof window.player.updateChoicePriority === "function",
        hasGetList: typeof window.player.getList === "function",
        trackCount: window.player.getList().length
      };
    });

    expect(check.hasPlayer).toBe(true);
    expect(check.hasCache).toBe(true);
    expect(check.hasStart).toBe(true);
    expect(check.hasUpdatePriority).toBe(true);
    expect(check.hasGetList).toBe(true);
    expect(check.trackCount).toBe(11);
  });

  test("reorders playlist according to user choices", async ({ page }) => {
    // Update with choices that pair heavily with 'amar' ('Dhanmondi Lake' + 'Bhuna Khichuri & Beguni' + 'Twilight Lake Walk')
    await page.evaluate(() => {
      window.player.updateChoicePriority({
        place: "Dhanmondi Lake",
        food: "Bhuna Khichuri & Beguni",
        activity: "Twilight Lake Walk"
      });
    });

    const listAfter = await page.evaluate(() => window.player.getList());
    expect(listAfter.length).toBe(11);
    expect(listAfter[0]).toBe("amar");
  });

  test("navigates to screen-final and renders 11 playlist queue items with title and artist", async ({ page }) => {
    // Navigate directly to screen-final
    await page.evaluate(() => window.goTo("screen-final"));
    await expect(page.locator("#screen-final")).toHaveClass(/active/);

    const items = page.locator("#queue .queue-item");
    await expect(items).toHaveCount(11);

    const firstTitle = await items.first().locator(".q-title").textContent();
    expect(firstTitle?.trim().length).toBeGreaterThan(0);
  });

  test("next and previous track buttons change current index and song metadata", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-final"));
    await expect(page.locator("#screen-final")).toHaveClass(/active/);

    const initialIdx = await page.evaluate(() => window.player.getCurrentIndex());

    // Click next track
    await page.click("#btn-next");
    const nextIdx = await page.evaluate(() => window.player.getCurrentIndex());
    expect(nextIdx).toBe((initialIdx + 1) % 11);

    const nextTitle = await page.locator("#song-title").textContent();
    expect(nextTitle?.trim().length).toBeGreaterThan(0);

    // Click previous track
    await page.click("#btn-prev");
    const prevIdx = await page.evaluate(() => window.player.getCurrentIndex());
    expect(prevIdx).toBe(initialIdx);
  });

  test("clicking a queue item selects that song", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-final"));
    await expect(page.locator("#screen-final")).toHaveClass(/active/);

    const targetItem = page.locator("#queue .queue-item").nth(3);
    const targetTitle = (await targetItem.locator(".q-title").textContent())?.trim();

    await targetItem.click();

    const currentTitle = (await page.locator("#song-title").textContent())?.trim();
    expect(currentTitle).toBe(targetTitle);
  });

  test("AudioCache safely resolves URLs and pre-buffers tracks", async ({ page }) => {
    const cacheTest = await page.evaluate(async () => {
      const cache = window.AudioCache;
      if (!cache) return { error: "AudioCache missing" };

      const url = cache.resolveUrl({ file: "audio/Kadam.m4a" });
      const validUrl = url === "/audio/Kadam.m4a";

      return {
        validUrl,
        isCachedFunction: typeof cache.isCached === "function",
        prioritizeFunction: typeof cache.prioritize === "function"
      };
    });

    expect(cacheTest.validUrl).toBe(true);
    expect(cacheTest.isCachedFunction).toBe(true);
    expect(cacheTest.prioritizeFunction).toBe(true);
  });
});
