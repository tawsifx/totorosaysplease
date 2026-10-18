// js/main.js - Central Modular Entrypoint for Dhaka Mini-Games Suite
// Orchestrates procedural audio, pixel-art textures, and Phaser game controllers.

import { sfx } from "./audio/sfx.js";
import { buildMasterSprites } from "./sprites/textures.js";
import { RunnerGame } from "./games/runner.js";
import { PacGame } from "./games/pac.js";
import { MarioGame } from "./games/mario.js";

export { sfx, buildMasterSprites, RunnerGame, PacGame, MarioGame };

// Expose on global window object for HTML event listeners and level navigation
if (typeof window !== "undefined") {
  window.Game = RunnerGame;
  window.PacGame = PacGame;
  window.MarioGame = MarioGame;
  window.sfx = sfx;
  window.totoroGamesReady = true;

  // Signal that games suite is ready
  window.dispatchEvent(new CustomEvent("gamesready"));

  // Pre-warm master sprites cache in background so games start instantly
  if (typeof document !== "undefined") {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => buildMasterSprites(), { timeout: 800 });
    } else {
      setTimeout(buildMasterSprites, 60);
    }
  }
}
