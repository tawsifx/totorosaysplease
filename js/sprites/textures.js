// js/sprites/textures.js - Master Sprite Sheet Generators & Texture Initializer
// Builds procedural pixel art canvases and registers Phaser textures & animations.

import {
  makeSprite,
  tintCanvas,
  OUT,
  WHITE,
  SK,
  SK_SHD,
  HAIR,
  HAIR_HI,
  RED,
  RED_SHD,
  RED_HI,
  YEL,
  YEL_SHD,
  ORG,
  BOOT,
  BOOT_HI,
  EYE_DARK,
  SUIT,
  SUIT_SHD,
  PINK,
  PINK_DARK,
  VISOR,
  VISOR_GLOW,
  BP,
  BP_SHD
} from "./primitives.js";

let MASTER_SPRITES = null;

export function buildMasterSprites() {
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

  const heartCanvas = makeSprite(13, 10, 2, a => {
    const palette = {
      B: "#5c0d1b",
      R: "#e62e43",
      D: "#b51a2e",
      W: "#ffffff"
    };
    const rows = [
      "   BB   BB   ",
      "  BRRB BRRB  ",
      " BRWRRBRRRDB ",
      " BRRRRRRRRDB ",
      " BRRRRRRRRDB ",
      "  BRRRRRRDB  ",
      "   BRRRRDB   ",
      "    BRRDB    ",
      "     BDB     ",
      "      B      "
    ];
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (palette[ch]) a.px(x, y, palette[ch]);
      });
    });
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

  const pedestrianCanvas = makeSprite(72, 24, 2, a => {
    const poses = [
      { legs: [[6, 17, 5], [10, 17, 5]], bob: 0, armX: 4, backArmX: 11, shawlDx: 0 },
      { legs: [[5, 16, 6], [11, 18, 4]], bob: -1, armX: 3, backArmX: 12, shawlDx: -1 },
      { legs: [[6, 17, 5], [10, 17, 5]], bob: 0, armX: 5, backArmX: 10, shawlDx: 0 },
      { legs: [[8, 18, 4], [10, 16, 6]], bob: -1, armX: 6, backArmX: 9, shawlDx: 1 }
    ];
    const PANJABI = "#b5372d", PANJABI_SHD = "#82231b", PANJABI_HI = "#d94e43";
    const PAJAMA = "#faf7f2", PAJAMA_SHD = "#ded8ce", SANDAL = "#4d362a", SANDAL_HI = "#7d5946";
    const SHAWL = "#1e7567", SHAWL_SHD = "#134f45", SHAWL_HI = "#32a391", GOLD = "#f7cb45";

    poses.forEach((p, i) => a.at(i * 18, () => {
      const by = p.bob;
      // Soft ground shadow
      a.ell(9, 23, 5.5, 1.4, "rgba(0,0,0,0.18)");
      // Back swinging arm
      a.rect(p.backArmX, 12 + by, 2, 4, PANJABI_SHD);
      a.rect(p.backArmX, 15 + by, 2, 2, SK_SHD);
      // Pajama legs & leather kolhapuri sandals
      p.legs.forEach(([lx, ly, lh]) => {
        a.rect(lx, ly + by, 2, lh - 1, PAJAMA);
        a.px(lx, ly + by, PAJAMA_SHD);
        a.rect(lx - 1, ly + lh - 1 + by, 4, 2, SANDAL);
        a.px(lx + 1, ly + lh - 1 + by, SANDAL_HI);
      });
      // Embroidered Dhaka Panjabi tunic
      a.rect(5, 11 + by, 8, 7, PANJABI);
      a.rect(5, 11 + by, 2, 7, PANJABI_SHD);
      a.rect(7, 11 + by, 3, 4, PANJABI_HI);
      a.rect(5, 17 + by, 8, 1, GOLD);
      // Golden nakshi placket buttons
      a.line(10, 11 + by, 10, 15 + by, PANJABI_SHD);
      a.px(10, 12 + by, GOLD);
      a.px(10, 14 + by, GOLD);
      // Woven shoulder jhola bag
      a.line(7, 11 + by, 5, 16 + by, "#8c583a");
      a.rect(4, 15 + by, 3, 3, "#a86b47");
      a.px(5, 16 + by, GOLD);
      // Flowing emerald shawl with golden fringe
      a.line(6 + p.shawlDx, 11 + by, 4 + p.shawlDx, 17 + by, SHAWL_SHD);
      a.line(7 + p.shawlDx, 11 + by, 5 + p.shawlDx, 17 + by, SHAWL);
      a.line(8 + p.shawlDx, 11 + by, 6 + p.shawlDx, 16 + by, SHAWL_HI);
      a.px(4 + p.shawlDx, 18 + by, GOLD);
      a.px(5 + p.shawlDx, 18 + by, GOLD);
      // Head, wavy hair & expressive face (facing right)
      a.ell(9, 6.5 + by, 4, 3.8, HAIR);
      a.ell(8.5, 5.5 + by, 3.2, 2.2, HAIR_HI);
      a.ell(9.5, 7.2 + by, 3, 2.8, SK_SHD);
      a.ell(9.3, 7 + by, 2.7, 2.6, SK);
      a.rect(6, 4 + by, 5, 2, HAIR);
      a.px(5, 5 + by, HAIR);
      a.px(6, 7 + by, HAIR);
      // Eyebrow, eye with white catchlight & warm smile
      a.line(10, 5 + by, 11, 5 + by, HAIR);
      a.rect(10, 6 + by, 2, 2, EYE_DARK);
      a.px(10, 6 + by, WHITE);
      a.px(10, 8 + by, "#d9756c");
      a.px(11, 8 + by, "#7a3b32");
      // Front swinging arm
      a.rect(p.armX, 12 + by, 2, 4, PANJABI);
      a.px(p.armX + 1, 12 + by, PANJABI_HI);
      a.rect(p.armX, 15 + by, 2, 2, SK);
    }));
    a.outline("#36201d", 18);
  });

  const cngCanvas = makeSprite(44, 17, 2, a => {
    [0, 22].forEach((ox, i) => a.at(ox, () => {
      const by = i === 1 ? -1 : 0;
      // Exhaust chug puffs on rear left
      if (i === 1) {
        a.ell(1.5, 11, 1.4, 1.2, "#eceff1");
        a.px(0, 10, "#cfd8dc");
      } else {
        a.px(1, 12, "#cfd8dc");
      }
      // Domed green canvas canopy & yellow weather trim
      a.ell(10, 4.5 + by, 7.5, 2.8, "#1b5e20");
      a.ell(10, 4.2 + by, 6.8, 2.2, "#43a047");
      a.line(5, 3 + by, 14, 3 + by, "#66bb6a");
      a.rect(3, 4 + by, 14, 2, "#fdd835");
      a.line(3, 5 + by, 16, 5 + by, "#f9a825");
      // Rear passenger cabin & safety grille (famous "Mama CNG" cage)
      a.rect(4, 6 + by, 6, 4, "#1a2421");
      a.line(6, 6 + by, 6, 9 + by, "#81c784");
      a.line(8, 6 + by, 8, 9 + by, "#81c784");
      a.line(4, 8 + by, 9, 8 + by, "#4caf50");
      // Driver compartment & angled glass windshield on right
      a.rect(10, 6 + by, 4, 4, "#263238");
      a.line(11, 7 + by, 13, 9 + by, "#90a4ae");
      a.tri([14, 4 + by], [14, 9 + by], [18, 9 + by], "#29b6f6");
      a.line(14, 5 + by, 17, 8 + by, "#b3e5fc");
      a.px(15, 6 + by, WHITE);
      // Lower green steel body & yellow side stripe
      a.rect(3, 9 + by, 16, 4, "#1b5e20");
      a.rect(3, 9 + by, 15, 3, "#2e7d32");
      a.line(4, 10 + by, 17, 10 + by, "#4caf50");
      a.line(4, 11 + by, 16, 11 + by, "#fdd835");
      // Rear red taillight & front chrome bumper + bright headlamp
      a.rect(2, 9 + by, 1, 2, "#ef5350");
      a.rect(18, 8 + by, 2, 2, "#ffee58");
      a.px(19, 8 + by, WHITE);
      // Front green wheel arch / mudguard
      a.ell(16.5, 12, 3, 2, "#2e7d32");
      a.ell(5.5, 12, 3, 2, "#1b5e20");
      // Rear & front wheels with animated alloy spokes
      a.ell(5.5, 13.5, 2.6, 2.6, "#263238");
      a.ell(16.5, 13.5, 2.6, 2.6, "#263238");
      a.ell(5.5, 13.5, 1.4, 1.4, "#90a4ae");
      a.ell(16.5, 13.5, 1.4, 1.4, "#90a4ae");
      if (i === 0) {
        a.px(5, 13, WHITE); a.px(6, 14, "#cfd8dc");
        a.px(16, 13, WHITE); a.px(17, 14, "#cfd8dc");
      } else {
        a.px(6, 13, WHITE); a.px(5, 14, "#cfd8dc");
        a.px(17, 13, WHITE); a.px(16, 14, "#cfd8dc");
      }
    }));
    a.outline("#113814", 22);
  });

  const rickCanvas = makeSprite(44, 19, 2, a => {
    [0, 22].forEach((ox, i) => a.at(ox, () => {
      const by = i === 1 ? -1 : 0;
      // Ornate Dhaka Rickshaw folding hood (magenta, gold scalloped border & floral dots)
      a.ell(7, 6 + by, 5.5, 4.5, "#ad1457");
      a.ell(7, 5.5 + by, 4.8, 3.8, "#e91e63");
      a.ell(6.5, 4.5 + by, 3.5, 2.4, "#f48fb1");
      // Bamboo hood ribs & festive folk-art motifs
      a.line(7, 2 + by, 4, 7 + by, "#ffd54f");
      a.line(7, 2 + by, 7, 7 + by, "#ffd54f");
      a.px(5, 4 + by, "#00e5ff");
      a.px(8, 4 + by, "#ffeb3b");
      a.px(6, 3 + by, WHITE);
      // Golden scalloped hood trim & rear tassel
      [2, 4, 6, 8, 10].forEach(x => a.px(x, 7 + by, "#ffd54f"));
      a.px(1, 6 + by, "#ff5252");
      // Royal blue passenger seat & painted side panel
      a.rect(3, 8 + by, 8, 4, "#1565c0");
      a.rect(4, 8 + by, 6, 2, "#42a5f5");
      a.rect(3, 10 + by, 8, 2, "#ff8f00");
      a.line(4, 11 + by, 10, 11 + by, "#ffd54f");
      // Slanted cycle chassis, front fork, handlebars & brass bell
      a.line(10, 11 + by, 16, 8 + by, "#43a047");
      a.line(11, 12 + by, 15, 12 + by, "#fbc02d");
      a.line(16, 7 + by, 17, 14, "#78909c");
      a.rect(14, 5 + by, 3, 1, "#eceff1");
      a.px(17, 5 + by, "#ffd54f"); // Brass bell
      a.px(17, 6 + by, "#e91e63"); // Front tassel
      // Painted mudguards over rear and front wheels
      a.ell(6, 13, 3.6, 2, "#e53935");
      a.ell(17, 13, 3.2, 1.8, "#43a047");
      // Large spoked cycle-rickshaw wheels
      a.ell(6, 14.5, 3.2, 3.2, "#263238");
      a.ell(17, 14.5, 3.2, 3.2, "#263238");
      a.ell(6, 14.5, 2.1, 2.1, "#cfd8dc");
      a.ell(17, 14.5, 2.1, 2.1, "#cfd8dc");
      if (i === 0) {
        a.line(4, 14, 8, 15, "#ffffff");
        a.line(6, 12, 6, 17, "#b0bec5");
        a.line(15, 14, 19, 15, "#ffffff");
        a.line(17, 12, 17, 17, "#b0bec5");
      } else {
        a.line(4, 13, 8, 16, "#ffffff");
        a.line(5, 16, 7, 13, "#b0bec5");
        a.line(15, 13, 19, 16, "#ffffff");
        a.line(16, 16, 18, 13, "#b0bec5");
      }
      a.px(6, 14.5, "#ffd54f");
      a.px(17, 14.5, "#ffd54f");
    }));
    a.outline("#263238", 22);
  });

  const crowCanvas = makeSprite(36, 14, 2, a => {
    [0, 18].forEach((ox, i) => a.at(ox, () => {
      const by = i === 0 ? 1 : 0;
      // Fanned dark indigo tail feathers on left (x = 1..5)
      a.tri([1, 6 + by], [5, 6 + by], [1, 9 + by], "#1c1b29");
      a.line(2, 7 + by, 5, 7 + by, "#35334a");
      // Aerodynamic body (x = 4..12)
      a.ell(8, 7.5 + by, 4.2, 2.8, "#1c1b29");
      a.ell(8, 7 + by, 3.6, 2.2, "#2d2b42");
      // Signature Dhaka House Crow (Corvus splendens) ash-grey neck/breast collar
      a.ell(10.5, 6.8 + by, 2.2, 2.2, "#6c7085");
      a.ell(10.5, 6.5 + by, 1.6, 1.6, "#8e94ab");
      // Glossy dark head (x = 11..14) facing right
      a.ell(12.5, 5 + by, 2.2, 2.1, "#1c1b29");
      a.ell(12.2, 4.6 + by, 1.6, 1.4, "#35334a");
      // Sharp curved beak strictly inside frame (x = 14..16, max slice width is 18)
      a.tri([14, 4 + by], [16, 5 + by], [14, 6 + by], "#f5b041");
      a.line(14, 6 + by, 16, 5 + by, "#c27d20");
      // Bright alert eye with white sclera catchlight
      a.px(12, 4 + by, WHITE);
      a.px(13, 4 + by, "#12111a");
      // Tucked talons underneath
      a.px(7, 10 + by, "#e67e22");
      a.px(9, 10 + by, "#e67e22");
      // 2-frame dynamic flapping wing with iridescent violet-blue sheen
      if (i === 0) {
        // Frame 0: High upstroke wing
        a.tri([5, 6 + by], [9, 1], [11, 6 + by], "#252338");
        a.tri([6, 5 + by], [9, 2], [10, 5 + by], "#48466b");
        a.line(7, 4 + by, 9, 2, "#7c7aa6");
        a.px(8, 1, "#7c7aa6");
      } else {
        // Frame 1: Swept-down power stroke wing
        a.tri([5, 6], [8, 12], [11, 6], "#252338");
        a.tri([6, 7], [8, 11], [10, 7], "#48466b");
        a.line(6, 7, 8, 10, "#7c7aa6");
      }
    }));
    a.outline("#12111a", 18);
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

  const chaCupCanvas = makeSprite(12, 12, 2, a => {
    a.ell(6, 3, 4, 1.8, "#d9822b");
    a.ell(6, 2.8, 3.4, 1.2, "#e6a15c");
    a.tri([2, 4], [10, 4], [4, 11], "#b2591f");
    a.tri([10, 4], [8, 11], [4, 11], "#9c4815");
    a.line(6, 0, 7, 2, "rgba(255,255,255,0.7)");
    a.outline("#5e2808");
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
    cng_scared: tintCanvas(cngCanvas, 50, 130, 255),
    rick_scared: tintCanvas(rickCanvas, 50, 130, 255),
    crow_scared: tintCanvas(crowCanvas, 50, 130, 255),
    cng_flash: tintCanvas(cngCanvas, 255, 255, 255),
    rick_flash: tintCanvas(rickCanvas, 255, 255, 255),
    crow_flash: tintCanvas(crowCanvas, 255, 255, 255),
    kite: kiteCanvas,
    fuchka: fuchkaCanvas,
    doi: doiCanvas,
    coin: coinCanvas,
    cha_cup: chaCupCanvas,
    block: blockCanvas,
    qblock: qblockCanvas,
    qblock_spent: qblockSpentCanvas,
    lamp_off: lampOffCanvas,
    lamp_on: lampOnCanvas,
    bussign: bussignCanvas
  };

  return MASTER_SPRITES;
}

export function sliceTexture(scene, key, frameW, frameH, frameCount) {
  if (!scene || !scene.textures) return;
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

export function createAnim(scene, key, texKey, frames, rate, repeat) {
  if (!scene || !scene.anims || scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: frames.map(f => ({ key: texKey, frame: f })),
    frameRate: rate,
    repeat
  });
}

export function initTexturesForScene(scene) {
  if (!scene || !scene.textures) return;
  const masters = buildMasterSprites();
  if (!masters) return;

  for (const [key, canvas] of Object.entries(masters)) {
    if (!scene.textures.exists(key) && canvas) {
      scene.textures.addCanvas(key, canvas);
    }
  }

  sliceTexture(scene, "astro", 22 * 3, 29 * 3, 4);
  sliceTexture(scene, "chibi", 16 * 2, 24 * 2, 4);
  sliceTexture(scene, "pedestrian", 18 * 2, 24 * 2, 4);
  sliceTexture(scene, "cng", 22 * 2, 17 * 2, 2);
  sliceTexture(scene, "rick", 22 * 2, 19 * 2, 2);
  sliceTexture(scene, "crow", 18 * 2, 14 * 2, 2);
  sliceTexture(scene, "cng_scared", 22 * 2, 17 * 2, 2);
  sliceTexture(scene, "rick_scared", 22 * 2, 19 * 2, 2);
  sliceTexture(scene, "crow_scared", 18 * 2, 14 * 2, 2);
  sliceTexture(scene, "cng_flash", 22 * 2, 17 * 2, 2);
  sliceTexture(scene, "rick_flash", 22 * 2, 19 * 2, 2);
  sliceTexture(scene, "crow_flash", 18 * 2, 14 * 2, 2);
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
  createAnim(scene, "cng_run_scared", "cng_scared", [0, 1], 9, -1);
  createAnim(scene, "rick_run_scared", "rick_scared", [0, 1], 7, -1);
  createAnim(scene, "crow_fly_scared", "crow_scared", [0, 1], 8, -1);
  createAnim(scene, "cng_run_flash", "cng_flash", [0, 1], 9, -1);
  createAnim(scene, "rick_run_flash", "rick_flash", [0, 1], 7, -1);
  createAnim(scene, "crow_fly_flash", "crow_flash", [0, 1], 8, -1);
  createAnim(scene, "bug_fly", "bug", [0, 1], 14, -1);
}
