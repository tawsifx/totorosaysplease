// tests/music-player.spec.js - Test Soundtrack Audio Engine, AudioCache, and Music Player
import { test, expect } from "@playwright/test";

test.describe("Soundtrack Audio Engine & Music Player", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!window.player && !!window.AudioCache && !!window.goTo);
  });

  test("initializes player and AudioCache on window with 6 preferential tracks", async ({ page }) => {
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
    expect(check.trackCount).toBe(6);
  });

  test("reorders and filters playlist to top 6 tracks according to user choices", async ({ page }) => {
    // Update with choices that pair heavily with 'amar' ('Dhanmondi Lake' + 'Bhuna Khichuri & Beguni' + 'Twilight Lake Walk')
    await page.evaluate(() => {
      window.player.updateChoicePriority({
        place: "Dhanmondi Lake",
        food: "Bhuna Khichuri & Beguni",
        activity: "Twilight Lake Walk"
      });
    });

    const listAfter = await page.evaluate(() => window.player.getList());
    expect(listAfter.length).toBe(6);
    expect(listAfter[0]).toBe("amar");
  });

  test("dynamically switches preferential 6 songs when user selects different preferences", async ({ page }) => {
    // Preference Set A: Folk / Lake vibe
    await page.evaluate(() => {
      window.player.updateChoicePriority({
        place: "Dhanmondi Lake",
        food: "Bhuna Khichuri & Beguni",
        activity: "Twilight Lake Walk"
      });
    });
    const listA = await page.evaluate(() => window.player.getList());
    expect(listA.length).toBe(6);
    expect(listA).toContain("amar");

    // Preference Set B: Heritage / Romance vibe ('Lalbagh Fort' + 'Wood-Fired Pizza Night' + 'Postcards & Polaroids')
    await page.evaluate(() => {
      window.player.updateChoicePriority({
        place: "Lalbagh Fort",
        food: "Wood-Fired Pizza Night",
        activity: "Postcards & Polaroids"
      });
    });
    const listB = await page.evaluate(() => window.player.getList());
    expect(listB.length).toBe(6);
    // Should favor 'lovestory' and 'photograph'
    expect(listB).toContain("lovestory");
    expect(listB).toContain("photograph");
    // Lists should differ based on preferences
    expect(listA[0]).not.toBe(listB[0]);
  });

  test("navigates to screen-final and renders 6 playlist queue items with title and artist", async ({ page }) => {
    // Navigate directly to screen-final
    await page.evaluate(() => window.goTo("screen-final"));
    await expect(page.locator("#screen-final")).toHaveClass(/active/);

    const items = page.locator("#queue .queue-item");
    await expect(items).toHaveCount(6);

    const firstTitle = await items.first().locator(".q-title").textContent();
    expect(firstTitle?.trim().length).toBeGreaterThan(0);
  });

  test("next and previous track buttons cycle within the 6 preferential songs", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-final"));
    await expect(page.locator("#screen-final")).toHaveClass(/active/);

    const initialIdx = await page.evaluate(() => window.player.getCurrentIndex());

    // Click next track
    await page.click("#btn-next");
    const nextIdx = await page.evaluate(() => window.player.getCurrentIndex());
    expect(nextIdx).toBe((initialIdx + 1) % 6);

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

  test("modern audio api integrates AudioContext, GainNode, DynamicsCompressor, and AnalyserNode", async ({ page }) => {
    const audioEngineCheck = await page.evaluate(async () => {
      const p = window.player;
      if (!p) return { error: "Player missing" };

      const ctx = typeof p.getAudioContext === "function" ? p.getAudioContext() : null;
      const hasAudioContext = !!ctx && typeof ctx.state === "string";

      // Trigger user play to initialize Web Audio pipeline
      const btnPlay = document.getElementById("btn-play");
      if (btnPlay) btnPlay.click();

      // Give Web Audio pipeline a moment to initialize
      await new Promise(r => setTimeout(r, 60));

      const gainNode = typeof p.getGainNode === "function" ? p.getGainNode() : null;
      const compressorNode = typeof p.getCompressorNode === "function" ? p.getCompressorNode() : null;
      const analyserNode = typeof p.getAnalyserNode === "function" ? p.getAnalyserNode() : null;
      const isWebAudioActive = typeof p.isWebAudioActive === "function" ? p.isWebAudioActive() : false;

      return {
        hasAudioContext,
        hasGainNode: !!gainNode,
        hasCompressorNode: !!compressorNode,
        hasAnalyserNode: !!analyserNode,
        isWebAudioActive
      };
    });

    expect(audioEngineCheck.hasAudioContext).toBe(true);
    expect(audioEngineCheck.hasGainNode).toBe(true);
    expect(audioEngineCheck.hasCompressorNode).toBe(true);
    expect(audioEngineCheck.hasAnalyserNode).toBe(true);
    expect(audioEngineCheck.isWebAudioActive).toBe(true);
  });

  test("AudioCache resolves CDN paths dynamically when CDN base is configured", async ({ page }) => {
    const cdnTest = await page.evaluate(() => {
      const cache = window.AudioCache;
      if (!cache) return { error: "AudioCache missing" };

      // Default resolution without CDN
      const defaultUrl = cache.resolveUrl({ file: "audio/Amar-Mawte.m4a" });

      // Resolution with CDN
      window.CDN_BASE_URL = "https://cdn.adateindhaka.com";
      const cdnUrl = cache.resolveCdnUrl({ file: "audio/Amar-Mawte.m4a" });
      const cdnBase = cache.getCdnBaseUrl();

      // Reset
      delete window.CDN_BASE_URL;

      return {
        defaultUrl,
        cdnUrl,
        cdnBase
      };
    });

    expect(cdnTest.defaultUrl).toBe("/audio/Amar-Mawte.m4a");
    expect(cdnTest.cdnBase).toBe("https://cdn.adateindhaka.com");
    expect(cdnTest.cdnUrl).toBe("https://cdn.adateindhaka.com/audio/Amar-Mawte.m4a");
  });

  test("renders modern compressed postcard picture element with WebP source and fallback", async ({ page }) => {
    const postcardCheck = await page.evaluate(() => {
      const picture = document.querySelector(".postcard-visual picture");
      const webpSource = document.querySelector(".postcard-visual picture source[type='image/webp']");
      const img = document.querySelector(".postcard-visual img.postcard-img");

      return {
        hasPicture: !!picture,
        hasWebpSource: !!webpSource,
        webpSrcset: webpSource?.getAttribute("srcset"),
        hasImg: !!img,
        imgSrc: img?.getAttribute("src")
      };
    });

    expect(postcardCheck.hasPicture).toBe(true);
    expect(postcardCheck.hasWebpSource).toBe(true);
    expect(postcardCheck.webpSrcset).toContain("dhaka-postcard.webp");
    expect(postcardCheck.hasImg).toBe(true);
    expect(postcardCheck.imgSrc).toContain("dhaka-postcard.jpg");
  });
});
