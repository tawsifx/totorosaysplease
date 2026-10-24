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
    this.dustTimer = 0;
    this.petalTimer = 0;
    this.dustList = [];
    this.petalList = [];
    this.clouds = [];
  }

  create() {
    this.setupAutoCleanup();
    initTexturesForScene(this);

    const s = MARIO_LEVELS[this.levelIdx] || MARIO_LEVELS[0];
    const lvlGrid = buildLevel(s);
    this.levelWidthPx = s.w * TS;
    this.cameras.main.setBounds(0, 0, this.levelWidthPx, MARIO_H);

    // Multi-layer stage-themed Dhaka backdrop & parallax skyline
    this.renderBackdrop(s);

    // Parallax drifting clouds
    for (let cx = 60; cx < this.levelWidthPx * 0.5; cx += 210) {
      const cy = 42 + (cx % 3) * 22;
      const sp = 10 + (cx % 4) * 3;
      const cl = this.add.sprite(cx, cy, "cloud").setAlpha(0.82).setScrollFactor(0.28);
      this.clouds.push({ sprite: cl, sp, maxX: this.levelWidthPx * 0.5 + 100 });
    }

    // Consolidated ground & bus stop shelter graphics layer
    const groundG = this.add.graphics();

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
          const isTop = y === 0 || lvlGrid[y - 1][x] !== "#";
          if (isTop) {
            // Lush grass verge & highlight
            groundG.fillStyle(0x63ad75, 1);
            groundG.fillRect(tx, ty, TS, 6);
            groundG.fillStyle(0x84cf96, 1);
            groundG.fillRect(tx, ty, TS, 2);
            // Grass blades
            groundG.fillStyle(0x4b8f5c, 1);
            groundG.fillRect(tx + 6, ty + 4, 3, 3);
            groundG.fillRect(tx + 20, ty + 4, 3, 3);
            // Classic Dhaka striped sidewalk curb
            groundG.fillStyle((x + y) % 2 === 0 ? 0xe0d8d0 : 0x7d746d, 1);
            groundG.fillRect(tx, ty + 6, TS, 4);
            // Textured footpath & road foundation
            groundG.fillStyle(0xb5aba0, 1);
            groundG.fillRect(tx, ty + 10, TS, TS - 10);
            groundG.fillStyle(0xa3988d, 1);
            groundG.fillRect(tx + 4, ty + 15, 10, 6);
            groundG.fillRect(tx + 18, ty + 22, 10, 6);
          } else {
            // Subterranean brick/earth foundation
            groundG.fillStyle(0xa3988d, 1);
            groundG.fillRect(tx, ty, TS, TS);
            groundG.fillStyle(0x91867b, 1);
            groundG.fillRect(tx, ty, TS, 2);
            const offset = (y % 2) * 8;
            groundG.fillStyle(0xb5aba0, 1);
            groundG.fillRect(tx + 2 + offset, ty + 6, 12, 8);
            groundG.fillRect(tx + 16 - offset, ty + 18, 12, 8);
          }
          this.solidBlocks.push({ x: tx, y: ty, w: TS, h: TS });
        } else if (c === "b") {
          // 3D cast depth shadow underneath brick block
          groundG.fillStyle(0x382d38, 0.15);
          groundG.fillRect(tx + 2, ty + TS, TS - 4, 3);
          const blk = this.add.sprite(tx, ty, "block").setOrigin(0, 0);
          this.solidBlocks.push({ x: tx, y: ty, w: TS, h: TS, sprite: blk, isBrick: true });
        } else if (c === "?") {
          // 3D cast depth shadow underneath question block
          groundG.fillStyle(0x382d38, 0.15);
          groundG.fillRect(tx + 2, ty + TS, TS - 4, 3);
          const qb = this.add.sprite(tx, ty, "qblock").setOrigin(0, 0);
          const qEntry = { x: tx, y: ty, w: TS, h: TS, sprite: qb, used: false };
          this.solidBlocks.push(qEntry);
          this.qBlocks.push(qEntry);
        } else if (c === "c") {
          const by = ty + TS / 2;
          const coin = this.add.sprite(tx + TS / 2, by, "coin").setOrigin(0.5, 0.5);
          this.items.push({ sprite: coin, type: "coin", x: tx, y: ty, baseY: by, phase: x * 0.6 });
        } else if (c === "h") {
          const by = ty + TS / 2;
          const heart = this.add.sprite(tx + TS / 2, by, "heart").setOrigin(0.5, 0.5);
          this.items.push({ sprite: heart, type: "heart", x: tx, y: ty, baseY: by, phase: x * 0.6 });
        } else if (c === "k") {
          const by = ty + TS / 2;
          const kite = this.add.sprite(tx + TS / 2, by, "kite").setOrigin(0.5, 0.5);
          this.items.push({ sprite: kite, type: "kite", x: tx, y: ty, baseY: by, phase: x * 0.6 });
        } else if (c === "L") {
          const glow = this.add.circle(tx + TS / 2, ty + TS - 50, 22, 0xffe46b, 0).setVisible(false);
          const lamp = this.add.sprite(tx + TS / 2, ty + TS, "lamp_off").setOrigin(0.5, 1);
          this.lamps.push({ sprite: lamp, glow, x: tx, y: ty + TS, lit: false });
        } else if (c === "r") {
          const walkerKey = s.walker;
          const animKey = walkerKey === "pedestrian" ? "ped_walk" : walkerKey === "cng" ? "cng_run" : "rick_run";
          const eShadow = this.add.ellipse(tx + TS / 2, ty + TS + 1, walkerKey === "pedestrian" ? 22 : 36, 6, 0x4a403b, 0.25);
          const e = this.add.sprite(tx + TS / 2, ty + TS, walkerKey, 0).setOrigin(0.5, 1);
          e.play(animKey);
          // All enemy sprites are drawn facing right (+x); initial vx is -50 (left), so flipX must be true
          e.setFlipX(true);
          this.enemies.push({ sprite: e, shadow: eShadow, key: walkerKey, vx: -50, minX: tx - 90, maxX: tx + 90, isFlyer: false });
        } else if (c === "f") {
          const crow = this.add.sprite(tx + TS / 2, ty + TS / 2, "crow", 0).setOrigin(0.5, 0.5);
          crow.play("crow_fly");
          // Crow sprite is drawn facing right (+x); initial vx is -60 (left), so flipX must be true
          crow.setFlipX(true);
          this.enemies.push({
            sprite: crow,
            key: "crow",
            baseY: ty + TS / 2,
            vx: -60,
            minX: tx - 120,
            maxX: tx + 120,
            isFlyer: true,
            phase: Math.random() * 6
          });
        } else if (c === "S") {
          startX = tx + TS / 2;
          startY = ty;
        } else if (c === "T") {
          goalX = tx;
          this.renderBusStopShelter(groundG, tx, ty + TS);
          this.add.sprite(tx - 24, ty + TS, "bussign").setOrigin(0.5, 1);
          this.totoroShadow = this.add.ellipse(tx + 40, ty + TS + 1, 74, 12, 0x4a403b, 0.25);
          this.totoro = this.add.sprite(tx + 40, ty + TS, "totoro").setOrigin(0.5, 1);
        }
      });
    });

    this.checkpointX = startX;
    this.checkpointY = startY;

    // 3D Perspective Ground Shadow under Chibi Player
    this.playerShadow = this.add.ellipse(startX, startY + 1, 26, 6, 0x4a403b, 0.28);

    // Player (Chibi astronaut girl)
    this.player = this.add.sprite(startX, startY, "chibi", 0).setOrigin(0.5, 1);
    this.player.play("chibi_idle");
    this.p = { x: startX, y: startY, vx: 0, vy: 0, grounded: false, w: 22, h: 42 };
    this.goalX = goalX;

    // Camera follow setup
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Top HUD Pills Fixed to Camera
    const hudBg = this.add.graphics().setScrollFactor(0);
    hudBg.fillStyle(0xffffff, 0.78);
    hudBg.fillRoundedRect(14, 10, 275, 30, 15);
    hudBg.fillRoundedRect(MARIO_W / 2 - 70, 10, 140, 30, 15);
    hudBg.fillRoundedRect(MARIO_W - 102, 10, 88, 30, 15);

    this.hudLevel = this.add.text(26, 16, `Stage ${this.levelIdx + 1}: ${s.name}`, {
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

    this.hudHeartIcon = this.add.sprite(MARIO_W - 76, 25, "heart").setOrigin(0.5, 0.5).setScrollFactor(0);
    this.hudLives = this.add.text(MARIO_W - 58, 16, `× ${this.lives}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#e05378",
      fontStyle: "bold"
    }).setScrollFactor(0);

    this.hudBanner = this.add.text(MARIO_W / 2, 140, "", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "22px",
      color: "#433a57",
      fontStyle: "bold",
      backgroundColor: "rgba(255,255,255,0.85)",
      padding: { x: 16, y: 6 }
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

  renderBackdrop(s) {
    // Stage-themed atmospheric sky bands fixed to viewport
    const sky = this.add.graphics().setScrollFactor(0);
    const themes = [
      // Stage 1: Dhanmondi Rickshaw Road (Warm Golden Hour)
      { top: 0xfbf4ee, mid: 0xf7e8dc, bot: 0xf2dcd0, sun: 0xffe08a, far: 0xe6dad0, midSil: 0xd9c8bc },
      // Stage 2: Hatirjheel Bridge (Rose-Amber Twilight)
      { top: 0xf9eff2, mid: 0xf3e1e8, bot: 0xebd3de, sun: 0xffb79c, far: 0xdfd0d8, midSil: 0xd1bcc7 },
      // Stage 3: Old Dhaka Rooftops (Lavender-Gold Dusk)
      { top: 0xf2eef8, mid: 0xe9e1f2, bot: 0xdfd4eb, sun: 0xffe6a3, far: 0xd6cadf, midSil: 0xc5b6d1 }
    ];
    const th = themes[this.levelIdx] || themes[0];
    sky.fillStyle(th.top, 1);
    sky.fillRect(0, 0, MARIO_W, 150);
    sky.fillStyle(th.mid, 1);
    sky.fillRect(0, 150, MARIO_W, 150);
    sky.fillStyle(th.bot, 1);
    sky.fillRect(0, 300, MARIO_W, MARIO_H - 300);

    // Warm sun / evening moon glow
    sky.fillStyle(th.sun, 0.28);
    sky.fillCircle(650, 88, 44);
    sky.fillStyle(th.sun, 0.65);
    sky.fillCircle(650, 88, 26);

    // Far parallax Dhaka skyline (Curzon Hall domes, water tanks & lit windows)
    this.bg = this.add.graphics().setScrollFactor(0.22);
    const farSpan = Math.ceil(this.levelWidthPx * 0.35) + MARIO_W;
    for (let x = 0; x < farSpan; x += 160) {
      this.bg.fillStyle(th.far, 1);
      this.bg.fillRect(x + 8, 220, 48, 228);
      this.bg.fillRect(x + 62, 185, 58, 263);
      // Heritage dome silhouette
      this.bg.fillCircle(x + 91, 185, 20);
      this.bg.fillRect(x + 126, 235, 30, 213);
      // Rooftop water tank
      this.bg.fillRect(x + 24, 208, 14, 12);
      // Warm evening window lights
      this.bg.fillStyle(0xffdf91, 0.55);
      this.bg.fillRect(x + 72, 205, 8, 10);
      this.bg.fillRect(x + 92, 205, 8, 10);
      this.bg.fillRect(x + 72, 228, 8, 10);
      this.bg.fillRect(x + 20, 240, 8, 10);
    }

    // Midground stage-specific landmarks (scrollFactor 0.45)
    const midG = this.add.graphics().setScrollFactor(0.45);
    const midSpan = Math.ceil(this.levelWidthPx * 0.55) + MARIO_W;
    if (this.levelIdx === 0) {
      // Dhanmondi blooming Krishnachura trees & lakeside promenade
      for (let x = 40; x < midSpan; x += 220) {
        midG.fillStyle(0x7d5642, 0.75);
        midG.fillRect(x + 26, 300, 10, 90);
        midG.fillStyle(0x52996b, 0.7);
        midG.fillCircle(x + 16, 298, 24);
        midG.fillCircle(x + 46, 298, 24);
        // Vibrant crimson-orange Krishnachura canopy blossoms
        midG.fillStyle(0xe84a5f, 0.75);
        midG.fillCircle(x + 31, 280, 28);
        midG.fillStyle(0xff7b54, 0.7);
        midG.fillCircle(x + 20, 274, 18);
        midG.fillCircle(x + 44, 278, 16);
      }
    } else if (this.levelIdx === 1) {
      // Hatirjheel iconic parabolic bridge arches & water shimmer
      midG.fillStyle(0xa8c8dc, 0.35);
      midG.fillRect(0, 385, midSpan, 63);
      for (let x = 20; x < midSpan; x += 240) {
        midG.lineStyle(4, 0xd48b9f, 0.55);
        midG.strokeCircle(x + 100, 390, 95);
        midG.lineStyle(2, 0xe05378, 0.35);
        for (let sx = x + 25; sx <= x + 175; sx += 25) {
          midG.lineBetween(sx, 315, sx, 385);
        }
      }
    } else {
      // Old Dhaka heritage arches & rooftop parapets
      for (let x = 0; x < midSpan; x += 180) {
        midG.fillStyle(th.midSil, 0.85);
        midG.fillRect(x + 15, 255, 70, 193);
        midG.fillCircle(x + 50, 255, 24);
        midG.fillRect(x + 95, 275, 65, 173);
      }
    }
  }

  renderBusStopShelter(g, gx, gy) {
    // Cozy Dhaka Bus Stop waiting shelter right behind Totoro & the Bus Sign
    const sx = gx - 8, sy = gy - 76, sw = 88, sh = 76;
    // Shelter shadow & concrete base
    g.fillStyle(0x78828a, 1);
    g.fillRect(sx - 4, gy - 4, sw + 8, 4);
    // Steel support pillars
    g.fillStyle(0x37474f, 1);
    g.fillRect(sx + 4, sy + 12, 5, sh - 16);
    g.fillRect(sx + sw - 9, sy + 12, 5, sh - 16);
    // Translucent back shelter panel & route board
    g.fillStyle(0xfef9f0, 0.82);
    g.fillRect(sx + 11, sy + 18, sw - 22, sh - 32);
    g.fillStyle(0xd9384f, 0.9);
    g.fillRect(sx + 15, sy + 22, sw - 30, 8);
    // Wooden waiting bench
    g.fillStyle(0x8c583a, 1);
    g.fillRect(sx + 14, gy - 20, sw - 28, 5);
    g.fillStyle(0x5c3824, 1);
    g.fillRect(sx + 20, gy - 15, 4, 11);
    g.fillRect(sx + sw - 24, gy - 15, 4, 11);
    // Arched Dhaka Green & Crimson Bus Stop canopy roof
    g.fillStyle(0x1b5e20, 1);
    g.fillRoundedRect(sx - 6, sy, sw + 12, 14, 6);
    g.fillStyle(0x2e7d32, 1);
    g.fillRoundedRect(sx - 4, sy + 2, sw + 8, 9, 4);
    g.fillStyle(0xd9384f, 1);
    g.fillRect(sx - 2, sy + 9, sw + 4, 3);
    // Warm overhead shelter lantern glow
    g.fillStyle(0xffe46b, 0.35);
    g.fillCircle(sx + sw / 2, sy + 16, 18);
  }

  spawnDust(x, y, vx, vy, color = 0xe6ded6) {
    const d = this.add.circle(x, y, Math.random() * 1.6 + 1.4, color, 0.85);
    this.dustList.push({ circle: d, vx, vy, life: 1.0 });
  }

  spawnBurst(x, y, color = 0xffd54f) {
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI * 2 * i) / 6;
      this.spawnDust(x, y, Math.cos(ang) * 45, Math.sin(ang) * 45 - 15, color);
    }
  }

  spawnScorePopup(x, y, text, color = "#e05378") {
    const t = this.add.text(x, y, text, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "14px",
      color,
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: t,
      y: y - 26,
      alpha: 0,
      duration: 600,
      onComplete: () => t.destroy()
    });
  }

  spawnPetal() {
    const camX = this.cameras?.main ? this.cameras.main.scrollX : 0;
    const p = this.add.circle(
      camX + MARIO_W + 10,
      Math.random() * (MARIO_H - 120),
      Math.random() * 2 + 1.5,
      0xf25c84,
      0.72
    );
    this.petalList.push({
      circle: p,
      vx: -(Math.random() * 45 + 55),
      vy: Math.random() * 18 + 12,
      phase: Math.random() * 6
    });
  }

  showBanner(msg, duration = 1200) {
    this.hudBanner.setText(msg).setVisible(true);
    if (duration > 0) {
      this.time.delayedCall(duration, () => this.hudBanner.setVisible(false));
    }
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);

    // Parallax clouds
    this.clouds.forEach(c => {
      c.sprite.x -= c.sp * dt;
      if (c.sprite.x < -80) c.sprite.x = c.maxX;
    });

    // Drifting Krishnachura petals
    this.petalTimer -= dt;
    if (this.petalTimer <= 0) {
      this.petalTimer = 0.7;
      this.spawnPetal();
    }
    const camX = this.cameras?.main ? this.cameras.main.scrollX : 0;
    for (let i = this.petalList.length - 1; i >= 0; i--) {
      const pt = this.petalList[i];
      pt.circle.x += pt.vx * dt;
      pt.circle.y += (pt.vy + Math.sin(time * 0.003 + pt.phase) * 12) * dt;
      if (pt.circle.x < camX - 40 || pt.circle.y > MARIO_H) {
        pt.circle.destroy();
        this.petalList.splice(i, 1);
      }
    }

    // Dust & burst particles
    for (let i = this.dustList.length - 1; i >= 0; i--) {
      const d = this.dustList[i];
      d.circle.x += d.vx * dt;
      d.circle.y += d.vy * dt;
      d.life -= dt * 2.0;
      d.circle.setAlpha(Math.max(0, d.life));
      if (d.life <= 0) {
        d.circle.destroy();
        this.dustList.splice(i, 1);
      }
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      this.player.setAlpha(Math.floor(time / 100) % 2 === 0 ? 0.35 : 1);
      if (this.invulnTimer <= 0) this.player.setAlpha(1);
    }

    if (this.state === "play") {
      this.updatePlayerPhysics(dt);
      this.updateEnemies(time, dt);
      this.updateCollectibles(time);
      this.checkCheckpoints();
      this.checkGoal();
    }
  }

  updatePlayerPhysics(dt) {
    const p = this.p;
    const wasGrounded = p.grounded;
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
      for (let i = 0; i < 4; i++) {
        this.spawnDust(p.x + (Math.random() * 10 - 5), p.y - 2, (Math.random() - 0.5) * 35, -(Math.random() * 20 + 8));
      }
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
          if (!wasGrounded && p.vy > 180) {
            this.spawnDust(p.x - 6, b.y - 1, -20, -10);
            this.spawnDust(p.x + 6, b.y - 1, 20, -10);
          }
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

    // Running footstep dust
    this.dustTimer -= dt;
    if (p.grounded && Math.abs(p.vx) > 90 && this.dustTimer <= 0) {
      this.dustTimer = 0.18;
      this.spawnDust(p.x - Math.sign(p.vx) * 6, p.y - 2, -p.vx * 0.2, -12);
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

    // Update 3D ground contact shadow under player
    if (this.playerShadow) {
      let groundBelowY = MARIO_H + 50;
      for (const b of this.solidBlocks) {
        if (p.x + p.w / 2 > b.x && p.x - p.w / 2 < b.x + b.w && b.y >= p.y - 4) {
          if (b.y < groundBelowY) groundBelowY = b.y;
        }
      }
      const distToGround = Math.max(0, groundBelowY - p.y);
      const shadowScale = Math.max(0.35, 1 - distToGround / 150);
      this.playerShadow.x = p.x;
      this.playerShadow.y = groundBelowY + 1;
      this.playerShadow.setScale(shadowScale, shadowScale);
      this.playerShadow.setAlpha(Math.max(0.06, 0.28 * (1 - distToGround / 170)));
    }

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
      this.spawnScorePopup(b.x + TS / 2, b.y - 16, "+1 ♥", "#e05378");
    } else {
      sfx.coin();
      this.score += 100;
      this.hudScore.setText(`Score: ${this.score}`);
      this.spawnScorePopup(b.x + TS / 2, b.y - 16, "+100", "#f7cb45");
    }
  }

  updateEnemies(time, dt) {
    const p = this.p;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.sprite.x += e.vx * dt;

      if (e.sprite.x <= e.minX) {
        e.sprite.x = e.minX;
        e.vx = Math.abs(e.vx);
      } else if (e.sprite.x >= e.maxX) {
        e.sprite.x = e.maxX;
        e.vx = -Math.abs(e.vx);
      }

      // Sprites are drawn facing right (+x); flip horizontally when moving left (vx < 0)
      e.sprite.setFlipX(e.vx < 0);

      if (e.isFlyer) {
        e.sprite.y = e.baseY + Math.sin(time * 0.005 + e.phase) * 16;
        // Subtle aerodynamic banking tilt matching flight direction
        e.sprite.setAngle(Math.cos(time * 0.005 + e.phase) * (e.vx < 0 ? 4 : -4));
      } else if (e.shadow) {
        e.shadow.x = e.sprite.x;
      }

      const ex = e.sprite.x, ey = e.isFlyer ? e.sprite.y : e.sprite.y - 16;
      const ew = 28, eh = 28;

      if (Math.abs(p.x - ex) < (p.w + ew) / 2 && Math.abs((p.y - p.h / 2) - ey) < (p.h + eh) / 2) {
        if (p.vy > 0 && p.y - p.vy * dt <= ey + 10) {
          sfx.stomp();
          p.vy = marioKeys.jump ? -640 : -480;
          this.score += 200;
          this.hudScore.setText(`Score: ${this.score}`);
          this.spawnBurst(ex, ey, 0xffd54f);
          this.spawnScorePopup(ex, ey - 10, "+200", "#e05378");
          if (e.shadow) e.shadow.destroy();
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

  updateCollectibles(time = 0) {
    const p = this.p;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.baseY !== undefined) {
        it.sprite.y = it.baseY + Math.sin(time * 0.005 + (it.phase || 0)) * 3.5;
      }
      // 3D rotations on collectible objects
      if (it.type === "coin") {
        it.sprite.scaleX = Math.cos(time * 0.007 + (it.phase || 0)); // 3D Y-axis spinning
      } else if (it.type === "kite") {
        it.sprite.setAngle(Math.sin(time * 0.003 + (it.phase || 0)) * 7); // 3D wind roll
        it.sprite.scaleX = 1 + Math.sin(time * 0.005 + (it.phase || 0)) * 0.08; // 3D yaw flex
      }
      if (Math.abs(p.x - it.sprite.x) < 22 && Math.abs((p.y - p.h / 2) - it.sprite.y) < 24) {
        if (it.type === "coin") {
          sfx.coin();
          this.score += 100;
          this.spawnScorePopup(it.sprite.x, it.sprite.y, "+100", "#d4972c");
        } else if (it.type === "heart") {
          sfx.powerup();
          this.lives++;
          this.hudLives.setText(`× ${this.lives}`);
          this.spawnBurst(it.sprite.x, it.sprite.y, 0xf25c84);
          this.spawnScorePopup(it.sprite.x, it.sprite.y, "+1 ♥", "#e05378");
        } else if (it.type === "kite") {
          sfx.powerup();
          this.score += 500;
          this.spawnBurst(it.sprite.x, it.sprite.y, 0xff8da9);
          this.spawnScorePopup(it.sprite.x, it.sprite.y, "+500 Kite!", "#e05378");
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
        if (lamp.glow) {
          lamp.glow.setVisible(true).setAlpha(0.28);
          this.tweens.add({ targets: lamp.glow, alpha: 0.14, yoyo: true, repeat: -1, duration: 700 });
        }
        this.spawnBurst(lamp.x + TS / 2, lamp.y - 50, 0xffe46b);
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
