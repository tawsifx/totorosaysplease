// js/game.js - Unified mini-games suite ("Run to Totoro", "Fuchka Chase", "Run to the Bus Stop")
// Built with Phaser 3 modern framework, procedural pixel-art sprites, and custom Web Audio synthesizer.

/* ==========================================================================
   1. Unified Web Audio Synthesizer & Sound Engine
   ========================================================================== */
let audioCtx = null;
const lastPlayed = {};

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function attachUnlockListeners(targetWin) {
  if (!targetWin || targetWin._totoroAudioUnlocked) return;
  targetWin._totoroAudioUnlocked = true;
  const unlock = () => { getAudioContext(); };
  ["pointerdown", "touchstart", "keydown"].forEach(ev => {
    targetWin.addEventListener(ev, unlock, { passive: true });
  });
}
if (typeof window !== "undefined") attachUnlockListeners(window);

function canPlay(name, cooldownMs = 35) {
  const now = performance.now();
  if (now - (lastPlayed[name] || 0) < cooldownMs) return false;
  lastPlayed[name] = now;
  return true;
}

function playTone(freqStart, freqEnd, type, duration, volume = 0.11, delay = 0) {
  const c = getAudioContext();
  if (!c) return;
  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  if (freqEnd && freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(12, freqEnd), start + duration);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(start);
  osc.stop(start + duration + 0.01);
}

function playNoise(duration, volume = 0.14) {
  const c = getAudioContext();
  if (!c) return;
  const now = c.currentTime;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const noise = c.createBufferSource();
  noise.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.linearRampToValueAtTime(110, now + duration);

  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  noise.start(now);
}

const sfx = {
  jump() {
    if (!canPlay("jump", 80)) return;
    playTone(190, 590, "square", 0.13, 0.08);
  },
  land() {
    if (!canPlay("land", 100)) return;
    playTone(120, 65, "triangle", 0.05, 0.06);
  },
  coin() {
    if (!canPlay("coin", 40)) return;
    playTone(987.77, 1318.51, "sine", 0.14, 0.12);
  },
  munch() {
    if (!canPlay("munch", 40)) return;
    playTone(480, 240, "triangle", 0.06, 0.09);
  },
  powerup() {
    if (!canPlay("powerup", 180)) return;
    [261.63, 329.63, 392.0, 523.25].forEach((f, i) => {
      playTone(f, f * 1.04, "triangle", 0.12, 0.11, i * 0.06);
    });
  },
  ghost() {
    if (!canPlay("ghost", 200)) return;
    playTone(220, 880, "sine", 0.28, 0.15);
  },
  stomp() {
    if (!canPlay("stomp", 70)) return;
    playNoise(0.09, 0.16);
    playTone(180, 60, "square", 0.08, 0.1);
  },
  bump() {
    if (!canPlay("bump", 70)) return;
    playTone(140, 75, "triangle", 0.07, 0.13);
  },
  hit() {
    if (!canPlay("hit", 250)) return;
    playNoise(0.18, 0.18);
    playTone(190, 52, "sawtooth", 0.22, 0.12);
  },
  win() {
    if (!canPlay("win", 600)) return;
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      playTone(f, f, "triangle", 0.22, 0.13, i * 0.085);
    });
  }
};

/* ==========================================================================
   2. Procedural Pixel-Art Sprite Builder & Sprites
   ========================================================================== */
function makeSprite(w, h, S, draw) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  const a = {
    px: (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
    rect: (x, y, rw, rh, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh)); },
    ell: (cx, cy, rx, ry, col) => {
      g.fillStyle = col;
      const minX = Math.max(0, Math.floor(cx - rx)), maxX = Math.min(w - 1, Math.ceil(cx + rx));
      const minY = Math.max(0, Math.floor(cy - ry)), maxY = Math.min(h - 1, Math.ceil(cy + ry));
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1);
      }
    },
    tri: (p, q, r, col) => {
      g.fillStyle = col;
      const minX = Math.max(0, Math.floor(Math.min(p[0], q[0], r[0]))), maxX = Math.min(w - 1, Math.ceil(Math.max(p[0], q[0], r[0])));
      const minY = Math.max(0, Math.floor(Math.min(p[1], q[1], r[1]))), maxY = Math.min(h - 1, Math.ceil(Math.max(p[1], q[1], r[1])));
      const s = (A, B, C) => (A[0] - C[0]) * (B[1] - C[1]) - (B[0] - C[0]) * (A[1] - C[1]);
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const P = [x + 0.5, y + 0.5], d1 = s(P, p, q), d2 = s(P, q, r), d3 = s(P, r, p);
        if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) g.fillRect(x, y, 1, 1);
      }
    },
    line: (x0, y0, x1, y1, col) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i++) a.px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col);
    },
    at: (ox, fn) => { g.save(); g.translate(ox, 0); fn(); g.restore(); },
    outline: (col, sliceW = w) => {
      const d = g.getImageData(0, 0, w, h).data;
      const A = (x, y, refX = x) =>
        x >= 0 && y >= 0 && x < w && y < h &&
        Math.floor(x / sliceW) === Math.floor(refX / sliceW) &&
        d[(y * w + x) * 4 + 3] > 0;
      g.fillStyle = col;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
        if (!A(x, y) && (A(x - 1, y, x) || A(x + 1, y, x) || A(x, y - 1, x) || A(x, y + 1, x))) g.fillRect(x, y, 1, 1);
    }
  };
  draw(a);
  const o = document.createElement("canvas"); o.width = w * S; o.height = h * S;
  const og = o.getContext("2d"); og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, o.width, o.height);
  return o;
}

const OUT = "#6e7885", WHITE = "#ffffff";
const SK = "#ffe0c8", SK_SHD = "#ebbfa0", HAIR = "#3d2522", HAIR_HI = "#5c3b36";
const RED = "#e64961", RED_SHD = "#bd2d45", RED_HI = "#ff8597";
const YEL = "#f7cb45", YEL_SHD = "#df9e26", ORG = "#e86325", BOOT = "#47a8bd", BOOT_HI = "#7fd4e6", EYE_DARK = "#241d1d";
const SUIT = "#f7f4fa", SUIT_SHD = "#dfd7eb", PINK = "#e87ea1", PINK_DARK = "#c45b7d";
const VISOR = "#3d354b", VISOR_GLOW = "#f4a9c4", BP = "#b8c6d9", BP_SHD = "#8fa1b8";

let MASTER_SPRITES = null;

function buildMasterSprites() {
  if (MASTER_SPRITES || typeof document === "undefined") return MASTER_SPRITES;

  const astroCanvas = makeSprite(88, 29, 3, a => {
    const poses = [
      { legs: [[8, 24, 2], [12, 25, 2]], bob: 0 },
      { legs: [[7, 25, 1], [12, 24, 2]], bob: -1 },
      { legs: [[7, 23, 2], [13, 23, 2]], bob: -1 },
      { legs: [[8, 25, 2], [12, 25, 2]], bob: 0 }
    ];
    poses.forEach((p, i) => a.at(i * 22, () => {
      const by = p.bob;
      a.line(15, 7 + by, 15, 19 + by, "#78492a");
      a.px(14, 19 + by, "#78492a");
      a.rect(10, Math.max(1, 1 + by), 2, 2, "#f7cb45");
      a.ell(11, 5.5 + by, 9.2, 3.8, RED_SHD);
      a.ell(11, 5 + by, 8.8, 3.3, RED);
      a.line(6, 3.5 + by, 9, 2.5 + by, RED_HI);
      a.line(5, 4.5 + by, 7, 3.5 + by, WHITE);
      [3, 6, 9, 12, 15, 18].forEach(x => { a.px(x, 8 + by, RED_SHD); a.px(x + 1, 7 + by, RED); });
      a.ell(5.5, (i === 1 ? 14 : 13) + by, 2, 3, HAIR);
      a.rect(6, 10 + by, 2, 2, "#ff6b8b");
      a.ell(10.2, 12 + by, 4.4, 4, HAIR);
      a.line(8, 9 + by, 11, 9 + by, HAIR_HI);
      a.ell(12.2, 13 + by, 3.1, 3, SK_SHD);
      a.ell(12, 12.8 + by, 2.8, 2.8, SK);
      a.rect(9, 10 + by, 2, 4, HAIR);
      a.rect(10, 10 + by, 3, 2, HAIR);
      if (i === 3) {
        [[12, 12], [14, 12], [13, 13], [12, 14], [14, 14]].forEach(([x, y]) => a.px(x, y + by, EYE_DARK));
      } else {
        a.rect(13, 12 + by, 1, 2, EYE_DARK);
        a.px(13, 12 + by, WHITE);
        a.px(12, 14 + by, "#f5939c");
        a.px(14, 14 + by, "#d9756c");
      }
      a.rect(8, 16 + by, 6, 5, YEL);
      a.rect(8, 16 + by, 2, 5, YEL_SHD);
      a.rect(7, 20 + by, 8, 2, YEL);
      a.rect(6, 22 + by, 10, 2, ORG);
      a.rect(7, 21 + by, 8, 1, YEL_SHD);
      [7, 10, 13].forEach(x => a.line(x, 18 + by, x, 22 + by, YEL_SHD));
      a.rect(11, 17 + by, 4, 2, YEL);
      a.rect(14, 17 + by, 2, 2, SK);
      p.legs.forEach(([lx, ly, lh]) => {
        a.rect(lx, ly + by, 2, lh, SK_SHD);
        a.rect(lx - 1, ly + lh + by, 4, 2, BOOT);
        a.px(lx, ly + lh + by, BOOT_HI);
      });
    }));
    a.outline("#4a3232", 22);
  });

  const totoroCanvas = makeSprite(44, 49, 3, a => {
    const BODY = "#737265", SHADE = "#57564b", HI = "#8c8b7d";
    const CREAM = "#f2ebd4", CREAM_SHD = "#dcd2b4", ARCH = "#787562";
    const EYEW = "#ffffff", BLK = "#21211b", PAD = "#a3b5c4", EDGE = "#2b2b23";
    a.tri([9, 13], [8, 1], [18, 11], SHADE); a.tri([35, 13], [36, 1], [26, 11], SHADE);
    a.tri([10, 12], [9, 2], [17, 11], BODY); a.tri([34, 12], [35, 2], [27, 11], BODY);
    a.ell(22, 30, 17.5, 17, SHADE);
    a.ell(21.5, 29.5, 16.5, 16.2, BODY);
    a.ell(22, 17, 13, 9, BODY);
    a.ell(19, 13, 7, 3.5, HI);
    a.ell(22, 8, 4.5, 2, "#5ca37d");
    a.ell(22, 7.5, 3.5, 1.4, "#86d4aa");
    a.line(22, 7, 23, 4, "#3e7557");
    a.ell(6, 31, 3.2, 8.5, SHADE); a.ell(38, 31, 3.2, 8.5, SHADE);
    a.ell(6.5, 30.5, 2.5, 7.5, BODY); a.ell(37.5, 30.5, 2.5, 7.5, BODY);
    a.ell(22, 34, 12.5, 12, CREAM_SHD);
    a.ell(21.7, 33.5, 11.5, 11.2, CREAM);
    [[16, 26], [22, 24], [28, 26], [13, 32], [20, 31], [27, 32], [31, 33]].forEach(([x, y]) =>
      [[-1, 0], [0, 0], [1, 0], [-2, 1], [2, 1], [-3, 2], [3, 2]].forEach(([dx, dy]) => a.px(x + dx, y + dy, ARCH)));
    a.ell(14, 44.5, 5, 3.2, SHADE); a.ell(30, 44.5, 5, 3.2, SHADE);
    [[11, 46], [13, 46], [15, 46], [29, 46], [31, 46], [33, 46]].forEach(([x, y]) => a.px(x, y, CREAM));
    [[14, 45], [30, 45]].forEach(([x, y]) => a.px(x, y, PAD));
    a.ell(13.5, 16, 2.8, 2.8, EYEW); a.ell(30.5, 16, 2.8, 2.8, EYEW);
    a.rect(13, 15, 2, 2, BLK); a.rect(30, 15, 2, 2, BLK);
    a.px(13, 15, EYEW); a.px(30, 15, EYEW);
    a.tri([20, 16], [24, 16], [22, 18], BLK);
    a.line(20, 20, 24, 20, BLK);
    a.outline(EDGE);
    [[9, 18, 0, 16], [9, 20, 0, 20], [9, 22, 1, 24], [35, 18, 43, 16], [35, 20, 43, 20], [35, 22, 42, 24]]
      .forEach(([x0, y0, x1, y1]) => a.line(x0, y0, x1, y1, "#3a3a30"));
  });

  const rockCanvas = makeSprite(14, 11, 3, a => {
    a.ell(7, 6.5, 6, 3.8, "#949ea8");
    a.ell(6.8, 5.8, 5.2, 3.2, "#b4bdc6");
    a.ell(5.5, 4.8, 3, 1.8, "#d5dbe1");
    a.rect(5, 3, 4, 1, "#7ab88a");
    a.px(6, 2, "#9be0ad");
    a.outline(OUT);
  });

  const rocksCanvas = makeSprite(30, 11, 3, a => {
    a.ell(7, 6.5, 6, 3.8, "#949ea8");
    a.ell(6.8, 5.8, 5.2, 3.2, "#b4bdc6");
    a.ell(5.5, 4.8, 2.8, 1.6, "#d5dbe1");
    a.rect(5, 3, 3, 1, "#7ab88a");
    a.ell(20, 6.5, 9, 4, "#949ea8");
    a.ell(19.5, 5.5, 8, 3.5, "#b4bdc6");
    a.ell(18.5, 4.5, 4, 2, "#d5dbe1");
    a.rect(17, 3, 5, 1, "#7ab88a");
    a.px(19, 2, "#9be0ad");
    a.outline(OUT);
  });

  const spikeCanvas = makeSprite(13, 12, 3, a => {
    a.tri([6, 1], [1, 11], [11, 11], "#8a96a3");
    a.tri([6, 2], [3, 10], [9, 10], "#abb5bf");
    a.line(6, 2, 4, 10, "#d5dbe1");
    a.outline(OUT);
  });

  const bugCanvas = makeSprite(26, 11, 3, a => {
    [0, 13].forEach((ox, i) => a.at(ox, () => {
      a.ell(6, 6, 3.2, 3.8, "#2d2426");
      a.ell(6, 5.5, 2.5, 3, "#423438");
      a.ell(4, 3, 1.2, 1.2, "#ffffff"); a.px(4, 3, "#2d2426");
      a.ell(8, 3, 1.2, 1.2, "#ffffff"); a.px(8, 3, "#2d2426");
      if (i === 0) {
        a.ell(2.5, 4, 2.5, 1.5, "#f4a9c0");
        a.ell(9.5, 4, 2.5, 1.5, "#f4a9c0");
      } else {
        a.ell(2.5, 2, 2.2, 2.5, "#f4a9c0");
        a.ell(9.5, 2, 2.2, 2.5, "#f4a9c0");
      }
    }));
    a.outline("#1f1719", 13);
  });

  const heartCanvas = makeSprite(9, 8, 3, a => {
    a.tri([0, 2], [4, 6], [4, 2], RED);
    a.tri([4, 2], [4, 6], [8, 2], RED);
    a.ell(2, 2, 2, 1.5, RED);
    a.ell(6, 2, 2, 1.5, RED);
    a.px(2, 1, "#ff9ebb");
    a.outline("#8a2336");
  });

  const cloudCanvas = makeSprite(22, 10, 3, a => {
    a.ell(7, 6.5, 5, 2.8, "#f0ebe6");
    a.ell(15, 6.5, 5, 2.8, "#f0ebe6");
    a.ell(11, 5.5, 6, 3.8, "#f0ebe6");
    a.ell(7, 5.8, 4.6, 2.5, WHITE);
    a.ell(15, 5.8, 4.6, 2.5, WHITE);
    a.ell(11, 4.6, 5.5, 3.4, WHITE);
    a.outline("#ded6ce");
  });

  const chibiCanvas = makeSprite(64, 24, 2, a => {
    const poses = [
      { legs: [[6, 19, 2], [10, 19, 2]], armY: 14, bob: 0 },
      { legs: [[5, 19, 1], [10, 18, 2]], armY: 13, bob: -1 },
      { legs: [[5, 18, 2], [11, 17, 2]], armY: 12, bob: -1 },
      { legs: [[6, 19, 2], [10, 19, 2]], armY: 13, bob: 0 }
    ];
    poses.forEach((p, i) => a.at(i * 16, () => {
      const by = p.bob;
      a.rect(2, 12 + by, 3, 6, BP);
      a.rect(2, 16 + by, 3, 2, BP_SHD);
      a.px(3, 13 + by, WHITE);
      a.rect(5, 12 + by, 7, 7, SUIT);
      a.rect(5, 12 + by, 2, 7, SUIT_SHD);
      a.rect(5, 17 + by, 7, 1, PINK_DARK);
      a.rect(6, 17 + by, 5, 1, PINK);
      a.rect(8, 14 + by, 2, 2, "#f7c844");
      a.px(8, 14 + by, "#fff3a1");
      a.rect(3, 11 + by, 3, 2, PINK);
      a.px(2, 12 + by + (i % 2), PINK_DARK);
      p.legs.forEach(([lx, ly, lh]) => {
        a.rect(lx, ly + by, 2, lh, SUIT_SHD);
        a.rect(lx, ly + lh + by, 3, 2, PINK);
        a.px(lx, ly + lh + 1 + by, PINK_DARK);
      });
      a.ell(8.5, 7.5 + by, 6, 5.5, SUIT_SHD);
      a.ell(8.5, 7.1 + by, 5.5, 5, WHITE);
      a.rect(4, 6 + by, 2, 3, PINK);
      a.px(4, 7 + by, PINK_DARK);
      a.ell(10, 7.5 + by, 4.2, 3.3, VISOR);
      a.ell(10, 7.2 + by, 3.6, 2.5, "#534866");
      if (i === 3) {
        [[8, 6], [10, 6], [9, 7], [8, 8], [10, 8], [12, 6], [12, 8]].forEach(([x, y]) => a.px(x, y + by, PINK));
      } else {
        a.rect(9, 6 + by, 1, 2, VISOR_GLOW);
        a.rect(12, 6 + by, 1, 2, VISOR_GLOW);
        a.px(8, 5 + by, WHITE);
        a.px(9, 5 + by, WHITE);
        a.px(8, 8 + by, "#ff9ebb");
        a.px(12, 8 + by, "#ff9ebb");
      }
      a.rect(7, p.armY + by, 3, 2, WHITE);
      a.px(9, p.armY + by, PINK);
      const ay = Math.max(1, 1 + by);
      a.rect(8, ay, 1, 2, SUIT_SHD);
      a.rect(8, ay, 2, 1, PINK);
    }));
    a.outline("#5e546e", 16);
  });

  const pedestrianCanvas = makeSprite(64, 24, 2, a => {
    const poses = [
      { legs: [[5, 17, 5], [9, 17, 5]], bob: 0, armX: 3, shawlDx: 0 },
      { legs: [[4, 16, 6], [10, 18, 4]], bob: -1, armX: 2, shawlDx: 1 },
      { legs: [[5, 17, 5], [9, 17, 5]], bob: 0, armX: 4, shawlDx: 0 },
      { legs: [[7, 18, 4], [9, 16, 6]], bob: -1, armX: 5, shawlDx: -1 }
    ];
    const PANJABI = "#9e3d33", PANJABI_SHD = "#7a2b23", PANJABI_HI = "#bf5045";
    const PAJAMA = "#f7f5f0", PAJAMA_SHD = "#dfdbd3", SANDAL = "#4a3b32";
    const SHAWL = "#2d7a6e", SHAWL_HI = "#3da898";
    
    poses.forEach((p, i) => a.at(i * 16, () => {
      const by = p.bob;
      a.ell(8, 23, 5, 1.5, "rgba(0,0,0,0.15)");
      p.legs.forEach(([lx, ly, lh]) => {
        a.rect(lx, ly + by, 2, lh - 1, PAJAMA);
        a.px(lx + 1, ly + by, PAJAMA_SHD);
        a.rect(lx - 1, ly + lh - 1 + by, 3, 2, SANDAL);
      });
      a.rect(5, 11 + by, 6, 7, PANJABI);
      a.rect(5, 11 + by, 2, 7, PANJABI_SHD);
      a.rect(6, 11 + by, 2, 3, PANJABI_HI);
      a.line(8, 11 + by, 8, 15 + by, PANJABI_SHD);
      a.px(8, 12 + by, "#f5d77f");
      a.px(8, 14 + by, "#f5d77f");
      a.line(6 + p.shawlDx, 11 + by, 5 + p.shawlDx, 17 + by, SHAWL);
      a.line(7 + p.shawlDx, 11 + by, 6 + p.shawlDx, 16 + by, SHAWL_HI);
      a.ell(8, 6.5 + by, 3.8, 3.8, HAIR);
      a.ell(8, 5.8 + by, 3.2, 2.5, HAIR_HI);
      a.ell(8.2, 7.2 + by, 2.8, 2.8, SK_SHD);
      a.ell(8, 7 + by, 2.5, 2.5, SK);
      a.rect(6, 4 + by, 4, 2, HAIR);
      a.px(5, 5 + by, HAIR);
      a.px(9, 6 + by, EYE_DARK);
      a.px(9, 8 + by, "#d9756c");
      a.rect(p.armX, 12 + by, 2, 4, PANJABI);
      a.rect(p.armX, 15 + by, 2, 2, SK);
    }));
    a.outline("#382320", 16);
  });

  const cngCanvas = makeSprite(36, 15, 2, a => {
    [0, 18].forEach((ox, i) => a.at(ox, () => {
      const by = i === 1 ? -0.5 : 0;
      a.rect(2, 6 + by, 14, 6, "#2e7d32");
      a.rect(2, 6 + by, 14, 2, "#43a047");
      a.rect(2, 4 + by, 12, 3, "#fdd835");
      a.rect(12, 4 + by, 3, 3, "#81d4fa");
      a.rect(2, 2 + by, 13, 2, "#2e7d32");
      a.ell(4.5, 12.5, 2.2, 2.2, "#37474f");
      a.ell(13.5, 12.5, 2.2, 2.2, "#37474f");
      if (i === 0) {
        a.px(4.5, 12.5, "#cfd8dc"); a.px(13.5, 12.5, "#cfd8dc");
      } else {
        a.px(4, 12, "#cfd8dc"); a.px(5, 13, "#cfd8dc");
        a.px(13, 12, "#cfd8dc"); a.px(14, 13, "#cfd8dc");
        a.px(1, 11, "#eceff1");
      }
      a.rect(15, 7 + by, 2, 2, "#fff59d");
    }));
    a.outline("#1b5e20", 18);
  });

  const rickCanvas = makeSprite(36, 17, 2, a => {
    [0, 18].forEach((ox, i) => a.at(ox, () => {
      const sway = i === 1 ? 0.5 : 0;
      a.ell(6 + sway, 5, 5, 4, "#e91e63");
      a.ell(6 + sway, 4.5, 4.2, 3.2, "#f48fb1");
      a.rect(2, 8, 9, 3, "#3f51b5");
      a.line(11, 10, 15, 8, "#795548");
      a.line(14, 8, 14, 13, "#795548");
      a.line(13, 6, 15, 6, "#212121");
      a.ell(5.5, 13.5, 2.5, 2.5, "#424242");
      a.ell(14.5, 13.5, 2.5, 2.5, "#424242");
      if (i === 0) {
        a.px(5.5, 13.5, "#fff"); a.px(14.5, 13.5, "#fff");
        a.line(5, 12, 6, 15, "#b0bec5");
      } else {
        a.px(5, 13, "#fff"); a.px(6, 14, "#fff");
        a.px(14, 13, "#fff"); a.px(15, 14, "#fff");
        a.line(4, 13, 7, 14, "#b0bec5");
      }
      a.px(14, 5, "#ffd54f");
    }));
    a.outline("#37474f", 18);
  });

  const crowCanvas = makeSprite(32, 12, 2, a => {
    [0, 16].forEach((ox, i) => a.at(ox, () => {
      a.ell(8, 7, 5, 3.5, "#242331");
      a.ell(8, 6.5, 4, 2.5, "#3d3b52");
      a.ell(13, 5.5, 2.8, 2.5, "#242331");
      a.tri([15, 5], [19, 6], [15, 7], "#e8a838");
      a.px(13, 5, "#fff"); a.px(13.5, 5, "#242331");
      if (i === 0) {
        a.tri([5, 5], [9, 1], [11, 5], "#3b3a52");
        a.line(6, 4, 9, 2, "#67668a");
      } else {
        a.tri([4, 6], [7, 10], [10, 6], "#3b3a52");
        a.line(5, 7, 7, 9, "#67668a");
      }
    }));
    a.outline("#12111a", 16);
  });

  const kiteCanvas = makeSprite(11, 15, 3, a => {
    a.tri([5, 0], [0, 5], [5, 5], "#f25c84");
    a.tri([5, 0], [10, 5], [5, 5], "#ff8da9");
    a.tri([0, 5], [5, 5], [5, 10], "#f7c948");
    a.tri([10, 5], [5, 5], [5, 10], "#f25c84");
    a.line(5, 0, 5, 10, "#fff7e6");
    a.line(0, 5, 10, 5, "#fff7e6");
    a.tri([5, 10], [3, 13], [7, 13], "#47a8bd");
    a.px(4, 14, "#f25c84"); a.px(6, 14, "#f25c84");
    a.outline("#6e2239");
  });

  const fuchkaCanvas = makeSprite(8, 8, 2, a => {
    a.ell(4, 4.2, 3.4, 3.2, "#c9812c");
    a.ell(4, 3.8, 2.9, 2.7, "#f2b452");
    a.ell(4, 3.6, 1.8, 1.4, "#6e3518");
    a.px(3, 3, "#f7d460"); a.px(4, 3, "#5ebd74");
    a.px(2, 2, "#ffe699");
    a.outline("#7d4812");
  });

  const doiCanvas = makeSprite(12, 10, 2, a => {
    a.tri([2, 9], [1, 4], [11, 4], "#b05e3b");
    a.tri([2, 9], [10, 9], [11, 4], "#964b2a");
    a.ell(6, 4, 5, 2.2, "#b05e3b");
    a.ell(6, 3.6, 4.5, 1.8, "#fef3d6");
    a.ell(6, 3.4, 3.5, 1.3, "#fffdf5");
    a.outline("#5a2c18");
  });

  const coinCanvas = makeSprite(10, 10, 3, a => {
    a.ell(5, 5, 4.5, 4.5, "#d4972c");
    a.ell(5, 4.6, 4, 4, "#f7cb45");
    a.ell(4.5, 4.2, 2.8, 2.8, "#ffea78");
    a.outline("#8a5a12");
  });

  const blockCanvas = makeSprite(16, 16, 2, a => {
    a.rect(0, 0, 16, 16, "#c86a4b");
    a.rect(0, 0, 16, 1, "#df8566");
    a.rect(0, 0, 1, 16, "#df8566");
    a.rect(0, 15, 16, 1, "#7a2e1d");
    a.rect(15, 0, 1, 16, "#7a2e1d");
    a.rect(0, 7, 16, 2, "#4a1f16");
    a.rect(7, 0, 2, 7, "#4a1f16");
    a.rect(3, 9, 2, 7, "#4a1f16");
    a.rect(11, 9, 2, 7, "#4a1f16");
    a.outline("#381710");
  });

  const qblockCanvas = makeSprite(16, 16, 2, a => {
    a.rect(0, 0, 16, 16, "#f7cb45");
    a.rect(1, 1, 14, 1, "#fff3a1");
    a.rect(1, 1, 1, 14, "#fff3a1");
    a.rect(1, 14, 14, 1, "#c49216");
    a.rect(14, 1, 1, 14, "#c49216");
    a.px(2, 2, "#8a5a12"); a.px(13, 2, "#8a5a12");
    a.px(2, 13, "#8a5a12"); a.px(13, 13, "#8a5a12");
    const Q = "#734308";
    a.line(6, 4, 9, 4, Q);
    a.px(5, 5, Q); a.px(10, 5, Q);
    a.px(10, 6, Q);
    a.line(8, 7, 9, 7, Q);
    a.line(7, 8, 8, 8, Q);
    a.px(7, 9, Q);
    a.px(7, 11, Q);
    a.outline("#5a3406");
  });

  const qblockSpentCanvas = makeSprite(16, 16, 2, a => {
    a.rect(0, 0, 16, 16, "#b5aba0");
    a.rect(1, 1, 14, 1, "#d8d0c7");
    a.rect(1, 1, 1, 14, "#d8d0c7");
    a.rect(1, 14, 14, 1, "#80766d");
    a.rect(14, 1, 1, 14, "#80766d");
    a.px(2, 2, "#5e554d"); a.px(13, 2, "#5e554d");
    a.px(2, 13, "#5e554d"); a.px(13, 13, "#5e554d");
    a.outline("#4a423b");
  });

  const lampOffCanvas = makeSprite(16, 32, 2, a => {
    a.rect(7, 12, 2, 18, "#42484f");
    a.rect(5, 30, 6, 2, "#2b3036");
    a.rect(4, 12, 8, 2, "#2b3036");
    a.rect(5, 4, 6, 8, "#cad4dc");
    a.rect(6, 5, 4, 6, "#eef2f5");
    a.tri([8, 1], [4, 4], [12, 4], "#2b3036");
    a.px(8, 0, "#2b3036");
    a.outline("#1f2326");
  });

  const lampOnCanvas = makeSprite(16, 32, 2, a => {
    a.rect(7, 12, 2, 18, "#42484f");
    a.rect(5, 30, 6, 2, "#2b3036");
    a.rect(4, 12, 8, 2, "#2b3036");
    a.rect(5, 4, 6, 8, "#ffe46b");
    a.rect(6, 5, 4, 6, "#ffffff");
    a.tri([8, 1], [4, 4], [12, 4], "#2b3036");
    a.px(8, 0, "#2b3036");
    a.outline("#1f2326");
  });

  const bussignCanvas = makeSprite(16, 32, 2, a => {
    a.rect(7, 14, 2, 16, "#78828a");
    a.rect(6, 30, 4, 2, "#52595f");
    a.ell(8, 7, 7, 7, "#d9384f");
    a.ell(8, 7, 6, 6, "#e84b61");
    // "BUS"
    a.line(3, 5, 3, 9, "#ffffff");
    a.line(3, 5, 5, 5, "#ffffff");
    a.line(3, 7, 5, 7, "#ffffff");
    a.line(3, 9, 5, 9, "#ffffff");
    a.px(5, 6, "#ffffff"); a.px(5, 8, "#ffffff");
    a.line(7, 5, 7, 8, "#ffffff");
    a.line(9, 5, 9, 8, "#ffffff");
    a.px(8, 9, "#ffffff");
    a.line(11, 5, 13, 5, "#ffffff");
    a.px(11, 6, "#ffffff");
    a.line(11, 7, 13, 7, "#ffffff");
    a.px(13, 8, "#ffffff");
    a.line(11, 9, 13, 9, "#ffffff");
    a.outline("#40181e");
  });

  MASTER_SPRITES = {
    astro: astroCanvas,
    totoro: totoroCanvas,
    rock: rockCanvas,
    rocks: rocksCanvas,
    spike: spikeCanvas,
    bug: bugCanvas,
    heart: heartCanvas,
    cloud: cloudCanvas,
    chibi: chibiCanvas,
    pedestrian: pedestrianCanvas,
    cng: cngCanvas,
    rick: rickCanvas,
    crow: crowCanvas,
    kite: kiteCanvas,
    fuchka: fuchkaCanvas,
    doi: doiCanvas,
    coin: coinCanvas,
    block: blockCanvas,
    qblock: qblockCanvas,
    qblock_spent: qblockSpentCanvas,
    lamp_off: lampOffCanvas,
    lamp_on: lampOnCanvas,
    bussign: bussignCanvas
  };

  return MASTER_SPRITES;
}

function sliceTexture(scene, key, frameW, frameH, frameCount) {
  const tex = scene.textures.get(key);
  if (!tex) return;
  for (let i = 0; i < frameCount; i++) {
    if (!tex.has(i)) {
      tex.add(i, 0, i * frameW, 0, frameW, frameH);
    }
    if (!tex.has(String(i))) {
      tex.add(String(i), 0, i * frameW, 0, frameW, frameH);
    }
  }
}

function createAnim(scene, key, texKey, frames, rate, repeat) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: frames.map(f => ({ key: texKey, frame: f })),
    frameRate: rate,
    repeat
  });
}

function initTexturesForScene(scene) {
  const masters = buildMasterSprites();
  if (!masters) return;

  for (const [key, canvas] of Object.entries(masters)) {
    if (!scene.textures.exists(key)) {
      scene.textures.addCanvas(key, canvas);
    }
  }

  sliceTexture(scene, "astro", 22 * 3, 29 * 3, 4);
  sliceTexture(scene, "chibi", 16 * 2, 24 * 2, 4);
  sliceTexture(scene, "pedestrian", 16 * 2, 24 * 2, 4);
  sliceTexture(scene, "cng", 18 * 2, 15 * 2, 2);
  sliceTexture(scene, "rick", 18 * 2, 17 * 2, 2);
  sliceTexture(scene, "crow", 16 * 2, 12 * 2, 2);
  sliceTexture(scene, "bug", 13 * 3, 11 * 3, 2);

  createAnim(scene, "astro_run", "astro", [0, 1], 10, -1);
  createAnim(scene, "astro_jump", "astro", [2], 1, 0);
  createAnim(scene, "astro_hit", "astro", [3], 1, 0);
  createAnim(scene, "astro_idle", "astro", [0], 1, 0);

  createAnim(scene, "chibi_run", "chibi", [0, 1], 9, -1);
  createAnim(scene, "chibi_jump", "chibi", [2], 1, 0);
  createAnim(scene, "chibi_hit", "chibi", [3], 1, 0);
  createAnim(scene, "chibi_idle", "chibi", [0], 1, 0);

  createAnim(scene, "ped_walk", "pedestrian", [0, 1, 2, 3], 7, -1);
  createAnim(scene, "cng_run", "cng", [0, 1], 9, -1);
  createAnim(scene, "rick_run", "rick", [0, 1], 7, -1);
  createAnim(scene, "crow_fly", "crow", [0, 1], 8, -1);
  createAnim(scene, "bug_fly", "bug", [0, 1], 14, -1);
}

/* ==========================================================================
   3. Level Data & Maze Generators
   ========================================================================== */
const PC = 19, PR = 13;
const rng = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

function makeMaze(seed) {
  const r = rng(seed), g = Array.from({ length: PR }, () => Array(PC).fill("#"));
  const seen = new Set(["1,1"]), stack = [[1, 1]]; g[1][1] = " ";
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([dx, dy]) => [x + dx, y + dy, dx, dy])
      .filter(([nx, ny]) => nx >= 1 && nx <= 9 && ny >= 1 && ny <= PR - 2 && !seen.has(nx + "," + ny));
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nb[Math.floor(r() * nb.length)];
    g[y + dy / 2][x + dx / 2] = " "; g[ny][nx] = " "; seen.add(nx + "," + ny); stack.push([nx, ny]);
  }
  const open = (x, y) => g[y][x] !== "#";
  for (let y = 1; y < PR - 1; y += 2) for (let x = 1; x <= 9; x += 2) {
    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
    const ways = dirs.filter(([dx, dy]) => open(x + dx / 2, y + dy / 2));
    const walls = dirs.filter(([dx, dy]) => !open(x + dx / 2, y + dy / 2) && x + dx >= 1 && x + dx <= 9 && y + dy >= 1 && y + dy <= PR - 2);
    if (walls.length && (ways.length === 1 || r() < .22)) { const [dx, dy] = walls[Math.floor(r() * walls.length)]; g[y + dy / 2][x + dx / 2] = " "; }
  }
  for (let y = 0; y < PR; y++) for (let x = 0; x < 9; x++) g[y][PC - 1 - x] = g[y][x];
  return g.map(row => row.join(""));
}

const PAC_STAGES = [
  { name: "TSC Adda", seed: 11, wall: 0xefc9d4, ghosts: ["cng", "rick"], speed: 92 },
  { name: "Old Dhaka Lanes", seed: 23, wall: 0xc9dcef, ghosts: ["cng", "rick", "crow"], speed: 100 },
  { name: "Hatirjheel at Night", seed: 37, wall: 0xcfe6d3, ghosts: ["cng", "rick", "crow"], speed: 108 }
];

const TS = 32, MR = 14;

const MARIO_LEVELS = [
  { name: "Dhanmondi Rickshaw Road", walker: "rick", w: 100, start: 2, goal: 96,
    ground: [[0, 22], [26, 40], [44, 60], [63, 80], [83, 99]],
    blocks: [[8, 8, 3], [12, 8, 3], [30, 9, 3], [48, 8, 3], [52, 8, 3], [70, 9, 2]], q: [[11, 8], [51, 8]],
    coins: [[8, 7, 7], [23, 9, 3], [30, 8, 3], [41, 9, 3], [48, 7, 7], [61, 9, 2], [81, 9, 2]],
    hearts: [[31, 7], [57, 10], [88, 10]], kites: [[38, 6], [66, 6]],
    walkers: [16, 34, 50, 68, 90], crows: [[56, 10], [78, 10]], lamps: [20, 48, 76] },
  { name: "Hatirjheel Bridge", walker: "cng", w: 110, start: 2, goal: 105,
    ground: [[0, 14], [20, 28], [34, 38], [46, 52], [58, 64], [70, 78], [84, 92], [98, 109]],
    blocks: [[17, 10, 1], [31, 10, 1], [41, 10, 1], [43, 10, 1], [55, 10, 1], [67, 10, 1], [81, 10, 1], [95, 10, 1], [22, 8, 2], [25, 8, 2]],
    q: [[24, 8], [48, 8]],
    coins: [[16, 8, 3], [30, 8, 3], [41, 8, 3], [54, 8, 3], [66, 8, 3], [80, 8, 3], [94, 8, 3]],
    hearts: [[24, 10], [61, 10], [88, 10]], kites: [[42, 6], [82, 6]],
    walkers: [8, 24, 49, 61, 74, 88, 102], crows: [[36, 10], [72, 10], [100, 10]], lamps: [10, 26, 48, 74, 88] },
  { name: "Old Dhaka Rooftops", walker: "pedestrian", w: 120, start: 2, goal: 115,
    ground: [[0, 12, 12], [16, 24, 11], [28, 34, 10], [38, 46, 11], [50, 56, 12], [60, 66, 10], [70, 78, 11], [82, 88, 12], [92, 100, 10], [104, 119, 12]],
    blocks: [], q: [[20, 8], [42, 8], [64, 7], [96, 7]],
    coins: [[13, 9, 3], [25, 8, 3], [35, 8, 3], [47, 8, 3], [57, 8, 3], [67, 8, 3], [79, 8, 3], [89, 8, 3], [101, 8, 3]],
    hearts: [[31, 8], [63, 8], [97, 8]], kites: [[26, 6], [48, 6], [80, 6]],
    walkers: [5, 20, 31, 42, 53, 63, 74, 85, 96, 110], crows: [[30, 8], [62, 7], [94, 7]], lamps: [6, 20, 42, 64, 86, 108] }
];

function buildLevel(s) {
  const g = Array.from({ length: MR }, () => Array(s.w).fill(" "));
  const set = (x, y, c) => { if (x >= 0 && x < s.w && y >= 0 && y < MR) g[y][x] = c; };
  s.ground.forEach(([a, b, top = 12]) => { for (let x = a; x <= b; x++) for (let y = top; y < MR; y++) set(x, y, "#"); });
  const groundTop = x => { for (let y = 0; y < MR; y++) if (g[y][x] === "#") return y; return MR; };
  (s.blocks || []).forEach(([x, y, n]) => { for (let i = 0; i < n; i++) set(x + i, y, "b"); });
  (s.q || []).forEach(([x, y]) => set(x, y, "?"));
  (s.coins || []).forEach(([x, y, n]) => { for (let i = 0; i < n; i++) set(x + i, y, "c"); });
  (s.hearts || []).forEach(([x, y]) => set(x, y, "h"));
  (s.kites || []).forEach(([x, y]) => set(x, y, "k"));
  (s.crows || []).forEach(([x, y]) => set(x, y, "f"));
  (s.walkers || []).forEach(x => set(x, groundTop(x) - 1, "r"));
  (s.lamps || []).forEach(x => set(x, groundTop(x) - 1, "L"));
  set(s.start, groundTop(s.start) - 1, "S");
  set(s.goal, groundTop(s.goal) - 1, "T");
  return g.map(r => r.join(""));
}

/* ==========================================================================
   4. Base Safe Scene Prototype
   ========================================================================== */
const SceneBase = (typeof Phaser !== "undefined" && Phaser.Scene) ? Phaser.Scene : class {};

/* ==========================================================================
   5. Game 1: "Run to Totoro" (Infinite Runner)
   ========================================================================== */
const RUN_W = 800, RUN_H = 300, RUN_GROUND = 250, RUN_GOAL = 14000;
let runnerPhaserGame = null;
let runOnWinCb = () => {};

class RunnerScene extends SceneBase {
  constructor() {
    super("RunnerScene");
  }

  init(data) {
    this.onWin = data?.onWin || runOnWinCb;
    this.dist = 0;
    this.speed = 250;
    this.jumpVel = 0;
    this.jumpHeld = false;
    this.state = "running";
    this.nextObs = 700;
    this.totoro = null;
    this.dustTimer = 0;
    this.heartTimer = 0;
    this.obsList = [];
    this.dustList = [];
    this.heartList = [];
  }

  create() {
    initTexturesForScene(this);

    // Ground graphics
    const g = this.add.graphics();
    g.fillStyle(0xe0d8d1, 1);
    g.fillRect(0, RUN_GROUND, RUN_W, 2);
    g.fillStyle(0xf4f0ec, 1);
    g.fillRect(0, RUN_GROUND + 2, RUN_W, RUN_H - RUN_GROUND - 2);

    // Parallax Clouds
    this.clouds = [
      { sprite: this.add.sprite(80, 40, "cloud").setAlpha(0.85), sp: 18 },
      { sprite: this.add.sprite(380, 75, "cloud").setAlpha(0.7), sp: 12 },
      { sprite: this.add.sprite(650, 30, "cloud").setAlpha(0.8), sp: 22 }
    ];

    // Player Astro (raincoat girl)
    this.astro = this.add.sprite(110, RUN_GROUND, "astro", 0).setOrigin(0.5, 1);
    this.astro.play("astro_run");

    // Progress Bar
    const BAR_W = 220, BAR_X = 24, BAR_Y = 24;
    const barBg = this.add.graphics();
    barBg.fillStyle(0xe6e0da, 1);
    barBg.fillRoundedRect(BAR_X, BAR_Y, BAR_W, 8, 4);

    this.fillBar = this.add.graphics();

    // Clean transparent vector text (zero black boxes)
    this.pctText = this.add.text(BAR_X + BAR_W + 12, BAR_Y - 4, "0%", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "13px",
      color: "#8c827c",
      fontStyle: "bold"
    });

    this.msgText = this.add.text(RUN_W / 2, 70, "", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "19px",
      color: "#645a56",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5);

    // Jump Action
    this.doJump = () => {
      if (this.state === "hit") {
        this.state = "running";
        this.jumpVel = 0;
        this.astro.y = RUN_GROUND;
        this.astro.play("astro_run");
        this.msgText.setText("");
        this.obsList.forEach(o => {
          if (o.sprite && o.sprite.x < 360) o.sprite.destroy();
        });
        this.obsList = this.obsList.filter(o => o.sprite && o.sprite.active && o.sprite.x >= 360);
        return;
      }
      if (this.state === "running" && this.astro.y >= RUN_GROUND) {
        this.jumpVel = -640;
        sfx.jump();
        this.astro.play("astro_jump");
        for (let i = 0; i < 4; i++) {
          this.spawnDust(this.astro.x - 8 + (Math.random() * 8 - 4), RUN_GROUND - 2, -(Math.random() * 20 + 15), -(Math.random() * 20 + 5));
        }
      }
    };

    // Safe Keyboard bindings via Phaser and global window
    if (this.input && this.input.keyboard) {
      this.input.keyboard.on("keydown-SPACE", e => { e.preventDefault(); this.jumpHeld = true; this.doJump(); });
      this.input.keyboard.on("keyup-SPACE", () => { this.jumpHeld = false; });
      this.input.keyboard.on("keydown-UP", e => { e.preventDefault(); this.jumpHeld = true; this.doJump(); });
      this.input.keyboard.on("keyup-UP", () => { this.jumpHeld = false; });
      this.input.keyboard.on("keydown-W", e => { e.preventDefault(); this.jumpHeld = true; this.doJump(); });
      this.input.keyboard.on("keyup-W", () => { this.jumpHeld = false; });
    }

    this._onRunKeyDown = e => {
      if (!this.sys.isActive()) return;
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        this.jumpHeld = true;
        if (!e.repeat) this.doJump();
      }
    };
    this._onRunKeyUp = e => {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) this.jumpHeld = false;
    };
    window.addEventListener("keydown", this._onRunKeyDown);
    window.addEventListener("keyup", this._onRunKeyUp);
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", this._onRunKeyDown);
      window.removeEventListener("keyup", this._onRunKeyUp);
    });

    if (this.input) {
      this.input.on("pointerdown", () => { this.jumpHeld = true; this.doJump(); });
      this.input.on("pointerup", () => { this.jumpHeld = false; });
    }
  }

  spawnDust(x, y, vx, vy) {
    const d = this.add.circle(x, y, Math.random() * 1.5 + 1.5, 0xe6ded6, 0.8);
    this.dustList.push({ circle: d, vx, vy, life: 1.0 });
  }

  spawnObstacle() {
    const isSpike = Math.random() < 0.3;
    const isBug = !isSpike && Math.random() < 0.28;
    const isRocks = !isSpike && !isBug && Math.random() < 0.35;

    if (isBug) {
      const by = RUN_GROUND - 75 + Math.random() * 20;
      const bug = this.add.sprite(RUN_W + 30, by, "bug", 0).setOrigin(0.5, 0.5);
      bug.play("bug_fly");
      this.obsList.push({ sprite: bug, isBug: true, baseY: by, phase: Math.random() * 6, hitW: 24, hitH: 18 });
    } else {
      const tag = isSpike ? "spike" : isRocks ? "rocks" : "rock";
      const obs = this.add.sprite(RUN_W + 30, RUN_GROUND, tag).setOrigin(0.5, 1);
      this.obsList.push({ sprite: obs, isBug: false, hitW: isRocks ? 70 : 34, hitH: 26 });
    }
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);

    // Parallax clouds
    this.clouds.forEach(c => {
      c.sprite.x -= (c.sp + (this.state === "running" ? this.speed * 0.08 : 0)) * dt;
      if (c.sprite.x < -80) c.sprite.x = RUN_W + 40;
    });

    // Dust particles
    for (let i = this.dustList.length - 1; i >= 0; i--) {
      const d = this.dustList[i];
      d.circle.x += d.vx * dt;
      d.circle.y += d.vy * dt;
      d.life -= dt * 1.6;
      d.circle.setAlpha(Math.max(0, d.life));
      if (d.life <= 0) {
        d.circle.destroy();
        this.dustList.splice(i, 1);
      }
    }

    if (this.state === "running") {
      this.dist += this.speed * dt;
      this.speed = Math.min(360, 250 + (this.dist / RUN_GOAL) * 110);

      this.dustTimer -= dt;
      if (this.dustTimer <= 0 && this.astro.y >= RUN_GROUND) {
        this.dustTimer = 0.18;
        this.spawnDust(this.astro.x - 10, RUN_GROUND - 1, -this.speed * 0.25, -(Math.random() * 10 + 5));
      }

      // Jump vertical physics
      if (this.astro.y < RUN_GROUND || this.jumpVel < 0) {
        this.jumpVel += (this.jumpVel < 0 && this.jumpHeld ? 1500 : 2100) * dt;
        this.astro.y += this.jumpVel * dt;
        if (this.astro.y >= RUN_GROUND) {
          this.astro.y = RUN_GROUND;
          if (this.jumpVel > 120) sfx.land();
          this.jumpVel = 0;
          this.astro.play("astro_run");
        }
      }

      // Spawning obstacles or Totoro
      if (this.dist < RUN_GOAL - 600) {
        this.nextObs -= this.speed * dt;
        if (this.nextObs <= 0) {
          this.spawnObstacle();
          this.nextObs = 300 + Math.random() * 260 + (360 - this.speed) * 0.8;
        }
      } else if (!this.totoro) {
        this.totoro = this.add.sprite(RUN_W + 60, RUN_GROUND, "totoro").setOrigin(0.5, 1);
      }

      // Update & check obstacles
      for (let i = this.obsList.length - 1; i >= 0; i--) {
        const o = this.obsList[i];
        o.sprite.x -= this.speed * dt;
        if (o.isBug) o.sprite.y = o.baseY + Math.sin(time * 0.007 + o.phase) * 12;

        const obsCenterY = o.isBug ? o.sprite.y : o.sprite.y - o.hitH / 2;
        const astroCenterY = this.astro.y - 35;
        if (Math.abs(o.sprite.x - this.astro.x) < (o.hitW + 20) / 2 && Math.abs(obsCenterY - astroCenterY) < (o.hitH + 50) / 2) {
          sfx.hit();
          this.state = "hit";
          this.astro.play("astro_hit");
          this.msgText.setText("Oops! Press jump to try again");
        }

        if (o.sprite.x < -80) {
          o.sprite.destroy();
          this.obsList.splice(i, 1);
        }
      }

      // Totoro encounter
      if (this.totoro) {
        this.totoro.x -= this.speed * dt;
        if (this.totoro.x <= this.astro.x + 85) {
          this.state = "won";
          this.astro.play("astro_idle");
          sfx.win();
          this.msgText.setText("You found Totoro!");
          for (let i = 0; i < 18; i++) {
            const h = this.add.sprite(this.totoro.x + (Math.random() * 110 - 20), this.totoro.y - 60, "heart");
            this.heartList.push({ sprite: h, ox: h.x, phase: Math.random() * 6, life: 1.5 });
          }
          this.time.delayedCall(1400, () => this.onWin());
        }
      }
    } else if (this.state === "won") {
      this.heartTimer -= dt;
      if (this.heartTimer <= 0 && this.totoro) {
        this.heartTimer = 0.18;
        const h = this.add.sprite(this.totoro.x + (Math.random() * 100 - 10), this.totoro.y - 60, "heart");
        this.heartList.push({ sprite: h, ox: h.x, phase: Math.random() * 6, life: 1.5 });
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
    this.fillBar.fillRoundedRect(24, 24, Math.max(1, p * 220), 8, 4);
    this.pctText.setText(Math.floor(p * 100) + "%");
  }
}

window.Game = {
  start(cb) {
    runOnWinCb = cb || (() => {});
    const canvas = document.getElementById("game-canvas");
    if (!canvas) return;

    if (typeof Phaser === "undefined") {
      setTimeout(() => window.Game.start(cb), 80);
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
  }
};

/* ==========================================================================
   6. Game 2: "Fuchka Chase" (Pac-Man Style Dhaka Maze)
   ========================================================================== */
const PAC_T = 30, PAC_W = 640, PAC_H = 470;
const PAC_OX = Math.round((PAC_W - PC * PAC_T) / 2), PAC_OY = 44;
let pacPhaserGame = null;
let pacOnWinCb = () => {};

class PacScene extends SceneBase {
  constructor() {
    super("PacScene");
  }

  init(data) {
    this.stageIdx = data?.stage || 0;
    this.lives = data?.lives !== undefined ? data.lives : 3;
    this.onWin = data?.onWin || pacOnWinCb;
    this.eatenFuchka = 0;
    this.totalFuchka = 0;
    this.scaredTimer = 0;
    this.state = "play";
  }

  create() {
    initTexturesForScene(this);

    const st = PAC_STAGES[this.stageIdx];
    const rawMaze = makeMaze(st.seed).map(r => [...r]);

    for (let x = 7; x <= 11; x++) rawMaze[5][x] = " ";
    rawMaze[4][9] = " "; rawMaze[6][9] = " ";
    rawMaze[11][9] = " "; rawMaze[11][8] = " "; rawMaze[11][10] = " ";
    this.maze = rawMaze.map(r => r.join(""));

    const free = (x, y) => !!this.maze[y] && this.maze[y][x] === " ";
    this.free = free;
    this.px = (tx) => PAC_OX + tx * PAC_T + PAC_T / 2;
    this.py = (ty) => PAC_OY + ty * PAC_T + PAC_T / 2;

    // Draw Maze Walls
    const wallG = this.add.graphics();
    this.maze.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === "#") {
          const wx = PAC_OX + x * PAC_T + 1, wy = PAC_OY + y * PAC_T + 1;
          wallG.fillStyle(st.wall, 1);
          wallG.fillRoundedRect(wx, wy, PAC_T - 2, PAC_T - 2, 4);
          wallG.lineStyle(1, 0x433a57, 0.15);
          wallG.strokeRoundedRect(wx, wy, PAC_T - 2, PAC_T - 2, 4);
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
          if ((x >= 7 && x <= 11 && y >= 4 && y <= 6) || (x === 9 && y === 11)) return;

          const cx = this.px(x), cy = this.py(y);
          if (corners.has(x + "," + y)) {
            const doi = this.add.sprite(cx, cy, "doi").setOrigin(0.5, 0.5);
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
    this.playerSpeed = 105;

    this.chibi = this.add.sprite(this.playerPos.x, this.playerPos.y, "chibi", 0).setOrigin(0.5, 0.5);
    this.chibi.play("chibi_idle");

    // Ghosts
    const ghostConfigs = [
      { key: "cng", anim: "cng_run", startX: 8, startY: 5 },
      { key: "rick", anim: "rick_run", startX: 9, startY: 5 },
      { key: "crow", anim: "crow_fly", startX: 10, startY: 5 }
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
        startX: gc.startX,
        startY: gc.startY,
        tileX: gc.startX,
        tileY: gc.startY,
        x: this.px(gc.startX),
        y: this.py(gc.startY),
        dir: [0, -1],
        speed: st.speed
      });
    });

    // Top HUD
    this.stageText = this.add.text(PAC_OX, 14, st.name, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#433a57",
      fontStyle: "bold"
    });

    this.fuchkaText = this.add.text(PAC_W / 2, 14, "Fuchka: 0 / " + this.totalFuchka, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "14px",
      color: "#6e7885",
      fontStyle: "bold"
    }).setOrigin(0.5, 0);

    this.heartSprites = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.sprite(PAC_OX + PC * PAC_T - 12 - i * 22, 22, "heart").setOrigin(0.5, 0.5);
      h.setVisible(i < this.lives);
      this.heartSprites.push(h);
    }

    this.banner = this.add.text(PAC_W / 2, 235, "", {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "20px",
      color: "#433a57",
      fontStyle: "bold"
    }).setOrigin(0.5, 0.5).setVisible(false);

    // Direction handler
    const setDir = (dx, dy) => {
      if (this.state === "over") {
        this.scene.restart({ stage: this.stageIdx, lives: 3, onWin: this.onWin });
        return;
      }
      this.playerNextDir = [dx, dy];
    };

    if (this.input && this.input.keyboard) {
      this.input.keyboard.on("keydown-LEFT", () => setDir(-1, 0));
      this.input.keyboard.on("keydown-A", () => setDir(-1, 0));
      this.input.keyboard.on("keydown-RIGHT", () => setDir(1, 0));
      this.input.keyboard.on("keydown-D", () => setDir(1, 0));
      this.input.keyboard.on("keydown-UP", () => setDir(0, -1));
      this.input.keyboard.on("keydown-W", () => setDir(0, -1));
      this.input.keyboard.on("keydown-DOWN", () => setDir(0, 1));
      this.input.keyboard.on("keydown-S", () => setDir(0, 1));
    }

    this._onPacKeyDown = e => {
      if (!this.sys.isActive()) return;
      if (["ArrowLeft", "KeyA"].includes(e.code)) { e.preventDefault(); setDir(-1, 0); }
      else if (["ArrowRight", "KeyD"].includes(e.code)) { e.preventDefault(); setDir(1, 0); }
      else if (["ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); setDir(0, -1); }
      else if (["ArrowDown", "KeyS"].includes(e.code)) { e.preventDefault(); setDir(0, 1); }
      else if (this.state === "over") {
        this.scene.restart({ stage: this.stageIdx, lives: 3, onWin: this.onWin });
      }
    };
    window.addEventListener("keydown", this._onPacKeyDown);
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", this._onPacKeyDown);
    });

    let touchStartX = 0, touchStartY = 0;
    if (this.input) {
      this.input.on("pointerdown", pointer => {
        touchStartX = pointer.x;
        touchStartY = pointer.y;
        if (this.state === "over") {
          this.scene.restart({ stage: this.stageIdx, lives: 3, onWin: this.onWin });
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

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);

    if (this.scaredTimer > 0) {
      this.scaredTimer -= dt;
      if (this.scaredTimer <= 0) {
        this.ghosts.forEach(g => g.sprite.clearTint());
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
    const tileCenterX = this.px(curTileX);
    const tileCenterY = this.py(curTileY);

    const nearCenter = Math.abs(p.x - tileCenterX) < 4 && Math.abs(p.y - tileCenterY) < 4;
    const [ndx, ndy] = this.playerNextDir;
    if (nearCenter && (ndx !== 0 || ndy !== 0)) {
      if (this.free(curTileX + ndx, curTileY + ndy)) {
        this.playerDir = [ndx, ndy];
        p.x = tileCenterX;
        p.y = tileCenterY;
      }
    }

    const [pdx, pdy] = this.playerDir;
    if (pdx !== 0 || pdy !== 0) {
      let nextX = p.x + pdx * this.playerSpeed * dt;
      let nextY = p.y + pdy * this.playerSpeed * dt;

      if (!this.free(curTileX + pdx, curTileY + pdy)) {
        if ((pdx > 0 && nextX > tileCenterX) || (pdx < 0 && nextX < tileCenterX)) nextX = tileCenterX;
        if ((pdy > 0 && nextY > tileCenterY) || (pdy < 0 && nextY < tileCenterY)) nextY = tileCenterY;
      }

      p.x = nextX;
      p.y = nextY;
      this.chibi.play("chibi_run", true);
      if (pdx < 0) this.chibi.setFlipX(true);
      else if (pdx > 0) this.chibi.setFlipX(false);
    } else {
      this.chibi.play("chibi_idle", true);
    }

    this.chibi.x = p.x;
    this.chibi.y = p.y;
    this.playerTile = { x: curTileX, y: curTileY };

    // Munch fuchka
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const d = this.dots[i];
      if (Math.abs(p.x - this.px(d.x)) < 12 && Math.abs(p.y - this.py(d.y)) < 12) {
        d.sprite.destroy();
        this.dots.splice(i, 1);
        sfx.munch();
        this.eatenFuchka++;
        this.fuchkaText.setText("Fuchka: " + this.eatenFuchka + " / " + this.totalFuchka);
        if (this.dots.length === 0) {
          this.state = "clear";
          sfx.win();
          this.banner.setText(this.stageIdx < 2 ? "Stage Cleared!" : "You found Totoro!").setVisible(true);
          this.time.delayedCall(1600, () => {
            if (this.stageIdx < 2) {
              this.scene.restart({ stage: this.stageIdx + 1, lives: this.lives, onWin: this.onWin });
            } else {
              this.onWin();
            }
          });
        }
        break;
      }
    }

    // Eat Doi powerup
    for (let i = this.dois.length - 1; i >= 0; i--) {
      const d = this.dois[i];
      if (Math.abs(p.x - this.px(d.x)) < 14 && Math.abs(p.y - this.py(d.y)) < 14) {
        d.sprite.destroy();
        this.dois.splice(i, 1);
        sfx.powerup();
        this.scaredTimer = 7.0;
        this.ghosts.forEach(g => g.sprite.setTint(0x80b0ff));
        break;
      }
    }
  }

  updateGhosts(dt) {
    const isScared = this.scaredTimer > 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    this.ghosts.forEach(g => {
      const speed = isScared ? g.speed * 0.55 : g.speed;
      const curTileX = Math.round((g.x - PAC_OX - PAC_T / 2) / PAC_T);
      const curTileY = Math.round((g.y - PAC_OY - PAC_T / 2) / PAC_T);
      const tileCenterX = this.px(curTileX);
      const tileCenterY = this.py(curTileY);

      if (Math.abs(g.x - tileCenterX) < 3 && Math.abs(g.y - tileCenterY) < 3) {
        const validDirs = dirs.filter(([dx, dy]) => {
          if (dx === -g.dir[0] && dy === -g.dir[1]) return false;
          return this.free(curTileX + dx, curTileY + dy);
        });

        if (validDirs.length > 0) {
          validDirs.sort((a, b) => {
            const da = Math.abs(curTileX + a[0] - this.playerTile.x) + Math.abs(curTileY + a[1] - this.playerTile.y);
            const db = Math.abs(curTileX + b[0] - this.playerTile.x) + Math.abs(curTileY + b[1] - this.playerTile.y);
            return isScared ? db - da : da - db;
          });
          g.dir = Math.random() < 0.15 ? validDirs[Math.floor(Math.random() * validDirs.length)] : validDirs[0];
        } else {
          g.dir = [-g.dir[0], -g.dir[1]];
        }
        g.x = tileCenterX;
        g.y = tileCenterY;
      }

      g.x += g.dir[0] * speed * dt;
      g.y += g.dir[1] * speed * dt;
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
        if (isScared) {
          sfx.ghost();
          g.x = this.px(g.startX);
          g.y = this.py(g.startY);
          g.dir = [0, -1];
          g.sprite.clearTint();
        } else {
          sfx.hit();
          this.state = "hit";
          this.chibi.play("chibi_hit");
          this.lives--;
          for (let i = 0; i < 3; i++) {
            this.heartSprites[i].setVisible(i < this.lives);
          }
          if (this.lives > 0) {
            this.time.delayedCall(900, () => {
              this.playerPos = { x: this.px(9), y: this.py(11) };
              this.playerDir = [0, 0];
              this.playerNextDir = [0, 0];
              this.chibi.play("chibi_idle");
              this.ghosts.forEach(gh => {
                gh.x = this.px(gh.startX);
                gh.y = this.py(gh.startY);
                gh.dir = [0, -1];
              });
              this.state = "play";
            });
          } else {
            this.state = "over";
            this.banner.setText("Out of lives! Press any key to retry").setVisible(true);
          }
        }
      }
    });
  }
}

window.PacGame = {
  start(cb) {
    pacOnWinCb = cb || (() => {});
    const canvas = document.getElementById("pac-canvas");
    if (!canvas) return;

    if (typeof Phaser === "undefined") {
      setTimeout(() => window.PacGame.start(cb), 80);
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
      pacPhaserGame.scene.start("PacScene", { stage: 0, lives: 3, onWin: pacOnWinCb });
    }
    canvas.focus({ preventScroll: true });
  },
  stop() {
    if (pacPhaserGame && pacPhaserGame.scene) {
      pacPhaserGame.scene.pause("PacScene");
    }
  }
};

/* ==========================================================================
   7. Game 3: "Run to the Bus Stop" (Side-scrolling Platformer)
   ========================================================================== */
const MARIO_W = 800, MARIO_H = 448;
let marioPhaserGame = null;
let marioOnWinCb = () => {};
const marioKeys = { left: false, right: false, jump: false };

function marioPress(key, isDown) {
  if (key in marioKeys) marioKeys[key] = !!isDown;
}

class MarioScene extends SceneBase {
  constructor() {
    super("MarioScene");
  }

  init(data) {
    this.levelIdx = data?.level || 0;
    this.score = data?.score || 0;
    this.lives = data?.lives !== undefined ? data.lives : 3;
    this.onWin = data?.onWin || marioOnWinCb;
    this.state = "play";
    this.invulnTimer = 0;
    this.checkpointX = 2 * TS;
    this.checkpointY = 10 * TS;
  }

  create() {
    initTexturesForScene(this);

    const s = MARIO_LEVELS[this.levelIdx];
    const lvlGrid = buildLevel(s);
    this.levelWidthPx = s.w * TS;
    this.cameras.main.setBounds(0, 0, this.levelWidthPx, MARIO_H);

    // Parallax Dhaka skyline
    this.bg = this.add.graphics().setScrollFactor(0.35);
    this.bg.fillStyle(0xf0ece6, 1);
    for (let x = 0; x < this.levelWidthPx * 0.4; x += 140) {
      this.bg.fillRect(x + 10, 240, 50, 200);
      this.bg.fillRect(x + 70, 210, 60, 230);
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

    // Top HUD Fixed to Camera
    this.hudLevel = this.add.text(24, 16, "Stage " + (this.levelIdx + 1) + ": " + s.name, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#433a57",
      fontStyle: "bold"
    }).setScrollFactor(0);

    this.hudScore = this.add.text(MARIO_W / 2, 16, "Score: " + this.score, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: "15px",
      color: "#6e7885",
      fontStyle: "bold"
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.hudHeartIcon = this.add.sprite(MARIO_W - 74, 26, "heart").setOrigin(0.5, 0.5).setScrollFactor(0);
    this.hudLives = this.add.text(MARIO_W - 56, 16, "× " + this.lives, {
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

    // Keyboard controls
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

    this._onMarioKeyDown = e => {
      if (!this.sys.isActive()) return;
      if (["ArrowLeft", "KeyA"].includes(e.code)) { e.preventDefault(); setKey("left", true); }
      else if (["ArrowRight", "KeyD"].includes(e.code)) { e.preventDefault(); setKey("right", true); }
      else if (["Space", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); setKey("jump", true); }
    };
    this._onMarioKeyUp = e => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) setKey("left", false);
      else if (["ArrowRight", "KeyD"].includes(e.code)) setKey("right", false);
      else if (["Space", "ArrowUp", "KeyW"].includes(e.code)) setKey("jump", false);
    };
    window.addEventListener("keydown", this._onMarioKeyDown);
    window.addEventListener("keyup", this._onMarioKeyUp);
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", this._onMarioKeyDown);
      window.removeEventListener("keyup", this._onMarioKeyUp);
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

    const camTargetX = Math.max(0, Math.min(this.levelWidthPx - MARIO_W, this.p.x - MARIO_W * 0.4));
    this.cameras.main.scrollX = camTargetX;
  }

  updatePlayerPhysics(dt) {
    const p = this.p;

    const moveLeft = marioKeys.left, moveRight = marioKeys.right, jumpKey = marioKeys.jump;
    const accel = 920, maxSpeed = 220, friction = 820;

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

    if (jumpKey && p.grounded) {
      p.vy = -510;
      p.grounded = false;
      sfx.jump();
    }

    const grav = (p.vy < 0 && jumpKey) ? 1200 : 1800;
    p.vy = Math.min(700, p.vy + grav * dt);

    p.x += p.vx * dt;
    for (const b of this.solidBlocks) {
      if (p.x + p.w / 2 > b.x && p.x - p.w / 2 < b.x + b.w &&
          p.y > b.y && p.y - p.h < b.y + b.h) {
        if (p.vx > 0) p.x = b.x - p.w / 2;
        else if (p.vx < 0) p.x = b.x + b.w + p.w / 2;
        p.vx = 0;
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
          } else if (b.qEntry || this.qBlocks.includes(b)) {
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

    if (p.y > MARIO_H + 50) {
      sfx.hit();
      this.lives--;
      this.hudLives.setText("× " + this.lives);
      if (this.lives > 0) {
        p.x = this.checkpointX;
        p.y = this.checkpointY;
        p.vx = 0; p.vy = 0;
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
      this.hudLives.setText("× " + this.lives);
    } else {
      sfx.coin();
      this.score += 100;
      this.hudScore.setText("Score: " + this.score);
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
          p.vy = -450;
          this.score += 200;
          this.hudScore.setText("Score: " + this.score);
          e.sprite.destroy();
          this.enemies.splice(i, 1);
        } else if (this.invulnTimer <= 0) {
          sfx.hit();
          this.lives--;
          this.hudLives.setText("× " + this.lives);
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
          this.hudLives.setText("× " + this.lives);
        } else if (it.type === "kite") {
          sfx.powerup();
          this.score += 500;
        }
        this.hudScore.setText("Score: " + this.score);
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
        this.showBanner("Checkpoint!", 1200);
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

      this.showBanner(this.levelIdx < 2 ? "You found Totoro! On to next stage..." : "You found Totoro!", 2000);
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

window.MarioGame = {
  start(cb) {
    marioOnWinCb = cb || (() => {});
    marioKeys.left = marioKeys.right = marioKeys.jump = false;
    const canvas = document.getElementById("mario-canvas");
    if (!canvas) return;

    if (typeof Phaser === "undefined") {
      setTimeout(() => window.MarioGame.start(cb), 80);
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
  press: marioPress
};

/* Signal that the games engine module is loaded and ready */
if (typeof window !== "undefined") {
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