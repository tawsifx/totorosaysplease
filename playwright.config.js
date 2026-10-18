// playwright.config.js - Playwright Test Configuration with Vite
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
    channel: "chrome",
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
    trace: "on-first-retry"
  },
  webServer: {
    command: "npx vite --port 4173",
    port: 4173,
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "pipe"
  }
});
