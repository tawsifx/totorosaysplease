// js/scenes/PacScene.js - Enhanced "Fuchka Chase" Dhaka Arcade Maze
// Features responsive corner turning, crisp fuchka crunch effects, Mishti Doi frightened ghosts, and stage transitions.

import { SceneBase } from "./SceneBase.js";
import { initTexturesForScene } from "../sprites/textures.js";
import { sfx } from "../audio/sfx.js";
import { PC, PR, PAC_T, PAC_W, PAC_H, PAC_OX, PAC_OY, makeMaze, PAC_STAGES } from "../data/pac-config.js";

export class PacScene extends SceneBase {
  constructor() {
    super("PacScene");
  }

  init(data) {
    this.stageIdx = data?.stage || 0;
    this.score = data?.score || 0;
    this.lives = data?.lives !== undefined ? data.lives : 3;
    this.onWin = data?.onWin || (() => {});
    this.eatenFuchka = 0;
    this.totalFuchka = 0;
    this.scaredTimer = 0;
    this.state = "play"; // play, hit, clear, over
    this.particles = [];
  }

  create() {
    this.setupAutoCleanup();
    initTexturesForScene(this);

    const st = PAC_STAGES[this.stageIdx] || PAC_STAGES[0];
    const rawMaze = makeMaze(st.seed).map(r => [...r]);

    // Clear center ghost cage and player starting lane
    for (let x = 7; x <= 11; x++) rawMaze[5][x] = " ";
    rawMaze[4][9] = " ";
    rawMaze[6][9] = " ";
    rawMaze[11][9] = " ";
    rawMaze[11][8] = " ";
    rawMaze[11][10] = " ";
    this.maze = rawMaze.map(r => r.join(""));

    const free = (x, y) => !!this.maze[y] && this.maze[y][x] === " ";
    this.free = free;
    this.px = tx => PAC_OX + tx * PAC_T + PAC_T / 2;
    this.py = ty => PAC_OY + ty * PAC_T + PAC_T / 2;

    // Draw Maze Walls with smooth rounded Dhaka palette
    const wallG = this.add.graphics();
    this.maze.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === "#") {
          const wx = PAC_OX + x * PAC_T + 1, wy = PAC_OY + y * PAC_T + 1;
          wallG.fillStyle(st.wall, 1);
          wallG.fillRoundedRect(wx, wy, PAC_T - 2, PAC_T - 2, 5);
          wallG.lineStyle(1.5, 0x433a57, 0.18);
          wallG.strokeRoundedRect(wx, wy, PAC_T - 2, PAC_T - 2, 5);
        }
      });
    });

    // Collectibles: Fuchkas & Mishti Doi
    this.dots = [];
    this.dois = [];
    const corners = new Set(["1,1", "17,1", "1,11", "17,11"]);

    this.maze.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === " ") {
          // Keep ghost pen and player start clear of dots
          if ((x >= 7 && x <= 11 && y >= 4 && y <= 6) || (x === 9 && y === 11)) return;

          const cx = this.px(x), cy = this.py(y);
          if (corners.has(`${x},${y}`)) {
            const doi = this.add.sprite(cx, cy, "doi").setOrigin(0.5, 0.5);
            // Gentle hovering animation on Mishti Doi
            this.tweens.add({
              targets: doi,
              y: cy - 2,
              yoyo: true,
              repeat: -1,
              duration: 400
            });
            this.dois.push({ sprite: doi, x, y });
          } else {
            const f = this.add.sprite(cx, cy, "fuchka").setOrigin(0.5, 0.5);
            this.dots.push({ sprite: f, x, y });
          }
        }
      });
    });
    this.totalFuchka = this.dots.length;

    // Player (Chibi astronaut girl)
    this.playerTile = { x: 9, y: 11 };
    this.playerPos = { x: this.px(9), y: this.py(11) };
    this.playerDir = [0, 0];
    this.playerNextDir = [0, 0];
    this.playerSpeed = 110;

    this.chibi = this.add.sprite(this.playerPos.x, this.playerPos.y, "chibi", 0).setOrigin(0.5, 0.5);
    this.chibi.play("chibi_idle");

    // Dhaka Enemies (CNG, Rickshaw, Crow)
    const ghostConfigs = [
      { key: "cng", anim: "cng_run", startX: 8, startY: 5, startDir: [-1, 0] },
      { key: "rick", anim: "rick_run", startX: 9, startY: 5, startDir: [0, -1] },
      { key: "crow", anim: "crow_fly", startX: 10, startY: 5, startDir: [1, 0] }
    ];

    this.ghosts = [];
    const stageGhosts = st.ghosts;
    ghostConfigs.forEach(gc => {
      if (!stageGhosts.includes(gc.key)) return;
      const gSprite = this.add.sprite(this.px(gc.startX), this.py(gc.startY), gc.key, 0).setOrigin(0.5, 0.5);
      gSprite.play(gc.anim);
      this.ghosts.push({
        sprite: gSprite,
        key: gc.key,
        anim: gc.anim,
        eaten: false,
        startX: gc.startX,
        startY: gc.startY,
        startDir: gc.startDir,
        tileX: gc.startX,
        tileY: gc.startY,
        x: this.px(gc.startX),
        y: this.py(gc.startY),
        dir: [...gc.startDir],
        speed: st.speed
      });
    });

    // Top HUD
    this.stageText = this.add.text(PAC_OX, 14, `Stage ${this.stageIdx + 1}: ${st.name}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#433a57",
      fontStyle: "bold"
    });

    this.fuchkaText = this.add.text(PAC_W / 2, 14, `Fuchka: 0 / ${this.totalFuchka}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "14px",
      color: "#6e7885",
      fontStyle: "bold"
    }).setOrigin(0.5, 0);

    this.heartSprites = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.sprite(PAC_OX + PC * PAC_T - 18 - i * 28, 22, "heart").setOrigin(0.5, 0.5);
      h.setVisible(i < this.lives);
      this.heartSprites.push(h);
    }

    this.banner = this.add.text(PAC_W / 2, 235, "", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "20px",
      color: "#433a57",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5).setVisible(false);

    // Direction input handler
    const setDir = (dx, dy) => {
      if (this.state === "over") {
        this.scene.restart({ stage: this.stageIdx, score: this.score, lives: 3, onWin: this.onWin });
        return;
      }
      this.playerNextDir = [dx, dy];
    };
    this.setDir = setDir;

    // Keyboard bindings via Phaser
    if (this.input && this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
      this.input.keyboard.on("keydown-LEFT", () => setDir(-1, 0));
      this.input.keyboard.on("keydown-A", () => setDir(-1, 0));
      this.input.keyboard.on("keydown-RIGHT", () => setDir(1, 0));
      this.input.keyboard.on("keydown-D", () => setDir(1, 0));
      this.input.keyboard.on("keydown-UP", () => setDir(0, -1));
      this.input.keyboard.on("keydown-W", () => setDir(0, -1));
      this.input.keyboard.on("keydown-DOWN", () => setDir(0, 1));
      this.input.keyboard.on("keydown-S", () => setDir(0, 1));
    }

    // Window Key Listener via SceneBase
    const onKeyDown = e => {
      if (!this.sys.isActive()) return;
      if (["ArrowLeft", "KeyA"].includes(e.code)) { e.preventDefault(); setDir(-1, 0); }
      else if (["ArrowRight", "KeyD"].includes(e.code)) { e.preventDefault(); setDir(1, 0); }
      else if (["ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); setDir(0, -1); }
      else if (["ArrowDown", "KeyS"].includes(e.code)) { e.preventDefault(); setDir(0, 1); }
      else if (this.state === "over") {
        this.scene.restart({ stage: this.stageIdx, score: this.score, lives: 3, onWin: this.onWin });
      }
    };
    this.addWindowListener("keydown", onKeyDown);

    // Pointer / Touch Swipe Controls
    let touchStartX = 0, touchStartY = 0;
    if (this.input) {
      this.input.on("pointerdown", pointer => {
        touchStartX = pointer.x;
        touchStartY = pointer.y;
        if (this.state === "over") {
          this.scene.restart({ stage: this.stageIdx, score: this.score, lives: 3, onWin: this.onWin });
        }
      });
      this.input.on("pointerup", pointer => {
        const dx = pointer.x - touchStartX, dy = pointer.y - touchStartY;
        if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
          if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
          else setDir(0, dy > 0 ? 1 : -1);
        }
      });
    }
  }

  spawnCrumbs(x, y) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.circle(x, y, Math.random() * 1.5 + 1, 0xf2b452, 0.85);
      const vx = (Math.random() - 0.5) * 60;
      const vy = (Math.random() - 0.5) * 60;
      this.tweens.add({
        targets: p,
        x: x + vx * 0.25,
        y: y + vy * 0.25,
        alpha: 0,
        scale: 0.2,
        duration: 350,
        onComplete: () => p.destroy()
      });
    }
  }

  spawnScorePopup(x, y, text) {
    const t = this.add.text(x, y, text, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "13px",
      color: "#e05378",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: t,
      y: y - 20,
      alpha: 0,
      duration: 550,
      onComplete: () => t.destroy()
    });
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);

    // Mishti Doi powerup frightened countdown
    if (this.scaredTimer > 0) {
      this.scaredTimer -= dt;
      const isWarning = this.scaredTimer < 2.5;
      const freq = isWarning ? 8 : 4;
      const flash = Math.floor(this.scaredTimer * freq) % 2 === 0;

      this.ghosts.forEach(g => {
        if (!g.eaten) {
          const suffix = g.key === "crow" ? "_fly_" : "_run_";
          if (isWarning) {
            const targetAnim = flash ? `${g.key}${suffix}flash` : `${g.key}${suffix}scared`;
            g.sprite.play(targetAnim, true);
            g.sprite.setAlpha(flash ? 1.0 : 0.6);
          } else {
            const targetAnim = flash ? `${g.key}${suffix}scared` : `${g.key}${suffix}flash`;
            g.sprite.play(targetAnim, true);
            g.sprite.setAlpha(flash ? 1.0 : 0.75);
          }
        }
      });

      if (this.scaredTimer <= 0) {
        this.scaredTimer = 0;
        this.ghosts.forEach(g => {
          g.eaten = false;
          g.sprite.setAlpha(1.0);
          g.sprite.play(g.anim, true);
        });
      }
    }

    if (this.state === "play") {
      this.updatePlayer(dt);
      this.updateGhosts(dt);
      this.checkCollisions();
    }
  }

  updatePlayer(dt) {
    const p = this.playerPos;
    const curTileX = Math.round((p.x - PAC_OX - PAC_T / 2) / PAC_T);
    const curTileY = Math.round((p.y - PAC_OY - PAC_T / 2) / PAC_T);
    const centerX = this.px(curTileX);
    const centerY = this.py(curTileY);

    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) this.playerNextDir = [-1, 0];
      else if (this.cursors.right.isDown || this.wasd.right.isDown) this.playerNextDir = [1, 0];
      else if (this.cursors.up.isDown || this.wasd.up.isDown) this.playerNextDir = [0, -1];
      else if (this.cursors.down.isDown || this.wasd.down.isDown) this.playerNextDir = [0, 1];
    }

    // Responsive corner turning with center snapping (up to 14px tolerance)
    const [ndx, ndy] = this.playerNextDir;
    if (ndx !== 0 || ndy !== 0) {
      if (ndx === -this.playerDir[0] && ndy === -this.playerDir[1]) {
        this.playerDir = [ndx, ndy];
        this.playerNextDir = [0, 0];
      } else if (this.playerDir[0] === 0 && this.playerDir[1] === 0) {
        if (this.free(curTileX + ndx, curTileY + ndy)) {
          p.x = centerX;
          p.y = centerY;
          this.playerDir = [ndx, ndy];
          this.playerNextDir = [0, 0];
        }
      } else if (this.playerDir[0] !== 0 && ndy !== 0) {
        if (this.free(curTileX, curTileY + ndy) && Math.abs(p.x - centerX) <= 14) {
          p.x = centerX;
          p.y = centerY;
          this.playerDir = [0, ndy];
          this.playerNextDir = [0, 0];
        }
      } else if (this.playerDir[1] !== 0 && ndx !== 0) {
        if (this.free(curTileX + ndx, curTileY) && Math.abs(p.y - centerY) <= 14) {
          p.x = centerX;
          p.y = centerY;
          this.playerDir = [ndx, 0];
          this.playerNextDir = [0, 0];
        }
      }
    }

    const [pdx, pdy] = this.playerDir;
    if (pdx !== 0) {
      p.y = centerY;
      const step = pdx * this.playerSpeed * dt;
      if (!this.free(curTileX + pdx, curTileY)) {
        if (pdx > 0) {
          p.x = Math.min(p.x + step, centerX);
          if (p.x >= centerX) { p.x = centerX; this.playerDir = [0, 0]; }
        } else {
          p.x = Math.max(p.x + step, centerX);
          if (p.x <= centerX) { p.x = centerX; this.playerDir = [0, 0]; }
        }
      } else {
        p.x += step;
      }
      this.chibi.play("chibi_run", true);
      if (pdx < 0) this.chibi.setFlipX(true);
      else if (pdx > 0) this.chibi.setFlipX(false);
    } else if (pdy !== 0) {
      p.x = centerX;
      const step = pdy * this.playerSpeed * dt;
      if (!this.free(curTileX, curTileY + pdy)) {
        if (pdy > 0) {
          p.y = Math.min(p.y + step, centerY);
          if (p.y >= centerY) { p.y = centerY; this.playerDir = [0, 0]; }
        } else {
          p.y = Math.max(p.y + step, centerY);
          if (p.y <= centerY) { p.y = centerY; this.playerDir = [0, 0]; }
        }
      } else {
        p.y += step;
      }
      this.chibi.play("chibi_run", true);
    } else {
      this.chibi.play("chibi_idle", true);
    }

    this.chibi.x = p.x;
    this.chibi.y = p.y;
    this.playerTile = { x: curTileX, y: curTileY };

    // Munch fuchka
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const d = this.dots[i];
      if (Math.abs(p.x - this.px(d.x)) < 13 && Math.abs(p.y - this.py(d.y)) < 13) {
        this.spawnCrumbs(this.px(d.x), this.py(d.y));
        d.sprite.destroy();
        this.dots.splice(i, 1);
        sfx.munch();
        this.eatenFuchka++;
        this.score += 20;
        this.fuchkaText.setText(`Fuchka: ${this.eatenFuchka} / ${this.totalFuchka}`);

        if (this.dots.length === 0) {
          this.state = "clear";
          sfx.win();
          this.banner.setText(this.stageIdx < 2 ? "Stage Cleared!" : "You found Totoro!").setVisible(true);
          this.time.delayedCall(1600, () => {
            if (this.stageIdx < 2) {
              this.scene.restart({ stage: this.stageIdx + 1, score: this.score, lives: this.lives, onWin: this.onWin });
            } else {
              this.onWin();
            }
          });
        }
        break;
      }
    }

    // Eat Mishti Doi powerup
    for (let i = this.dois.length - 1; i >= 0; i--) {
      const d = this.dois[i];
      if (Math.abs(p.x - this.px(d.x)) < 14 && Math.abs(p.y - this.py(d.y)) < 14) {
        this.spawnScorePopup(this.px(d.x), this.py(d.y), "+100 Mishti Doi!");
        d.sprite.destroy();
        this.dois.splice(i, 1);
        sfx.powerup();
        this.score += 100;
        this.scaredTimer = 7.0;
        this.ghosts.forEach(g => {
          g.eaten = false;
        });
        break;
      }
    }
  }

  updateGhosts(dt) {
    const isScared = this.scaredTimer > 0;
    const allDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    this.ghosts.forEach(g => {
      const isGhostScared = isScared && !g.eaten;
      const speed = isGhostScared ? g.speed * 0.55 : g.speed;
      let step = speed * dt;
      let [gdx, gdy] = g.dir;

      while (step > 0 && (gdx !== 0 || gdy !== 0)) {
        const targetTileX = g.tileX + gdx;
        const targetTileY = g.tileY + gdy;
        const targetX = this.px(targetTileX);
        const targetY = this.py(targetTileY);

        if (gdx !== 0) g.y = this.py(g.tileY);
        else if (gdy !== 0) g.x = this.px(g.tileX);

        const dist = Math.abs((targetX - g.x) * gdx + (targetY - g.y) * gdy);

        if (step < dist) {
          g.x += gdx * step;
          g.y += gdy * step;
          step = 0;
        } else {
          g.x = targetX;
          g.y = targetY;
          g.tileX = targetTileX;
          g.tileY = targetTileY;
          step -= dist;

          let targetX_tile = this.playerTile.x;
          let targetY_tile = this.playerTile.y;
          // Rickshaw ambushes by leading player
          if (g.key === "rick" && !isGhostScared) {
            targetX_tile += this.playerDir[0] * 2;
            targetY_tile += this.playerDir[1] * 2;
          }

          const valid = allDirs.filter(([cdx, cdy]) => {
            if (cdx === -gdx && cdy === -gdy) return false;
            return this.free(g.tileX + cdx, g.tileY + cdy);
          });

          if (valid.length > 0) {
            valid.sort((a, b) => {
              const da = Math.abs(g.tileX + a[0] - targetX_tile) + Math.abs(g.tileY + a[1] - targetY_tile);
              const db = Math.abs(g.tileX + b[0] - targetX_tile) + Math.abs(g.tileY + b[1] - targetY_tile);
              return isGhostScared ? db - da : da - db;
            });
            const randChance = isGhostScared ? 0.05 : (g.key === "crow" ? 0.35 : 0.15);
            g.dir = Math.random() < randChance ? valid[Math.floor(Math.random() * valid.length)] : valid[0];
          } else if (this.free(g.tileX - gdx, g.tileY - gdy)) {
            g.dir = [-gdx, -gdy];
          } else {
            g.dir = [0, 0];
          }
          [gdx, gdy] = g.dir;
        }
      }

      g.sprite.x = g.x;
      g.sprite.y = g.y;
      if (g.dir[0] < 0) g.sprite.setFlipX(true);
      else if (g.dir[0] > 0) g.sprite.setFlipX(false);
    });
  }

  checkCollisions() {
    const isScared = this.scaredTimer > 0;
    this.ghosts.forEach(g => {
      if (Math.abs(this.playerPos.x - g.x) < 16 && Math.abs(this.playerPos.y - g.y) < 16) {
        if (isScared && !g.eaten) {
          sfx.ghost();
          g.eaten = true;
          this.score += 200;
          this.spawnScorePopup(g.x, g.y, "+200");
          g.x = this.px(g.startX);
          g.y = this.py(g.startY);
          g.tileX = g.startX;
          g.tileY = g.startY;
          g.dir = [...g.startDir];
          g.sprite.x = g.x;
          g.sprite.y = g.y;
          g.sprite.setAlpha(1.0);
          g.sprite.play(g.anim, true);
        } else if (!isScared || g.eaten) {
          sfx.hit();
          this.state = "hit";
          this.chibi.play("chibi_hit");
          this.lives--;
          for (let i = 0; i < 3; i++) {
            this.heartSprites[i].setVisible(i < this.lives);
          }
          if (this.lives > 0) {
            this.time.delayedCall(900, () => {
              this.scaredTimer = 0;
              this.playerPos = { x: this.px(9), y: this.py(11) };
              this.playerDir = [0, 0];
              this.playerNextDir = [0, 0];
              this.chibi.play("chibi_idle");
              this.ghosts.forEach(gh => {
                gh.eaten = false;
                gh.x = this.px(gh.startX);
                gh.y = this.py(gh.startY);
                gh.tileX = gh.startX;
                gh.tileY = gh.startY;
                gh.dir = [...gh.startDir];
                gh.sprite.x = gh.x;
                gh.sprite.y = gh.y;
                gh.sprite.setAlpha(1.0);
                gh.sprite.play(gh.anim, true);
              });
              this.state = "play";
            });
          } else {
            this.state = "over";
            this.banner.setText("Out of lives! Press any key or tap to retry").setVisible(true);
          }
        }
      }
    });
  }
}
