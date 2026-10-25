// js/main.js - Central Modular Entrypoint for Dhaka Mini-Games Suite
// Orchestrates procedural audio, pixel-art textures, and Phaser game controllers.

import { sfx } from "./audio/sfx.js";
import { ambientAudio } from "./audio/ambient.js";
import { buildMasterSprites } from "./sprites/textures.js";
import { RunnerGame } from "./games/runner.js";
import { PacGame } from "./games/pac.js";
import { MarioGame } from "./games/mario.js";
import { totoroDB, IndexedDatabase } from "./storage/db.js";
import { Runner3DFX, Mario3DFX, MeshFactory3D } from "./3d/game3d.js";

export { sfx, ambientAudio, buildMasterSprites, RunnerGame, PacGame, MarioGame, totoroDB, IndexedDatabase, Runner3DFX, Mario3DFX, MeshFactory3D };

// Expose on global window object for HTML event listeners and level navigation
if (typeof window !== "undefined") {
  window.Game = RunnerGame;
  window.PacGame = PacGame;
  window.MarioGame = MarioGame;
  window.Runner3DFX = Runner3DFX;
  window.Mario3DFX = Mario3DFX;
  window.MeshFactory3D = MeshFactory3D;
  window.sfx = sfx;
  window.ambientAudio = ambientAudio;
  window.gameAmbient = ambientAudio;
  window.totoroDB = totoroDB;
  window.db = totoroDB;
  window.IndexedDatabase = IndexedDatabase;
  window.totoroGamesReady = true;

  // Initialize and warm IndexedDB in background
  totoroDB.open().catch(() => {});

  // Signal that games suite is ready
  window.dispatchEvent(new CustomEvent("gamesready"));

  // Pre-warm master sprites cache in background so games start instantly
  if (typeof document !== "undefined") {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => buildMasterSprites(), { timeout: 800 });
    } else {
      setTimeout(buildMasterSprites, 60);
    }

    // Interactive 3D Perspective Tilt on Game Cards for Desktop Hover
    if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
      document.querySelectorAll(".game-card").forEach(card => {
        card.addEventListener("pointermove", e => {
          const rect = card.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          const tiltX = -y * 3.5;
          const tiltY = x * 3.5;
          card.style.transform = `perspective(1200px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale3d(1.008, 1.008, 1.008)`;
        });
        card.addEventListener("pointerleave", () => {
          card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        });
      });
    }
  }
}
