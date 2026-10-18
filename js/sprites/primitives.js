// js/sprites/primitives.js - Procedural Pixel-Art Canvas Drawing Primitives
// Provides sub-pixel grid manipulation, geometric rasterization, and palette transforms.

export const OUT = "#6e7885";
export const WHITE = "#ffffff";
export const SK = "#ffe0c8";
export const SK_SHD = "#ebbfa0";
export const HAIR = "#3d2522";
export const HAIR_HI = "#5c3b36";
export const RED = "#e64961";
export const RED_SHD = "#bd2d45";
export const RED_HI = "#ff8597";
export const YEL = "#f7cb45";
export const YEL_SHD = "#df9e26";
export const ORG = "#e86325";
export const BOOT = "#47a8bd";
export const BOOT_HI = "#7fd4e6";
export const EYE_DARK = "#241d1d";
export const SUIT = "#f7f4fa";
export const SUIT_SHD = "#dfd7eb";
export const PINK = "#e87ea1";
export const PINK_DARK = "#c45b7d";
export const VISOR = "#3d354b";
export const VISOR_GLOW = "#f4a9c4";
export const BP = "#b8c6d9";
export const BP_SHD = "#8fa1b8";

export function makeSprite(w, h, S, draw) {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");

  const a = {
    px: (x, y, col) => {
      g.fillStyle = col;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    },
    rect: (x, y, rw, rh, col) => {
      g.fillStyle = col;
      g.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
    },
    ell: (cx, cy, rx, ry, col) => {
      g.fillStyle = col;
      const minX = Math.max(0, Math.floor(cx - rx)), maxX = Math.min(w - 1, Math.ceil(cx + rx));
      const minY = Math.max(0, Math.floor(cy - ry)), maxY = Math.min(h - 1, Math.ceil(cy + ry));
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1);
        }
      }
    },
    tri: (p, q, r, col) => {
      g.fillStyle = col;
      const minX = Math.max(0, Math.floor(Math.min(p[0], q[0], r[0]))), maxX = Math.min(w - 1, Math.ceil(Math.max(p[0], q[0], r[0])));
      const minY = Math.max(0, Math.floor(Math.min(p[1], q[1], r[1]))), maxY = Math.min(h - 1, Math.ceil(Math.max(p[1], q[1], r[1])));
      const s = (A, B, C) => (A[0] - C[0]) * (B[1] - C[1]) - (B[0] - C[0]) * (A[1] - C[1]);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const P = [x + 0.5, y + 0.5], d1 = s(P, p, q), d2 = s(P, q, r), d3 = s(P, r, p);
          if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) g.fillRect(x, y, 1, 1);
        }
      }
    },
    line: (x0, y0, x1, y1, col) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i++) a.px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col);
    },
    at: (ox, fn) => {
      g.save();
      g.translate(ox, 0);
      fn();
      g.restore();
    },
    outline: (col, sliceW = w) => {
      const d = g.getImageData(0, 0, w, h).data;
      const A = (x, y, refX = x) =>
        x >= 0 && y >= 0 && x < w && y < h &&
        Math.floor(x / sliceW) === Math.floor(refX / sliceW) &&
        d[(y * w + x) * 4 + 3] > 0;
      g.fillStyle = col;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!A(x, y) && (A(x - 1, y, x) || A(x + 1, y, x) || A(x, y - 1, x) || A(x, y + 1, x))) {
            g.fillRect(x, y, 1, 1);
          }
        }
      }
    }
  };

  draw(a);

  const o = document.createElement("canvas");
  o.width = w * S;
  o.height = h * S;
  const og = o.getContext("2d");
  og.imageSmoothingEnabled = false;
  og.drawImage(c, 0, 0, o.width, o.height);
  return o;
}

export function tintCanvas(srcCanvas, tintR, tintG, tintB) {
  if (!srcCanvas || typeof document === "undefined") return null;
  const o = document.createElement("canvas");
  o.width = srcCanvas.width;
  o.height = srcCanvas.height;
  const ctx = o.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(srcCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, o.width, o.height);
  const d = imgData.data;
  const isWhite = tintR === 255 && tintG === 255 && tintB === 255;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 10) {
      if (isWhite) {
        const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
        const val = Math.min(255, Math.round(180 + 75 * lum));
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      } else {
        const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
        d[i] = Math.min(255, Math.round(tintR * (0.3 + 0.7 * lum)));
        d[i + 1] = Math.min(255, Math.round(tintG * (0.3 + 0.7 * lum)));
        d[i + 2] = Math.min(255, Math.round(tintB * (0.3 + 0.7 * lum)));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return o;
}
