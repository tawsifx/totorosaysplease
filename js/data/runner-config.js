// js/data/runner-config.js - Configuration & Level Balancing for "Run to Totoro"

export const RUN_W = 800;
export const RUN_H = 300;
export const RUN_GROUND = 250;
export const RUN_GOAL = 10000; // Balanced distance for engaging pacing (~30-35s run)

export const RUN_PHYSICS = {
  initialSpeed: 260,
  maxSpeed: 380,
  jumpImpulse: -650,
  gravityHolding: 1550,
  gravityFalling: 2200,
  groundY: RUN_GROUND
};

export const RUN_OBSTACLES = {
  spike: { tag: "spike", hitW: 24, hitH: 26, isBug: false },
  rock: { tag: "rock", hitW: 30, hitH: 22, isBug: false },
  rocks: { tag: "rocks", hitW: 58, hitH: 24, isBug: false },
  bug: { tag: "bug", hitW: 22, hitH: 16, isBug: true }
};
