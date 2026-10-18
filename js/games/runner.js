// js/games/runner.js - "Run to Totoro" Game Controller
// Manages Phaser instance lifecycle, canvas bindings, and completion callbacks.

import { RunnerScene } from "../scenes/RunnerScene.js";
import { RUN_W, RUN_H } from "../data/runner-config.js";

let runnerPhaserGame = null;
let runOnWinCb = () => {};

export const RunnerGame = {
  start(cb) {
    runOnWinCb = cb || (() => {});
    if (typeof document === "undefined") return;

    const canvas = document.getElementById("game-canvas");
    if (!canvas) return;

    if (typeof Phaser === "undefined") {
      setTimeout(() => RunnerGame.start(cb), 80);
      return;
    }

    if (!runnerPhaserGame) {
      runnerPhaserGame = new Phaser.Game({
        type: Phaser.CANVAS,
        canvas: canvas,
        width: RUN_W,
        height: RUN_H,
        backgroundColor: "#faf8f6",
        pixelArt: true,
        roundPixels: true,
        banner: false,
        input: { keyboard: true, touch: true },
        scene: [RunnerScene]
      });
    } else {
      runnerPhaserGame.scene.resume("RunnerScene");
      runnerPhaserGame.scene.start("RunnerScene", { onWin: runOnWinCb });
    }
    canvas.focus({ preventScroll: true });
  },

  stop() {
    if (runnerPhaserGame && runnerPhaserGame.scene) {
      runnerPhaserGame.scene.pause("RunnerScene");
    }
  },

  getInstance() {
    return runnerPhaserGame;
  }
};
