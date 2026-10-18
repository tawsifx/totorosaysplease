// js/games/pac.js - "Fuchka Chase" Game Controller
// Manages Phaser instance lifecycle, canvas bindings, and completion callbacks.

import { PacScene } from "../scenes/PacScene.js";
import { PAC_W, PAC_H } from "../data/pac-config.js";

let pacPhaserGame = null;
let pacOnWinCb = () => {};

export const PacGame = {
  start(cb) {
    pacOnWinCb = cb || (() => {});
    if (typeof document === "undefined") return;

    const canvas = document.getElementById("pac-canvas");
    if (!canvas) return;

    if (typeof Phaser === "undefined") {
      setTimeout(() => PacGame.start(cb), 80);
      return;
    }

    if (!pacPhaserGame) {
      pacPhaserGame = new Phaser.Game({
        type: Phaser.CANVAS,
        canvas: canvas,
        width: PAC_W,
        height: PAC_H,
        backgroundColor: "#faf8f6",
        pixelArt: true,
        roundPixels: true,
        banner: false,
        input: { keyboard: true, touch: true },
        scene: [PacScene]
      });
    } else {
      pacPhaserGame.scene.resume("PacScene");
      pacPhaserGame.scene.start("PacScene", { stage: 0, score: 0, lives: 3, onWin: pacOnWinCb });
    }
    canvas.focus({ preventScroll: true });
  },

  stop() {
    if (pacPhaserGame && pacPhaserGame.scene) {
      pacPhaserGame.scene.pause("PacScene");
    }
  },

  getInstance() {
    return pacPhaserGame;
  }
};
