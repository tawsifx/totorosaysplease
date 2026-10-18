// js/scenes/SceneBase.js - Resilient Base Scene Prototype with Lifecycle Management
// Prevents memory leaks, dangling window listeners, and stale event hooks across scene restarts.

const BaseClass = (typeof Phaser !== "undefined" && Phaser.Scene) ? Phaser.Scene : class {};

export class SceneBase extends BaseClass {
  constructor(sceneKey) {
    super(sceneKey);
    this._windowCleanups = [];
  }

  addWindowListener(event, handler, options = false) {
    if (typeof window === "undefined") return;
    window.addEventListener(event, handler, options);
    this._windowCleanups.push(() => {
      window.removeEventListener(event, handler, options);
    });
  }

  cleanupListeners() {
    while (this._windowCleanups.length > 0) {
      const clean = this._windowCleanups.pop();
      try { clean(); } catch (_) {}
    }
  }

  setupAutoCleanup() {
    this.events.once("shutdown", () => {
      this.cleanupListeners();
    });
    this.events.once("destroy", () => {
      this.cleanupListeners();
    });
  }
}
