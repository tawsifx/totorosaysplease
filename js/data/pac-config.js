// js/data/pac-config.js - Configuration, Mazes, and Stages for "Fuchka Chase"

export const PC = 19; // Columns
export const PR = 13; // Rows
export const PAC_T = 30; // Tile dimension in pixels
export const PAC_W = 640;
export const PAC_H = 470;
export const PAC_OX = Math.round((PAC_W - PC * PAC_T) / 2);
export const PAC_OY = 44;

export const rng = seed => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

export function makeMaze(seed) {
  const r = rng(seed);
  const g = Array.from({ length: PR }, () => Array(PC).fill("#"));
  const seen = new Set(["1,1"]);
  const stack = [[1, 1]];
  g[1][1] = " ";

  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = [[2, 0], [-2, 0], [0, 2], [0, -2]]
      .map(([dx, dy]) => [x + dx, y + dy, dx, dy])
      .filter(([nx, ny]) => nx >= 1 && nx <= 9 && ny >= 1 && ny <= PR - 2 && !seen.has(nx + "," + ny));

    if (!nb.length) {
      stack.pop();
      continue;
    }
    const [nx, ny, dx, dy] = nb[Math.floor(r() * nb.length)];
    g[y + dy / 2][x + dx / 2] = " ";
    g[ny][nx] = " ";
    seen.add(nx + "," + ny);
    stack.push([nx, ny]);
  }

  const open = (x, y) => g[y][x] !== "#";
  for (let y = 1; y < PR - 1; y += 2) {
    for (let x = 1; x <= 9; x += 2) {
      const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
      const ways = dirs.filter(([dx, dy]) => open(x + dx / 2, y + dy / 2));
      const walls = dirs.filter(([dx, dy]) => !open(x + dx / 2, y + dy / 2) && x + dx >= 1 && x + dx <= 9 && y + dy >= 1 && y + dy <= PR - 2);
      if (walls.length && (ways.length === 1 || r() < 0.22)) {
        const [dx, dy] = walls[Math.floor(r() * walls.length)];
        g[y + dy / 2][x + dx / 2] = " ";
      }
    }
  }

  // Mirror horizontally for symmetrical Dhaka arcade layout
  for (let y = 0; y < PR; y++) {
    for (let x = 0; x < 9; x++) {
      g[y][PC - 1 - x] = g[y][x];
    }
  }

  return g.map(row => row.join(""));
}

export const PAC_STAGES = [
  { name: "TSC Adda", seed: 11, wall: 0xefc9d4, ghosts: ["cng", "rick"], speed: 92 },
  { name: "Old Dhaka Lanes", seed: 23, wall: 0xc9dcef, ghosts: ["cng", "rick", "crow"], speed: 100 },
  { name: "Hatirjheel at Night", seed: 37, wall: 0xcfe6d3, ghosts: ["cng", "rick", "crow"], speed: 108 }
];
