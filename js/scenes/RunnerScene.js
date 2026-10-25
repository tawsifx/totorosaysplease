// js/scenes/RunnerScene.js - Enhanced Infinite Runner Mini-Game ("Run to Totoro")
// Includes parallax Dhaka skyline, falling Krishnachura petals, chai collectibles, and smooth jump physics.

import { SceneBase } from "./SceneBase.js";
import { initTexturesForScene } from "../sprites/textures.js";
import { sfx } from "../audio/sfx.js";
import { RUN_W, RUN_H, RUN_GROUND, RUN_GOAL, RUN_PHYSICS } from "../data/runner-config.js";
import { Runner3DFX } from "../3d/game3d.js";

export class RunnerScene extends SceneBase {
  constructor() {
    super("RunnerScene");
  }

  init(data) {
    this.onWin = data?.onWin || (() => {});
    this.dist = 0;
    this.score = 0;
    this.speed = RUN_PHYSICS.initialSpeed;
    this.jumpVel = 0;
    this.jumpHeld = false;
    this.state = "running"; // running, hit, won
    this.nextObs = 600;
    this.nextItem = 350;
    this.totoro = null;
    this.heartTimer = 0;
    this.petalTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;

    this.obsList = [];
    this.itemList = [];
    this.heartList = [];
    this.petalList = [];
    this.floatingTexts = [];
  }

  create() {
    this.setupAutoCleanup();
    initTexturesForScene(this);
    this.fx3d = new Runner3DFX(this);

    // Distant Dhaka Skyline Parallax
    this.skyline = this.add.graphics();
    this.renderSkyline();

    // Ground graphic layers
    const g = this.add.graphics();
    // Sidewalk curb
    g.fillStyle(0xd5cec7, 1);
    g.fillRect(0, RUN_GROUND - 2, RUN_W, 2);
    // Road surface
    g.fillStyle(0xe0d8d1, 1);
    g.fillRect(0, RUN_GROUND, RUN_W, 3);
    // Ground foundation
    g.fillStyle(0xf4f0ec, 1);
    g.fillRect(0, RUN_GROUND + 3, RUN_W, RUN_H - RUN_GROUND - 3);

    // Decorative Road Markings (intermittent white dashed lines)
    this.roadMarks = [];
    for (let x = 0; x < RUN_W + 120; x += 90) {
      const rect = this.add.rectangle(x, RUN_GROUND + 22, 44, 4, 0xffffff, 0.6);
      this.roadMarks.push(rect);
    }

    // Parallax Clouds
    this.clouds = [
      { sprite: this.add.sprite(80, 35, "cloud").setAlpha(0.85), sp: 18 },
      { sprite: this.add.sprite(360, 65, "cloud").setAlpha(0.7), sp: 12 },
      { sprite: this.add.sprite(680, 25, "cloud").setAlpha(0.8), sp: 22 }
    ];

    // 3D Perspective Ground Shadow under Player Astro
    this.astroShadow = this.add.ellipse(110, RUN_GROUND + 1, 32, 6, 0x4a403b, 0.28);

    // Player Astro (raincoat girl)
    this.astro = this.add.sprite(110, RUN_GROUND, "astro", 0).setOrigin(0.5, 1);
    this.astro.play("astro_run");

    // Progress Bar (Dhaka Pink Theme)
    const BAR_W = 220, BAR_X = 24, BAR_Y = 22;
    const barBg = this.add.graphics();
    barBg.fillStyle(0xe6e0da, 1);
    barBg.fillRoundedRect(BAR_X, BAR_Y, BAR_W, 8, 4);

    this.fillBar = this.add.graphics();

    this.pctText = this.add.text(BAR_X + BAR_W + 12, BAR_Y - 4, "0%", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "13px",
      color: "#8c827c",
      fontStyle: "bold"
    });

    this.scoreText = this.add.text(RUN_W - 28, BAR_Y - 4, "Score: 0", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "13px",
      color: "#e05378",
      fontStyle: "bold"
    }).setOrigin(1, 0);

    this.msgText = this.add.text(RUN_W / 2, 70, "", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "19px",
      color: "#645a56",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);

    // Jump Logic
    this.doJump = () => {
      if (this.state === "hit") {
        this.state = "running";
        this.jumpVel = 0;
        this.astro.y = RUN_GROUND;
        this.astro.play("astro_run");
        this.msgText.setText("");
        // Clear obstacles immediately in front of the player
        this.obsList.forEach(o => {
          if (o.sprite && o.sprite.x < 380) o.sprite.destroy();
        });
        this.obsList = this.obsList.filter(o => o.sprite && o.sprite.active && o.sprite.x >= 380);
        return;
      }
      if (this.state === "running" && (this.astro.y >= RUN_GROUND || this.coyoteTimer > 0)) {
        this.jumpVel = RUN_PHYSICS.jumpImpulse;
        this.coyoteTimer = 0;
        sfx.jump();
        this.astro.play("astro_jump");
      }
    };

    // Keyboard bindings via Phaser
    if (this.input && this.input.keyboard) {
      const keys = ["SPACE", "UP", "W"];
      keys.forEach(k => {
        this.input.keyboard.on(`keydown-${k}`, e => {
          e.preventDefault();
          this.jumpHeld = true;
          this.doJump();
        });
        this.input.keyboard.on(`keyup-${k}`, () => {
          this.jumpHeld = false;
        });
      });
    }

    // Safe Window Event Listeners via SceneBase
    const onKeyDown = e => {
      if (!this.sys.isActive()) return;
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        this.jumpHeld = true;
        if (!e.repeat) this.doJump();
      }
    };
    const onKeyUp = e => {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        this.jumpHeld = false;
      }
    };
    this.addWindowListener("keydown", onKeyDown);
    this.addWindowListener("keyup", onKeyUp);

    // Pointer / Tap Controls
    if (this.input) {
      this.input.on("pointerdown", () => {
        this.jumpHeld = true;
        this.doJump();
      });
      this.input.on("pointerup", () => {
        this.jumpHeld = false;
      });
    }
  }

  renderSkyline() {
    this.skyline.clear();
    this.skyline.fillStyle(0xf0ece6, 0.7);
    // Subtle Curzon Hall dome and Dhaka rooftops in the background
    const buildings = [
      [20, 160, 45, 90],
      [75, 140, 60, 110],
      [145, 170, 50, 80],
      [220, 130, 70, 120],
      [310, 155, 55, 95],
      [380, 145, 45, 105],
      [440, 135, 75, 115],
      [530, 160, 50, 90],
      [600, 140, 65, 110],
      [685, 150, 55, 100],
      [755, 130, 60, 120]
    ];
    buildings.forEach(([x, y, w, h]) => {
      this.skyline.fillRect(x, y, w, h);
    });
  }

  spawnPetal() {
    const p = this.add.circle(RUN_W + 10, Math.random() * (RUN_GROUND - 40), Math.random() * 2 + 1.5, 0xf25c84, 0.75);
    this.petalList.push({
      circle: p,
      vx: -(Math.random() * 60 + 90),
      vy: Math.random() * 20 + 10,
      phase: Math.random() * 6,
      life: 1.0
    });
  }

  spawnItem() {
    const isChai = Math.random() < 0.45;
    const key = isChai ? "cha_cup" : "coin";
    const y = RUN_GROUND - 55 - Math.random() * 45;
    const item = this.add.sprite(RUN_W + 20, y, key).setOrigin(0.5, 0.5);
    this.itemList.push({
      sprite: item,
      key,
      baseY: y,
      phase: Math.random() * 6,
      points: isChai ? 250 : 100
    });
  }

  spawnObstacle() {
    const isSpike = Math.random() < 0.28;
    const isBug = !isSpike && Math.random() < 0.26;
    const isRocks = !isSpike && !isBug && Math.random() < 0.32;

    if (isBug) {
      const by = RUN_GROUND - 75 + Math.random() * 20;
      const bug = this.add.sprite(RUN_W + 30, by, "bug", 0).setOrigin(0.5, 0.5);
      bug.play("bug_fly");
      this.obsList.push({ sprite: bug, isBug: true, baseY: by, phase: Math.random() * 6, hitW: 22, hitH: 16 });
    } else {
      const tag = isSpike ? "spike" : isRocks ? "rocks" : "rock";
      const hitW = isRocks ? 60 : isSpike ? 24 : 30;
      const hitH = isSpike ? 26 : 22;
      const shadowW = isRocks ? 54 : isSpike ? 22 : 28;
      const shadow = this.add.ellipse(RUN_W + 30, RUN_GROUND + 1, shadowW, 6, 0x4a403b, 0.22);
      const obs = this.add.sprite(RUN_W + 30, RUN_GROUND, tag).setOrigin(0.5, 1);
      this.obsList.push({ sprite: obs, shadow, isBug: false, hitW, hitH });
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
      duration: 650,
      onComplete: () => t.destroy()
    });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);

    // Parallax clouds
    this.clouds.forEach(c => {
      c.sprite.x -= (c.sp + (this.state === "running" ? this.speed * 0.08 : 0)) * dt;
      if (c.sprite.x < -80) c.sprite.x = RUN_W + 40;
    });

    // Road dash marks parallax
    if (this.state === "running") {
      this.roadMarks.forEach(rm => {
        rm.x -= this.speed * dt;
        if (rm.x < -50) rm.x += (RUN_W + 120);
      });
    }

    // Drifting Krishnachura Petals
    this.petalTimer -= dt;
    if (this.petalTimer <= 0) {
      this.petalTimer = 0.65;
      this.spawnPetal();
    }
    for (let i = this.petalList.length - 1; i >= 0; i--) {
      const pt = this.petalList[i];
      pt.circle.x += pt.vx * dt;
      pt.circle.y += (pt.vy + Math.sin(time * 0.003 + pt.phase) * 12) * dt;
      if (pt.circle.x < -20 || pt.circle.y > RUN_GROUND) {
        pt.circle.destroy();
        this.petalList.splice(i, 1);
      }
    }

    if (this.state === "running") {
      this.dist += this.speed * dt;
      this.speed = Math.min(RUN_PHYSICS.maxSpeed, RUN_PHYSICS.initialSpeed + (this.dist / RUN_GOAL) * 110);

      // Coyote time calculation
      if (this.astro.y >= RUN_GROUND) {
        this.coyoteTimer = 0.12;
      } else {
        this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      }

      // Variable jump gravity
      if (this.astro.y < RUN_GROUND || this.jumpVel < 0) {
        const grav = (this.jumpVel < 0 && this.jumpHeld) ? RUN_PHYSICS.gravityHolding : RUN_PHYSICS.gravityFalling;
        this.jumpVel += grav * dt;
        this.astro.y += this.jumpVel * dt;
        if (this.astro.y >= RUN_GROUND) {
          this.astro.y = RUN_GROUND;
          if (this.jumpVel > 120) sfx.land();
          this.jumpVel = 0;
          this.astro.play("astro_run");
        }
      }

      // Update 3D perspective contact shadow under player Astro
      if (this.astroShadow) {
        const jumpHeight = Math.max(0, RUN_GROUND - this.astro.y);
        const shadowScale = Math.max(0.35, 1 - jumpHeight / 150);
        this.astroShadow.x = this.astro.x;
        this.astroShadow.setScale(shadowScale, shadowScale);
        this.astroShadow.setAlpha(Math.max(0.06, 0.28 * (1 - jumpHeight / 170)));
      }

      // Collectibles spawning
      this.nextItem -= this.speed * dt;
      if (this.nextItem <= 0 && this.dist < RUN_GOAL - 500) {
        this.spawnItem();
        this.nextItem = 340 + Math.random() * 280;
      }

      // Obstacles spawning
      if (this.dist < RUN_GOAL - 600) {
        this.nextObs -= this.speed * dt;
        if (this.nextObs <= 0) {
          this.spawnObstacle();
          this.nextObs = 320 + Math.random() * 260 + (RUN_PHYSICS.maxSpeed - this.speed) * 0.7;
        }
      } else if (!this.totoro) {
        this.totoroShadow = this.add.ellipse(RUN_W + 60, RUN_GROUND + 2, 74, 12, 0x4a403b, 0.26);
        this.totoro = this.add.sprite(RUN_W + 60, RUN_GROUND, "totoro").setOrigin(0.5, 1);
      }

      // Update & check collectibles with 3D Y-axis spinning
      for (let i = this.itemList.length - 1; i >= 0; i--) {
        const it = this.itemList[i];
        it.sprite.x -= this.speed * dt;
        it.sprite.y = it.baseY + Math.sin(time * 0.006 + it.phase) * 6;
        it.sprite.scaleX = Math.cos(time * 0.006 + it.phase); // 3D Y-axis perspective rotation

        const astroCenterX = this.astro.x;
        const astroCenterY = this.astro.y - 35;
        if (Math.abs(it.sprite.x - astroCenterX) < 28 && Math.abs(it.sprite.y - astroCenterY) < 36) {
          if (it.key === "cha_cup") {
            sfx.powerup();
            this.spawnScorePopup(it.sprite.x, it.sprite.y, "+250 Cha!", "#df7f28");
          } else {
            sfx.coin();
            this.spawnScorePopup(it.sprite.x, it.sprite.y, "+100", "#f7cb45");
          }
          this.score += it.points;
          this.scoreText.setText("Score: " + this.score);
          it.sprite.destroy();
          this.itemList.splice(i, 1);
        } else if (it.sprite.x < -40) {
          it.sprite.destroy();
          this.itemList.splice(i, 1);
        }
      }

      // Update & check obstacles and contact shadows
      for (let i = this.obsList.length - 1; i >= 0; i--) {
        const o = this.obsList[i];
        o.sprite.x -= this.speed * dt;
        if (o.shadow) o.shadow.x = o.sprite.x;
        if (o.isBug) o.sprite.y = o.baseY + Math.sin(time * 0.007 + o.phase) * 14;

        const obsCenterY = o.isBug ? o.sprite.y : o.sprite.y - o.hitH / 2;
        const astroCenterY = this.astro.y - 35;
        if (
          Math.abs(o.sprite.x - this.astro.x) < (o.hitW + 16) / 2 &&
          Math.abs(obsCenterY - astroCenterY) < (o.hitH + 46) / 2
        ) {
          sfx.hit();
          this.state = "hit";
          this.astro.play("astro_hit");
          this.msgText.setText("Oops! Press jump to try again");
        }

        if (o.sprite.x < -80) {
          if (o.shadow) o.shadow.destroy();
          o.sprite.destroy();
          this.obsList.splice(i, 1);
        }
      }

      // Totoro encounter & victory sequence
      if (this.totoro) {
        this.totoro.x -= this.speed * dt;
        if (this.totoroShadow) this.totoroShadow.x = this.totoro.x;
        if (this.totoro.x <= this.astro.x + 85) {
          this.state = "won";
          this.astro.play("astro_idle");
          sfx.win();
          this.msgText.setText("You found Totoro! 💕");
          for (let i = 0; i < 20; i++) {
            const h = this.add.sprite(this.totoro.x + (Math.random() * 110 - 20), this.totoro.y - 60, "heart");
            this.heartList.push({ sprite: h, ox: h.x, phase: Math.random() * 6, life: 1.6 });
          }
          this.time.delayedCall(1500, () => this.onWin());
        }
      }
    } else if (this.state === "won") {
      this.heartTimer -= dt;
      if (this.heartTimer <= 0 && this.totoro) {
        this.heartTimer = 0.16;
        const h = this.add.sprite(this.totoro.x + (Math.random() * 100 - 10), this.totoro.y - 60, "heart");
        this.heartList.push({ sprite: h, ox: h.x, phase: Math.random() * 6, life: 1.6 });
      }

      for (let i = this.heartList.length - 1; i >= 0; i--) {
        const h = this.heartList[i];
        h.sprite.y -= 55 * dt;
        h.sprite.x = h.ox + Math.sin(time * 0.004 + h.phase) * 8;
        h.life -= dt * 0.55;
        h.sprite.setAlpha(Math.max(0, h.life));
        if (h.life <= 0) {
          h.sprite.destroy();
          this.heartList.splice(i, 1);
        }
      }
    }

    const p = this.state === "won" ? 1 : Math.min(1, this.dist / RUN_GOAL);
    this.fillBar.clear();
    this.fillBar.fillStyle(0xe05378, 1);
    this.fillBar.fillRoundedRect(24, 22, Math.max(1, p * 220), 8, 4);
    this.pctText.setText(Math.floor(p * 100) + "%");

    if (this.fx3d) {
      this.fx3d.sync(time, dt);
    }
  }
}
