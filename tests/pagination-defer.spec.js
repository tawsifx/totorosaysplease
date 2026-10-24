// tests/pagination-defer.spec.js - Test list pagination and script deferral
import { test, expect } from "@playwright/test";

test.describe("Pagination & Script Deferral Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => typeof window.goTo === "function");
  });

  test("verifies non-critical scripts have defer attribute and no document.write", async ({ page }) => {
    // Check Tailwind CDN has defer
    const tailwindScript = page.locator('script[src*="cdn.tailwindcss.com"]');
    await expect(tailwindScript).toHaveAttribute("defer", "");

    // Check Phaser script has defer
    const phaserScript = page.locator('script[src*="phaser.min.js"]');
    await expect(phaserScript).toHaveAttribute("defer", "");

    // Verify Phaser in head uses prefetch instead of blocking preload
    const phaserPrefetch = page.locator('link[rel="prefetch"][href*="phaser.min.js"]');
    await expect(phaserPrefetch).toHaveCount(1);

    // Verify document.write is not used
    const html = await page.content();
    expect(html.includes("document.write")).toBe(false);
  });

  test("paginates 12 place options into 2 pages of 6 items each", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-place"));
    await expect(page.locator("#screen-place")).toHaveClass(/active/);

    // Page 1 assertions
    const cardsPage1 = page.locator("#grid-place .choice-card");
    await expect(cardsPage1).toHaveCount(6);
    await expect(page.locator("#ind-page-place")).toHaveText("Page 1 of 2");
    await expect(page.locator("#btn-prev-page-place")).toBeDisabled();
    await expect(page.locator("#btn-next-page-place")).toBeEnabled();

    const firstCardTitle = await cardsPage1.first().locator("h3").textContent();
    expect(firstCardTitle).toBe("TSC, Dhaka University");

    // Advance to Page 2
    await page.click("#btn-next-page-place");
    const cardsPage2 = page.locator("#grid-place .choice-card");
    await expect(cardsPage2).toHaveCount(6);
    await expect(page.locator("#ind-page-place")).toHaveText("Page 2 of 2");
    await expect(page.locator("#btn-prev-page-place")).toBeEnabled();
    await expect(page.locator("#btn-next-page-place")).toBeDisabled();

    const secondPageFirstTitle = await cardsPage2.first().locator("h3").textContent();
    expect(secondPageFirstTitle).toBe("Lalbagh Fort");

    // Click an option on Page 2
    await cardsPage2.first().click();
    await expect(page.locator("#screen-food")).toHaveClass(/active/);
  });

  test("paginates food and activity grids with navigation controls", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-food"));
    await expect(page.locator("#screen-food")).toHaveClass(/active/);

    const foodCardsPage1 = page.locator("#grid-food .choice-card");
    await expect(foodCardsPage1).toHaveCount(6);
    await expect(page.locator("#ind-page-food")).toHaveText("Page 1 of 2");

    await page.click("#btn-next-page-food");
    const foodCardsPage2 = page.locator("#grid-food .choice-card");
    await expect(foodCardsPage2).toHaveCount(6);
    await expect(page.locator("#ind-page-food")).toHaveText("Page 2 of 2");

    // Navigate to activity
    await page.evaluate(() => window.goTo("screen-activity"));
    await expect(page.locator("#screen-activity")).toHaveClass(/active/);

    const actCardsPage1 = page.locator("#grid-activity .choice-card");
    await expect(actCardsPage1).toHaveCount(6);
    await expect(page.locator("#ind-page-activity")).toHaveText("Page 1 of 2");

    await page.click("#btn-next-page-activity");
    const actCardsPage2 = page.locator("#grid-activity .choice-card");
    await expect(actCardsPage2).toHaveCount(6);
    await expect(page.locator("#ind-page-activity")).toHaveText("Page 2 of 2");
  });

  test("paginates music soundtrack queue between Curated 6 and Vault Archive 5", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-final"));
    await expect(page.locator("#screen-final")).toHaveClass(/active/);

    // Initial page: 6 curated items
    const queuePage1 = page.locator("#queue .queue-item");
    await expect(queuePage1).toHaveCount(6);
    await expect(page.locator("#queue-page-indicator")).toHaveText("Page 1 / 2");
    await expect(page.locator("#btn-queue-prev")).toBeDisabled();
    await expect(page.locator("#btn-queue-next")).toBeEnabled();

    // Flip to Page 2: Vault Archive
    await page.click("#btn-queue-next");
    const queuePage2 = page.locator("#queue .queue-item");
    await expect(queuePage2).toHaveCount(5);
    await expect(page.locator("#queue-page-indicator")).toHaveText("Page 2 / 2");
    await expect(page.locator("#btn-queue-prev")).toBeEnabled();
    await expect(page.locator("#btn-queue-next")).toBeDisabled();
    await expect(page.locator("#queue-header-title")).toContainText("Vault");

    // Return to Page 1
    await page.click("#btn-queue-prev");
    await expect(page.locator("#queue .queue-item")).toHaveCount(6);
    await expect(page.locator("#queue-page-indicator")).toHaveText("Page 1 / 2");
  });
});
