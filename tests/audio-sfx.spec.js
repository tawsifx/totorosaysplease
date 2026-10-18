// tests/audio-sfx.spec.js - Test Web Audio Synthesizer & Sound Effects
import { test, expect } from "@playwright/test";

test.describe("Web Audio Chiptune Synthesizer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("exposes all retro sound effect methods without runtime exceptions", async ({ page }) => {
    await page.waitForFunction(() => !!window.sfx || !!window.totoroSfx);

    const result = await page.evaluate(() => {
      const audio = window.sfx || window.totoroSfx;
      if (!audio) return { error: "No sfx object found" };

      const methods = [
        "jump",
        "land",
        "coin",
        "hit",
        "win",
        "munch",
        "powerup",
        "ghost",
        "stomp",
        "bump",
        "checkpoint"
      ];

      const executed = [];
      for (const m of methods) {
        if (typeof audio[m] !== "function") {
          return { error: `Method ${m} is missing` };
        }
        try {
          audio[m]();
          executed.push(m);
        } catch (err) {
          return { error: `Execution error in ${m}: ${err.message}` };
        }
      }
      return { success: true, count: executed.length };
    });

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(result.count).toBe(11);
  });
});
