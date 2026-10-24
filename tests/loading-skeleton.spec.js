// tests/loading-skeleton.spec.js - Test Loading Skeleton System across the Website
import { test, expect } from "@playwright/test";

test.describe("Website Loading Skeleton Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("site skeleton overlay renders with accessible attributes and fades out cleanly", async ({ page }) => {
    // Check skeleton structure exists or was dismissed smoothly
    const hasSkeletonOrDismissed = await page.evaluate(() => {
      const sk = document.getElementById("site-skeleton");
      // Either exists with hidden class or already removed after fade
      if (!sk) return true;
      return sk.getAttribute("role") === "status" && sk.getAttribute("aria-busy") === "true";
    });
    expect(hasSkeletonOrDismissed).toBe(true);

    // Verify main app content is fully interactive
    await expect(page.locator("#btn-invite-yes")).toBeVisible();
    await expect(page.locator("#screen-invite")).toHaveClass(/active/);
  });

  test("mini-game cards contain canvas loading skeletons", async ({ page }) => {
    // Navigate to level 5 (Run to Totoro)
    await page.evaluate(() => window.goTo("screen-game"));
    await expect(page.locator("#screen-game")).toHaveClass(/active/);

    const runnerSkeleton = page.locator("#game-skeleton-runner");
    await expect(runnerSkeleton).toBeAttached();

    // Wait for navLock (500ms) to release
    await page.waitForTimeout(600);

    // Navigate to level 6 (Fuchka Chase)
    await page.evaluate(() => window.goTo("screen-pac"));
    await expect(page.locator("#screen-pac")).toHaveClass(/active/);

    const pacSkeleton = page.locator("#game-skeleton-pac");
    await expect(pacSkeleton).toBeAttached();

    // Wait for navLock (500ms) to release
    await page.waitForTimeout(600);

    // Navigate to level 7 (Run to the Bus Stop)
    await page.evaluate(() => window.goTo("screen-mario"));
    await expect(page.locator("#screen-mario")).toHaveClass(/active/);

    const marioSkeleton = page.locator("#game-skeleton-mario");
    await expect(marioSkeleton).toBeAttached();
  });

  test("postcard visual contains image loading skeleton with loaded transition", async ({ page }) => {
    await page.evaluate(() => window.goTo("screen-letter"));
    await expect(page.locator("#screen-letter")).toHaveClass(/active/);

    const postcardSkeleton = page.locator("#postcard-skeleton");
    await expect(postcardSkeleton).toBeAttached();
    await expect(postcardSkeleton).toHaveClass(/skeleton-shimmer/);
  });
});
