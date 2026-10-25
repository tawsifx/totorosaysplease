// tests/modular-architecture.spec.js - Verify Modular File System Architecture
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Modular File System Architecture", () => {
  const expectedModules = [
    "js/audio/sfx.js",
    "js/audio/ambient.js",
    "js/storage/db.js",
    "js/sprites/primitives.js",
    "js/sprites/textures.js",
    "js/data/runner-config.js",
    "js/data/pac-config.js",
    "js/data/mario-config.js",
    "js/scenes/SceneBase.js",
    "js/scenes/RunnerScene.js",
    "js/scenes/PacScene.js",
    "js/scenes/MarioScene.js",
    "js/games/runner.js",
    "js/games/pac.js",
    "js/games/mario.js",
    "js/3d/game3d.js",
    "js/main.js"
  ];

  test("all modular architecture files exist on disk", () => {
    for (const relPath of expectedModules) {
      const fullPath = path.resolve(relPath);
      expect(fs.existsSync(fullPath), `Module ${relPath} should exist`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `Module ${relPath} should not be empty`).toBeGreaterThan(100);
    }
  });

  test("main entry point exports all components and games", async () => {
    const mainContent = fs.readFileSync(path.resolve("js/main.js"), "utf-8");
    expect(mainContent).toContain("RunnerGame");
    expect(mainContent).toContain("PacGame");
    expect(mainContent).toContain("MarioGame");
    expect(mainContent).toContain("sfx");
    expect(mainContent).toContain("buildMasterSprites");
    expect(mainContent).toContain("Mario3DFX");
    expect(mainContent).toContain("Runner3DFX");
  });
});
