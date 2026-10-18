// js/games/mario.js - "Run to the Bus Stop" Game Controller
// Manages Phaser instance lifecycle, canvas bindings, mobile touch pad, and completion callbacks.

import { MarioScene, marioPress, marioKeys } from "../scenes/MarioScene.js";
import { MARIO_W, MARIO_H } from "../data/mario-config.js";

let marioPhaserGame = null;
let marioOnWinCb = () => {};

export const MarioGame = {
  start(cb) {
    marioOnWinCb = cb || (() => {});
    marioKeys.left = marioKeys.right = marioKeys.jump = false;
    if (typeof document === "undefined") return;

    const canvas = document.getElementById("mario-canvas");
    if (!canvas) return;

    if (typeof Phaser === "undefined") {
      setTimeout(() => MarioGame.start(cb), 80);
      return;
    }

    if (!marioPhaserGame) {
      marioPhaserGame = new Phaser.Game({
        type: Phaser.CANVAS,
        canvas: canvas,
        width: MARIO_W,
        height: MARIO_H,
        backgroundColor: "#faf8f6",
        pixelArt: true,
        roundPixels: true,
        banner: false,
        input: { keyboard: true, touch: true },
        scene: [MarioScene]
      });
    } else {
      marioPhaserGame.scene.resume("MarioScene");
      marioPhaserGame.scene.start("MarioScene", { level: 0, score: 0, lives: 3, onWin: marioOnWinCb });
    }
    canvas.focus({ preventScroll: true });
  },

  stop() {
    marioKeys.left = marioKeys.right = marioKeys.jump = false;
    if (marioPhaserGame && marioPhaserGame.scene) {
      marioPhaserGame.scene.pause("MarioScene");
    }
  },

  press: marioPress,

  getInstance() {
    return marioPhaserGame;
  }
};
