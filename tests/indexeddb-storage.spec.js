// tests/indexeddb-storage.spec.js - Test IndexedDB Database Engine, Stores, and Indexes
import { test, expect } from "@playwright/test";

test.describe("IndexedDB Storage Engine & Database Indexing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => !!window.totoroDB && !!window.IndexedDatabase);
  });

  test("initializes TotoroDhakaDB with all 5 object stores and indexes", async ({ page }) => {
    const dbInfo = await page.evaluate(async () => {
      const db = await window.totoroDB.open();
      if (!db) return { error: "Database failed to open" };

      const storeNames = Array.from(db.objectStoreNames);
      const tx = db.transaction(storeNames, "readonly");

      const stores = {};
      storeNames.forEach(name => {
        const s = tx.objectStore(name);
        stores[name] = {
          keyPath: s.keyPath,
          autoIncrement: s.autoIncrement,
          indexes: Array.from(s.indexNames)
        };
      });

      return {
        name: db.name,
        version: db.version,
        storeNames,
        stores
      };
    });

    expect(dbInfo.name).toBe("TotoroDhakaDB");
    expect(dbInfo.storeNames).toContain("preferences");
    expect(dbInfo.storeNames).toContain("game_progress");
    expect(dbInfo.storeNames).toContain("postcard_drafts");
    expect(dbInfo.storeNames).toContain("epilogue_discoveries");
    expect(dbInfo.storeNames).toContain("audio_library");

    // Check indexes
    expect(dbInfo.stores.preferences.indexes).toContain("by_category");
    expect(dbInfo.stores.game_progress.indexes).toContain("by_score");
    expect(dbInfo.stores.postcard_drafts.indexes).toContain("by_date");
    expect(dbInfo.stores.epilogue_discoveries.indexes).toContain("by_type");
  });

  test("persists and retrieves user date preferences via IndexedDB", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const sample = {
        place: "Dhanmondi Lake",
        food: "Bhuna Khichuri & Beguni",
        activity: "Twilight Lake Walk"
      };

      await window.totoroDB.savePreferences(sample);
      const retrieved = await window.totoroDB.getPreferences();

      // Query by index
      const categoryItem = await window.totoroDB.getByIndex("preferences", "by_category", "place");

      return {
        retrieved,
        categoryItem
      };
    });

    expect(result.retrieved.place).toBe("Dhanmondi Lake");
    expect(result.retrieved.food).toBe("Bhuna Khichuri & Beguni");
    expect(result.categoryItem.value).toBe("Dhanmondi Lake");
  });

  test("stores arcade game progress and queries records by score index", async ({ page }) => {
    const result = await page.evaluate(async () => {
      await window.totoroDB.saveGameProgress("runner", 1500, true, { stage: 3 });
      await window.totoroDB.saveGameProgress("pac", 2400, true, { stage: 2 });

      const runner = await window.totoroDB.getGameProgress("runner");
      const highScores = await window.totoroDB.getAllByIndex("game_progress", "by_score", 1500);

      return {
        runner,
        highScoresCount: highScores.length
      };
    });

    expect(result.runner.score).toBe(1500);
    expect(result.runner.completed).toBe(true);
    expect(result.highScoresCount).toBeGreaterThanOrEqual(1);
  });

  test("archives postcard letters sent from Dhaka University postbox", async ({ page }) => {
    const count = await page.evaluate(async () => {
      await window.totoroDB.savePostcard("Waiting for you under the Krishnachura tree at Curzon Hall.", {
        place: "TSC, Dhaka University",
        food: "Malai Cha & Singara",
        activity: "Live Acoustic Adda"
      });

      const cards = await window.totoroDB.getPostcards();
      return cards.length;
    });

    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("catalogs celestial star discoveries indexed by discovery type", async ({ page }) => {
    const stars = await page.evaluate(async () => {
      await window.totoroDB.recordStarDiscovery("moonwalker", "Moon Walker Star", "Ursa Major");
      await window.totoroDB.recordStarDiscovery("kadam_nebula", "Kadam Blossom Cluster", "Orion");

      return window.totoroDB.getDiscoveredStars();
    });

    expect(stars.length).toBeGreaterThanOrEqual(2);
    expect(stars.some(s => s.starId === "moonwalker")).toBe(true);
  });

  test("UI choice selection automatically synchronizes with IndexedDB", async ({ page }) => {
    // Navigate to Place screen (Level 2)
    await page.evaluate(() => window.goTo("screen-place"));
    await expect(page.locator("#screen-place")).toHaveClass(/active/);

    // Click the first choice card
    const firstCard = page.locator("#grid-place .choice-card").first();
    const cardTitle = (await firstCard.locator("h3").textContent())?.trim();
    await firstCard.click();

    // Verify IndexedDB saved this selection
    await page.waitForTimeout(100);
    const saved = await page.evaluate(async () => {
      return window.totoroDB.getPreferences();
    });

    expect(saved).not.toBeNull();
    expect(saved.place).toBe(cardTitle);
  });
});
