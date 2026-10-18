// js/scenes/MarioScene.js - Enhanced Dhaka Side-scrolling Platformer ("Run to the Bus Stop")
// Includes responsive coyote-time physics, block bump feedback, enemy stomping, and illuminated street lamps.

import { SceneBase } from "./SceneBase.js";
import { initTexturesForScene } from "../sprites/textures.js";
import { sfx } from "../audio/sfx.js";
import { TS, MR, MARIO_W, MARIO_H, MARIO_LEVELS, buildLevel } from "../data/mario-config.js";

export const marioKeys = { left: false, right: false, jump: false };

export function marioPress(key, isDown) {
  if (key in marioKeys) marioKeys[key] = !!isDown;
}

export class MarioScene extends SceneBase {
  constructor() {
    super("MarioScene");
  }

  init(data) {
    this.levelIdx = data?.level || 0;
    this.score = data?.score || 0;
    this.lives = data?.lives !== undefined ? data.lives : 3;
    this.onWin = data?.onWin || (() => {});
    this.state = "play"; // play, win, dead
    this.invulnTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.prevJumpKey = false;
    this.checkpointX = 2 * TS;
    this.checkpointY = 10 * TS;
  }

  create() {
    this.setupAutoCleanup();
    initTexturesForScene(this);

    const s = MARIO_LEVELS[this.levelIdx] || MARIO_LEVELS[0];
    const lvlGrid = buildLevel(s);
    this.levelWidthPx = s.w * TS;
    this.cameras.main.setBounds(0, 0, this.levelWidthPx, MARIO_H);

    // Parallax Dhaka skyline with layered silhouettes
    this.bg = this.add.graphics().setScrollFactor(0.35);
    this.bg.fillStyle(0xf0ece6, 1);
    for (let x = 0; x < this.levelWidthPx * 0.45; x += 130) {
      this.bg.fillRect(x + 10, 240, 50, 200);
      this.bg.fillRect(x + 65, 210, 60, 230);
      this.bg.fillRect(x + 105, 260, 35, 180);
    }

    // Consolidated ground layer
    const groundG = this.add.graphics();
    groundG.fillStyle(0x7ab88a, 1);

    this.solidBlocks = [];
    this.qBlocks = [];
    this.items = [];
    this.enemies = [];
    this.lamps = [];
    this.totoro = null;

    let startX = 2 * TS, startY = 10 * TS, goalX = (s.w - 4) * TS;

    lvlGrid.forEach((row, y) => {
      [...row].forEach((c, x) => {
        const tx = x * TS, ty = y * TS;
        if (c === "#") {
          groundG.fillStyle(0x7ab88a, 1);
          groundG.fillRect(tx, ty, TS, 4);
          groundG.fillStyle(0xb5aba0, 1);
          groundG.fillRect(tx, ty + 4, TS, TS - 4);
          this.solidBlocks.push({ x: tx, y: ty, w: TS, h: TS });
        } else if (c === "b") {
          const blk = this.add.sprite(tx, ty, "block").setOrigin(0, 0);
          this.solidBlocks.push({ x: tx, y: ty, w: TS, h: TS, sprite: blk, isBrick: true });
        } else if (c === "?") {
          const qb = this.add.sprite(tx, ty, "qblock").setOrigin(0, 0);
          const qEntry = { x: tx, y: ty, w: TS, h: TS, sprite: qb, used: false };
          this.solidBlocks.push(qEntry);
          this.qBlocks.push(qEntry);
        } else if (c === "c") {
          const coin = this.add.sprite(tx + TS / 2, ty + TS / 2, "coin").setOrigin(0.5, 0.5);
          this.items.push({ sprite: coin, type: "coin", x: tx, y: ty });
        } else if (c === "h") {
          const heart = this.add.sprite(tx + TS / 2, ty + TS / 2, "heart").setOrigin(0.5, 0.5);
          this.items.push({ sprite: heart, type: "heart", x: tx, y: ty });
        } else if (c === "k") {
          const kite = this.add.sprite(tx + TS / 2, ty + TS / 2, "kite").setOrigin(0.5, 0.5);
          this.items.push({ sprite: kite, type: "kite", x: tx, y: ty });
        } else if (c === "L") {
          const lamp = this.add.sprite(tx + TS / 2, ty + TS, "lamp_off").setOrigin(0.5, 1);
          this.lamps.push({ sprite: lamp, x: tx, lit: false });
        } else if (c === "r") {
          const walkerKey = s.walker;
          const animKey = walkerKey === "pedestrian" ? "ped_walk" : walkerKey === "cng" ? "cng_run" : "rick_run";
          const e = this.add.sprite(tx + TS / 2, ty + TS, walkerKey, 0).setOrigin(0.5, 1);
          e.play(animKey);
          this.enemies.push({ sprite: e, vx: -50, minX: tx - 90, maxX: tx + 90, isFlyer: false });
        } else if (c === "f") {
          const crow = this.add.sprite(tx + TS / 2, ty + TS / 2, "crow", 0).setOrigin(0.5, 0.5);
          crow.play("crow_fly");
          this.enemies.push({ sprite: crow, baseY: ty + TS / 2, vx: -60, minX: tx - 120, maxX: tx + 120, isFlyer: true, phase: Math.random() * 6 });
        } else if (c === "S") {
          startX = tx + TS / 2;
          startY = ty;
        } else if (c === "T") {
          goalX = tx;
          this.add.sprite(tx - 24, ty + TS, "bussign").setOrigin(0.5, 1);
          this.totoro = this.add.sprite(tx + 40, ty + TS, "totoro").setOrigin(0.5, 1);
        }
      });
    });

    this.checkpointX = startX;
    this.checkpointY = startY;

    // Player (Chibi astronaut girl)
    this.player = this.add.sprite(startX, startY, "chibi", 0).setOrigin(0.5, 1);
    this.player.play("chibi_idle");
    this.p = { x: startX, y: startY, vx: 0, vy: 0, grounded: false, w: 22, h: 42 };
    this.goalX = goalX;

    // Camera follow setup
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Top HUD Fixed to Camera
    this.hudLevel = this.add.text(24, 16, `Stage ${this.levelIdx + 1}: ${s.name}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#433a57",
      fontStyle: "bold"
    }).setScrollFactor(0);

    this.hudScore = this.add.text(MARIO_W / 2, 16, `Score: ${this.score}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#6e7885",
      fontStyle: "bold"
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.hudHeartIcon = this.add.sprite(MARIO_W - 74, 26, "heart").setOrigin(0.5, 0.5).setScrollFactor(0);
    this.hudLives = this.add.text(MARIO_W - 56, 16, `× ${this.lives}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#e05378",
      fontStyle: "bold"
    }).setScrollFactor(0);

    this.hudBanner = this.add.text(MARIO_W / 2, 140, "", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "22px",
      color: "#433a57",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setVisible(false);

    // Keyboard controls via Phaser
    const setKey = (k, down) => { marioKeys[k] = down; };
    if (this.input && this.input.keyboard) {
      this.input.keyboard.on("keydown-LEFT", () => setKey("left", true));
      this.input.keyboard.on("keyup-LEFT", () => setKey("left", false));
      this.input.keyboard.on("keydown-A", () => setKey("left", true));
      this.input.keyboard.on("keyup-A", () => setKey("left", false));
      this.input.keyboard.on("keydown-RIGHT", () => setKey("right", true));
      this.input.keyboard.on("keyup-RIGHT", () => setKey("right", false));
      this.input.keyboard.on("keydown-D", () => setKey("right", true));
      this.input.keyboard.on("keyup-D", () => setKey("right", false));
      this.input.keyboard.on("keydown-SPACE", e => { e.preventDefault(); setKey("jump", true); });
      this.input.keyboard.on("keyup-SPACE", () => setKey("jump", false));
      this.input.keyboard.on("keydown-UP", e => { e.preventDefault(); setKey("jump", true); });
      this.input.keyboard.on("keyup-UP", () => setKey("jump", false));
      this.input.keyboard.on("keydown-W", e => { e.preventDefault(); setKey("jump", true); });
      this.input.keyboard.on("keyup-W", () => setKey("jump", false));
    }

    // Window Key Listeners via SceneBase
    const onKeyDown = e => {
      if (!this.sys.isActive()) return;
      if (["ArrowLeft", "KeyA"].includes(e.code)) { e.preventDefault(); setKey("left", true); }
      else if (["ArrowRight", "KeyD"].includes(e.code)) { e.preventDefault(); setKey("right", true); }
      else if (["Space", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); setKey("jump", true); }
    };
    const onKeyUp = e => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) setKey("left", false);
      else if (["ArrowRight", "KeyD"].includes(e.code)) setKey("right", false);
      else if (["Space", "ArrowUp", "KeyW"].includes(e.code)) setKey("jump", false);
    };
    this.addWindowListener("keydown", onKeyDown);
    this.addWindowListener("keyup", onKeyUp);
  }

  showBanner(msg, duration = 1200) {
    this.hudBanner.setText(msg).setVisible(true);
    if (duration > 0) {
      this.time.delayedCall(duration, () => this.hudBanner.setVisible(false));
    }
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      this.player.setAlpha(Math.floor(time / 100) % 2 === 0 ? 0.35 : 1);
      if (this.invulnTimer <= 0) this.player.setAlpha(1);
    }

    if (this.state === "play") {
      this.updatePlayerPhysics(dt);
      this.updateEnemies(time, dt);
      this.updateCollectibles();
      this.checkCheckpoints();
      this.checkGoal();
    }
  }

  updatePlayerPhysics(dt) {
    const p = this.p;
    const moveLeft = marioKeys.left, moveRight = marioKeys.right, jumpKey = marioKeys.jump;
    const accel = 1050, maxSpeed = 240, friction = 880;

    if (moveLeft && !moveRight) {
      p.vx = Math.max(-maxSpeed, p.vx - accel * dt);
      this.player.setFlipX(true);
    } else if (moveRight && !moveLeft) {
      p.vx = Math.min(maxSpeed, p.vx + accel * dt);
      this.player.setFlipX(false);
    } else {
      if (p.vx > 0) p.vx = Math.max(0, p.vx - friction * dt);
      else if (p.vx < 0) p.vx = Math.min(0, p.vx + friction * dt);
    }

    // Coyote time: jump grace window after leaving ground
    if (p.grounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // Jump buffering: buffer jump if pressed just before landing
    const jumpJustPressed = jumpKey && !this.prevJumpKey;
    this.prevJumpKey = jumpKey;
    if (jumpJustPressed) {
      this.jumpBuffer = 0.14;
    } else {
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    }

    // Execute jump with calibrated height
    if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
      p.vy = -640;
      p.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
      sfx.jump();
    }

    // Variable jump gravity: float when holding jump, short hop on quick tap
    const grav = (p.vy < 0 && jumpKey) ? 1150 : 2100;
    p.vy = Math.min(750, p.vy + grav * dt);

    p.x += p.vx * dt;
    for (const b of this.solidBlocks) {
      // Corner tolerance: ignore horizontal collision if feet are within 8px of top
      if (p.y - 8 > b.y && p.y - p.h < b.y + b.h) {
        if (p.x + p.w / 2 > b.x && p.x - p.w / 2 < b.x + b.w) {
          if (p.vx > 0) p.x = b.x - p.w / 2;
          else if (p.vx < 0) p.x = b.x + b.w + p.w / 2;
          p.vx = 0;
        }
      }
    }

    p.grounded = false;
    p.y += p.vy * dt;
    for (const b of this.solidBlocks) {
      if (p.x + p.w / 2 > b.x && p.x - p.w / 2 < b.x + b.w &&
          p.y > b.y && p.y - p.h < b.y + b.h) {
        if (p.vy > 0) {
          p.y = b.y;
          p.vy = 0;
          p.grounded = true;
        } else if (p.vy < 0) {
          p.y = b.y + b.h + p.h;
          p.vy = 0;
          sfx.bump();
          if (b.isBrick && b.sprite) {
            this.tweens.add({ targets: b.sprite, y: b.y - 6, yoyo: true, duration: 60 });
          } else if (this.qBlocks.includes(b)) {
            this.bumpQBlock(b);
          }
        }
      }
    }

    if (!p.grounded) {
      this.player.play("chibi_jump", true);
    } else if (Math.abs(p.vx) > 15) {
      this.player.play("chibi_run", true);
    } else {
      this.player.play("chibi_idle", true);
    }

    this.player.x = p.x;
    this.player.y = p.y;

    // Pitfall handling
    if (p.y > MARIO_H + 50) {
      sfx.hit();
      this.lives--;
      this.hudLives.setText(`× ${this.lives}`);
      if (this.lives > 0) {
        p.x = this.checkpointX;
        p.y = this.checkpointY;
        p.vx = 0;
        p.vy = 0;
      } else {
        this.scene.restart({ level: this.levelIdx, score: this.score, lives: 3, onWin: this.onWin });
      }
    }
  }

  bumpQBlock(b) {
    if (b.used) return;
    b.used = true;
    b.sprite.setTexture("qblock_spent");
    this.tweens.add({ targets: b.sprite, y: b.y - 6, yoyo: true, duration: 60 });

    const isHeart = Math.random() < 0.25;
    const itemKey = isHeart ? "heart" : "coin";
    const item = this.add.sprite(b.x + TS / 2, b.y, itemKey).setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: item,
      y: b.y - 36,
      alpha: 0,
      duration: 650,
      onComplete: () => item.destroy()
    });

    if (isHeart) {
      sfx.powerup();
      this.lives++;
      this.hudLives.setText(`× ${this.lives}`);
    } else {
      sfx.coin();
      this.score += 100;
      this.hudScore.setText(`Score: ${this.score}`);
    }
  }

  updateEnemies(time, dt) {
    const p = this.p;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isFlyer) {
        e.sprite.x += e.vx * dt;
        e.sprite.y = e.baseY + Math.sin(time * 0.005 + e.phase) * 16;
        if (e.sprite.x < e.minX || e.sprite.x > e.maxX) {
          e.vx = -e.vx;
          e.sprite.setFlipX(e.vx > 0);
        }
      } else {
        e.sprite.x += e.vx * dt;
        if (e.sprite.x < e.minX || e.sprite.x > e.maxX) {
          e.vx = -e.vx;
          e.sprite.setFlipX(e.vx > 0);
        }
      }

      const ex = e.sprite.x, ey = e.isFlyer ? e.sprite.y : e.sprite.y - 16;
      const ew = 28, eh = 28;

      if (Math.abs(p.x - ex) < (p.w + ew) / 2 && Math.abs((p.y - p.h / 2) - ey) < (p.h + eh) / 2) {
        if (p.vy > 0 && p.y - p.vy * dt <= ey + 10) {
          sfx.stomp();
          p.vy = marioKeys.jump ? -640 : -480;
          this.score += 200;
          this.hudScore.setText(`Score: ${this.score}`);
          e.sprite.destroy();
          this.enemies.splice(i, 1);
        } else if (this.invulnTimer <= 0) {
          sfx.hit();
          this.lives--;
          this.hudLives.setText(`× ${this.lives}`);
          this.invulnTimer = 1.8;
          p.vx = p.x < ex ? -160 : 160;
          p.vy = -220;

          if (this.lives <= 0) {
            this.scene.restart({ level: this.levelIdx, score: this.score, lives: 3, onWin: this.onWin });
          }
        }
      }
    }
  }

  updateCollectibles() {
    const p = this.p;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (Math.abs(p.x - it.sprite.x) < 22 && Math.abs((p.y - p.h / 2) - it.sprite.y) < 24) {
        if (it.type === "coin") {
          sfx.coin();
          this.score += 100;
        } else if (it.type === "heart") {
          sfx.powerup();
          this.lives++;
          this.hudLives.setText(`× ${this.lives}`);
        } else if (it.type === "kite") {
          sfx.powerup();
          this.score += 500;
        }
        this.hudScore.setText(`Score: ${this.score}`);
        it.sprite.destroy();
        this.items.splice(i, 1);
      }
    }
  }

  checkCheckpoints() {
    this.lamps.forEach(lamp => {
      if (!lamp.lit && this.p.x >= lamp.x - 20) {
        lamp.lit = true;
        lamp.sprite.setTexture("lamp_on");
        this.checkpointX = lamp.x;
        this.checkpointY = this.p.y;
        sfx.checkpoint();
        this.showBanner("Checkpoint! 🏮", 1200);
      }
    });
  }

  checkGoal() {
    if (this.p.x >= this.goalX - 25 && this.state === "play") {
      this.state = "win";
      this.p.vx = 0;
      this.player.play("chibi_idle");
      sfx.win();

      if (this.totoro) {
        this.tweens.add({ targets: this.totoro, y: this.totoro.y - 12, yoyo: true, duration: 180, repeat: 3 });
      }

      this.showBanner(this.levelIdx < 2 ? "You found Totoro! On to next stage..." : "You found Totoro! 💕", 2000);
      this.time.delayedCall(1800, () => {
        if (this.levelIdx < 2) {
          this.scene.restart({ level: this.levelIdx + 1, score: this.score, lives: this.lives, onWin: this.onWin });
        } else {
          this.onWin();
        }
      });
    }
  }
}
