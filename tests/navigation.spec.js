// tests/navigation.spec.js - Test page load, invitation, and level navigation
import { test, expect } from "@playwright/test";

test.describe("App Navigation & Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads the landing page with Level 1 invitation", async ({ page }) => {
    await expect(page).toHaveTitle(/A Date in Dhaka/i);
    const inviteScreen = page.locator("#screen-invite");
    await expect(inviteScreen).toHaveClass(/active/);
    await expect(page.locator("#lvl-name")).toHaveText("The Invitation");
    await expect(page.locator("#btn-invite-yes")).toBeVisible();
  });

  test("clicking Yes on invitation moves to Level 2 (Place selection)", async ({ page }) => {
    await page.click("#btn-invite-yes");
    const placeScreen = page.locator("#screen-place");
    await expect(placeScreen).toHaveClass(/active/);
    await expect(page.locator("#lvl-name")).toHaveText("Choose the Place");
  });

  test("header skip button advances through levels cleanly", async ({ page }) => {
    await expect(page.locator("#lvl-count")).toHaveText("Level 1 / 13");
    await page.click("#btn-next-level");
    await expect(page.locator("#lvl-count")).toHaveText("Level 2 / 13");

    // Wait for navLock (500ms) to release
    await page.waitForTimeout(600);
    await page.click("#btn-prev-level");
    await expect(page.locator("#lvl-count")).toHaveText("Level 1 / 13");
  });
});
