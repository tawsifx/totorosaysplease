// js/data/mario-config.js - Levels & Grid Builder for "Run to the Bus Stop"

export const TS = 32;
export const MR = 14;
export const MARIO_W = 800;
export const MARIO_H = 448;

export const MARIO_LEVELS = [
  {
    name: "Dhanmondi Rickshaw Road",
    walker: "rick",
    w: 100,
    start: 2,
    goal: 96,
    ground: [[0, 22], [26, 40], [44, 60], [63, 80], [83, 99]],
    blocks: [[8, 8, 3], [12, 8, 3], [30, 9, 3], [36, 9, 2], [48, 8, 3], [52, 8, 3], [64, 9, 2], [70, 9, 2]],
    q: [[11, 8], [51, 8]],
    coins: [[8, 7, 7], [23, 9, 3], [30, 8, 3], [41, 9, 3], [48, 7, 7], [61, 9, 2], [81, 9, 2]],
    hearts: [[31, 7], [57, 10], [88, 10]],
    kites: [[38, 6], [66, 6]],
    walkers: [16, 34, 50, 68, 90],
    crows: [[56, 10], [78, 10]],
    lamps: [20, 48, 76]
  },
  {
    name: "Hatirjheel Bridge",
    walker: "cng",
    w: 110,
    start: 2,
    goal: 105,
    ground: [[0, 14], [20, 28], [34, 38], [46, 52], [58, 64], [70, 78], [84, 92], [98, 109]],
    blocks: [[17, 10, 1], [31, 10, 1], [40, 9, 2], [41, 10, 1], [43, 10, 1], [55, 10, 1], [67, 10, 1], [80, 9, 2], [81, 10, 1], [95, 10, 1], [22, 8, 2], [25, 8, 2]],
    q: [[24, 8], [48, 8]],
    coins: [[16, 8, 3], [30, 8, 3], [41, 8, 3], [54, 8, 3], [66, 8, 3], [80, 8, 3], [94, 8, 3]],
    hearts: [[24, 10], [61, 10], [88, 10]],
    kites: [[42, 6], [82, 6]],
    walkers: [8, 24, 49, 61, 74, 88, 102],
    crows: [[36, 10], [72, 10], [100, 10]],
    lamps: [10, 26, 48, 74, 88]
  },
  {
    name: "Old Dhaka Rooftops",
    walker: "pedestrian",
    w: 120,
    start: 2,
    goal: 115,
    ground: [[0, 12, 12], [16, 24, 11], [28, 34, 10], [38, 46, 11], [50, 56, 12], [60, 66, 10], [70, 78, 11], [82, 88, 12], [92, 100, 10], [104, 119, 12]],
    blocks: [[24, 8, 2], [46, 8, 2], [78, 8, 2]],
    q: [[20, 8], [42, 8], [64, 7], [96, 7]],
    coins: [[13, 9, 3], [25, 8, 3], [35, 8, 3], [47, 8, 3], [57, 8, 3], [67, 8, 3], [79, 8, 3], [89, 8, 3], [101, 8, 3]],
    hearts: [[31, 8], [63, 8], [97, 8]],
    kites: [[26, 6], [48, 6], [80, 6]],
    walkers: [5, 20, 31, 42, 53, 63, 74, 85, 96, 110],
    crows: [[30, 8], [62, 7], [94, 7]],
    lamps: [6, 20, 42, 64, 86, 108]
  }
];

export function buildLevel(s) {
  const g = Array.from({ length: MR }, () => Array(s.w).fill(" "));
  const set = (x, y, c) => {
    if (x >= 0 && x < s.w && y >= 0 && y < MR) g[y][x] = c;
  };

  s.ground.forEach(([a, b, top = 12]) => {
    for (let x = a; x <= b; x++) {
      for (let y = top; y < MR; y++) {
        set(x, y, "#");
      }
    }
  });

  const groundTop = x => {
    for (let y = 0; y < MR; y++) {
      if (g[y][x] === "#") return y;
    }
    return MR;
  };

  (s.blocks || []).forEach(([x, y, n]) => {
    for (let i = 0; i < n; i++) set(x + i, y, "b");
  });
  (s.q || []).forEach(([x, y]) => set(x, y, "?"));
  (s.coins || []).forEach(([x, y, n]) => {
    for (let i = 0; i < n; i++) set(x + i, y, "c");
  });
  (s.hearts || []).forEach(([x, y]) => set(x, y, "h"));
  (s.kites || []).forEach(([x, y]) => set(x, y, "k"));
  (s.crows || []).forEach(([x, y]) => set(x, y, "f"));
  (s.walkers || []).forEach(x => set(x, groundTop(x) - 1, "r"));
  (s.lamps || []).forEach(x => set(x, groundTop(x) - 1, "L"));
  set(s.start, groundTop(s.start) - 1, "S");
  set(s.goal, groundTop(s.goal) - 1, "T");
  return g.map(r => r.join(""));
}
