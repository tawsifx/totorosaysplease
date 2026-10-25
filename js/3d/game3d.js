// js/3d/game3d.js - Real-Time In-Game Three.js 3D Engine with Luminous Specular Lighting
// Enhances "Run to the Bus Stop" (Mario) and "Run to Totoro!" (Dino/Runner) with
// bright, gleaming 3D Gold Coins, Steaming Clay Cha Cups, Ruby Hearts, Diamond Kites,
// Question Blocks, Rickshaws, CNGs, Flapping Crows, and Crystalline Obstacles.
// Note: Totoro preserves its authentic 2D pixel-art sprite design with zero 3D override.

import * as THREE from "three";

const SCALE = 0.01; // 100 Phaser pixels = 1.0 Three.js world unit at z = 0

/**
 * Shared Luminous 3D Mesh Builders
 * Uses bright MeshPhongMaterial with vivid specular highlights and self-luminous emissive glow.
 */
export const MeshFactory3D = {
  createCoin() {
    const group = new THREE.Group();

    // Radiant Gold Material with pure white mirror-like specular glint
    const goldMat = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      emissive: 0xffa000,
      emissiveIntensity: 0.38,
      specular: 0xffffff,
      shininess: 180
    });

    const rimMat = new THREE.MeshPhongMaterial({
      color: 0xffea75,
      emissive: 0xffaa00,
      emissiveIntensity: 0.45,
      specular: 0xffffff,
      shininess: 220
    });

    // Coin cylinder disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.038, 24), goldMat);
    disc.rotation.x = Math.PI / 2;
    group.add(disc);

    // Bevelled shiny outer torus rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.018, 10, 24), rimMat);
    group.add(rim);

    // Faceted 3D Star emblem on front & back
    const starMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffe066,
      emissiveIntensity: 0.5,
      specular: 0xffffff,
      shininess: 250
    });
    const starFront = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), starMat);
    starFront.position.z = 0.024;
    starFront.scale.set(1.0, 1.0, 0.35);
    group.add(starFront);

    const starBack = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), starMat);
    starBack.position.z = -0.024;
    starBack.scale.set(1.0, 1.0, 0.35);
    group.add(starBack);

    return group;
  },

  createChaCup() {
    const group = new THREE.Group();

    const clayMat = new THREE.MeshPhongMaterial({
      color: 0xdf6d38,
      emissive: 0x6e2808,
      emissiveIntensity: 0.3,
      specular: 0xffd2b8,
      shininess: 90
    });

    const teaMat = new THREE.MeshPhongMaterial({
      color: 0xf5caa0,
      emissive: 0x8a4b1d,
      emissiveIntensity: 0.45,
      specular: 0xffffff,
      shininess: 180
    });

    // Terracotta clay cup body
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.068, 0.17, 20), clayMat);
    group.add(cup);

    // Lip rim
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.096, 0.016, 8, 20), clayMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.082;
    group.add(lip);

    // Steaming hot milk tea surface
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.015, 16), teaMat);
    tea.position.y = 0.075;
    group.add(tea);

    // Rising steam puffs
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.78 });
    const puffs = [];
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.026 + i * 0.007, 8, 8), steamMat);
      puff.position.set((i - 1) * 0.025, 0.13 + i * 0.048, 0);
      group.add(puff);
      puffs.push(puff);
    }
    group.userData.puffs = puffs;
    return group;
  },

  createHeart() {
    const group = new THREE.Group();
    const heartMat = new THREE.MeshPhongMaterial({
      color: 0xff2a6d,
      emissive: 0x990033,
      emissiveIntensity: 0.45,
      specular: 0xffffff,
      shininess: 190
    });

    const leftLobe = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), heartMat);
    leftLobe.position.set(-0.044, 0.038, 0);
    group.add(leftLobe);

    const rightLobe = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), heartMat);
    rightLobe.position.set(0.044, 0.038, 0);
    group.add(rightLobe);

    const bottomCone = new THREE.Mesh(new THREE.ConeGeometry(0.102, 0.13, 14), heartMat);
    bottomCone.rotation.x = Math.PI;
    bottomCone.position.set(0, -0.038, 0);
    group.add(bottomCone);

    return group;
  },

  createKite() {
    const group = new THREE.Group();
    const kiteMat = new THREE.MeshPhongMaterial({
      color: 0xff1493,
      emissive: 0x660033,
      emissiveIntensity: 0.35,
      specular: 0xfff0aa,
      shininess: 140,
      side: THREE.DoubleSide
    });
    const goldMat = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      emissive: 0x885500,
      emissiveIntensity: 0.45,
      specular: 0xffffff,
      shininess: 200
    });

    // Diamond kite body
    const diamond = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.022), kiteMat);
    diamond.rotation.z = Math.PI / 4;
    group.add(diamond);

    // Inner gold diamond
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.095, 0.03), goldMat);
    inner.rotation.z = Math.PI / 4;
    group.add(inner);

    // Fluttering tail ribbon
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.10, 8), goldMat);
    tail.position.set(0, -0.15, 0);
    group.add(tail);

    return group;
  },

  createQuestionBlock() {
    const group = new THREE.Group();

    const goldMat = new THREE.MeshPhongMaterial({
      color: 0xffc107,
      emissive: 0xff8f00,
      emissiveIntensity: 0.38,
      specular: 0xffffff,
      shininess: 160
    });
    const trimMat = new THREE.MeshPhongMaterial({
      color: 0xffe082,
      emissive: 0xffa000,
      emissiveIntensity: 0.42,
      specular: 0xffffff,
      shininess: 220
    });
    const emblemMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.75,
      specular: 0xffffff,
      shininess: 250
    });

    // Core cube
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), goldMat);
    group.add(core);

    // Raised polished frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.31, 0.24), trimMat);
    group.add(frame);

    // Luminous "?" relief on front
    const qTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.048, 0.032), emblemMat);
    qTop.position.set(0, 0.068, 0.145);
    group.add(qTop);

    const qMid = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.065, 0.032), emblemMat);
    qMid.position.set(0.035, 0.026, 0.145);
    group.add(qMid);

    const qDot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.032), emblemMat);
    qDot.position.set(0, -0.072, 0.145);
    group.add(qDot);

    group.userData = { core, frame };
    return group;
  },

  createBrickBlock(colorHex = 0xc96846) {
    const group = new THREE.Group();
    const brickMat = new THREE.MeshPhongMaterial({
      color: colorHex,
      emissive: 0x3d1a10,
      emissiveIntensity: 0.22,
      specular: 0xffd8cc,
      shininess: 70
    });
    const mortarMat = new THREE.MeshPhongMaterial({
      color: 0x73351f,
      emissive: 0x240e07,
      emissiveIntensity: 0.18,
      specular: 0xaa6655,
      shininess: 40
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.30, 0.24), mortarMat);
    group.add(base);

    const topBrick = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.26), brickMat);
    topBrick.position.set(0, 0.065, 0);
    group.add(topBrick);

    const botLeft = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.26), brickMat);
    botLeft.position.set(-0.072, -0.065, 0);
    group.add(botLeft);

    const botRight = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.26), brickMat);
    botRight.position.set(0.072, -0.065, 0);
    group.add(botRight);

    return group;
  },

  createRickshaw() {
    const group = new THREE.Group();
    const hoodMat = new THREE.MeshPhongMaterial({ color: 0xff2a55, emissive: 0x5a0014, emissiveIntensity: 0.3, specular: 0xffffff, shininess: 120 });
    const trimMat = new THREE.MeshPhongMaterial({ color: 0xffd700, emissive: 0x774400, emissiveIntensity: 0.4, specular: 0xffffff, shininess: 200 });
    const seatMat = new THREE.MeshPhongMaterial({ color: 0x00b4d8, emissive: 0x003f5c, emissiveIntensity: 0.25, specular: 0xddf4ff, shininess: 100 });
    const tireMat = new THREE.MeshPhongMaterial({ color: 0x22222b, specular: 0x666677, shininess: 50 });
    const chromeMat = new THREE.MeshPhongMaterial({ color: 0xf5f5f5, specular: 0xffffff, shininess: 240 });

    // Canopy Hood
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 14, 1, false, 0, Math.PI), hoodMat);
    hood.rotation.x = Math.PI / 2;
    hood.position.set(-0.08, 0.18, 0);
    group.add(hood);

    // Gold trim band
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.23), trimMat);
    band.position.set(-0.08, 0.18, 0);
    group.add(band);

    // Seat & frame
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.20), seatMat);
    seat.position.set(-0.08, 0.11, 0);
    group.add(seat);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.16), chromeMat);
    chassis.position.set(0.0, 0.07, 0);
    group.add(chassis);

    // Front fork
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), chromeMat);
    fork.position.set(0.14, 0.14, 0);
    fork.rotation.z = 0.2;
    group.add(fork);

    // 3D Spoked wheels
    const wheels = [];
    [
      [-0.10, 0.075, 0.11],
      [-0.10, 0.075, -0.11],
      [0.16, 0.075, 0.0]
    ].forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.016, 8, 16), tireMat);
      wGroup.add(tire);
      const sp1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.012), chromeMat);
      const sp2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.12, 0.012), chromeMat);
      wGroup.add(sp1, sp2);
      group.add(wGroup);
      wheels.push(wGroup);
    });

    group.userData.wheels = wheels;
    return group;
  },

  createCNG() {
    const group = new THREE.Group();
    const greenMat = new THREE.MeshPhongMaterial({ color: 0x00c853, emissive: 0x004d1a, emissiveIntensity: 0.32, specular: 0xd4ffd4, shininess: 150 });
    const roofMat = new THREE.MeshPhongMaterial({ color: 0x212529, specular: 0x555566, shininess: 60 });
    const glassMat = new THREE.MeshPhongMaterial({ color: 0xe0f7fa, emissive: 0x003344, emissiveIntensity: 0.15, specular: 0xffffff, shininess: 220 });
    const lampMat = new THREE.MeshPhongMaterial({ color: 0xffea00, emissive: 0xffd600, emissiveIntensity: 0.95, specular: 0xffffff, shininess: 250 });
    const tireMat = new THREE.MeshPhongMaterial({ color: 0x1a1a24, specular: 0x555566, shininess: 50 });

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.22), greenMat);
    cabin.position.set(0, 0.11, 0);
    group.add(cabin);

    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.13, 12), greenMat);
    nose.position.set(0.16, 0.11, 0);
    group.add(nose);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.04, 0.21), roofMat);
    roof.position.set(-0.02, 0.24, 0);
    group.add(roof);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.18), glassMat);
    glass.position.set(0.12, 0.19, 0);
    glass.rotation.z = 0.22;
    group.add(glass);

    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), lampMat);
    headlight.position.set(0.22, 0.12, 0);
    group.add(headlight);

    const wheels = [];
    [
      [-0.11, 0.055, 0.11],
      [-0.11, 0.055, -0.11],
      [0.16, 0.055, 0]
    ].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 8, 14), tireMat);
      w.position.set(wx, wy, wz);
      group.add(w);
      wheels.push(w);
    });

    group.userData.wheels = wheels;
    return group;
  },

  createCrow() {
    const group = new THREE.Group();
    const featherMat = new THREE.MeshPhongMaterial({ color: 0x2b2d42, emissive: 0x10111a, emissiveIntensity: 0.25, specular: 0x88bbff, shininess: 150 });
    const wingMat = new THREE.MeshPhongMaterial({ color: 0x3d405b, emissive: 0x161824, emissiveIntensity: 0.28, specular: 0x99ccff, shininess: 160 });
    const beakMat = new THREE.MeshPhongMaterial({ color: 0xffc107, emissive: 0x664400, emissiveIntensity: 0.45, specular: 0xffffff, shininess: 200 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), featherMat);
    body.scale.set(1.35, 0.85, 0.9);
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), featherMat);
    head.position.set(0.09, 0.04, 0);
    group.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.08, 8), beakMat);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.16, 0.04, 0);
    group.add(beak);

    const wingGeo = new THREE.BoxGeometry(0.11, 0.018, 0.16);
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(0, 0.02, 0.09);
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0, 0.02, -0.09);
    group.add(wingR);

    group.userData = { wingL, wingR };
    return group;
  },

  createRockCluster(isLarge = false) {
    const group = new THREE.Group();
    const rockMat = new THREE.MeshPhongMaterial({
      color: 0x9e9287,
      emissive: 0x2d2621,
      emissiveIntensity: 0.2,
      specular: 0xffffff,
      shininess: 120,
      flatShading: true
    });
    const accentMat = new THREE.MeshPhongMaterial({
      color: 0xbdb0a4,
      emissive: 0x332a24,
      emissiveIntensity: 0.2,
      specular: 0xffffff,
      shininess: 130,
      flatShading: true
    });

    const mainRock = new THREE.Mesh(new THREE.DodecahedronGeometry(isLarge ? 0.16 : 0.13, 0), rockMat);
    mainRock.position.set(0, 0.11, 0);
    mainRock.rotation.set(0.3, 0.5, 0.2);
    group.add(mainRock);

    if (isLarge) {
      const side1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), accentMat);
      side1.position.set(-0.15, 0.08, 0.04);
      side1.rotation.set(0.8, 0.2, 0.4);
      group.add(side1);

      const side2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.10, 0), rockMat);
      side2.position.set(0.15, 0.07, -0.03);
      side2.rotation.set(0.1, 0.9, 0.6);
      group.add(side2);
    }

    return group;
  },

  createSpikeHazard() {
    const group = new THREE.Group();
    const coneMat = new THREE.MeshPhongMaterial({
      color: 0xf72585,
      emissive: 0x66002b,
      emissiveIntensity: 0.35,
      specular: 0xffffff,
      shininess: 180
    });
    const bandMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffea75,
      emissiveIntensity: 0.4,
      specular: 0xffffff,
      shininess: 220
    });

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 12), coneMat);
    spike.position.set(0, 0.13, 0);
    group.add(spike);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.015, 8, 14), bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 0.12, 0);
    group.add(band);

    return group;
  },

  createCloud3D() {
    const group = new THREE.Group();
    const cloudMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xddeeff,
      emissiveIntensity: 0.2,
      specular: 0xffffff,
      shininess: 80,
      transparent: true,
      opacity: 0.78
    });
    const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), cloudMat);
    const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), cloudMat);
    p2.position.set(-0.14, -0.03, 0.02);
    const p3 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), cloudMat);
    p3.position.set(0.14, -0.02, -0.02);
    group.add(p1, p2, p3);
    return group;
  }
};

/**
 * Base Three.js Overlay Controller with Multi-Angle Studio Lighting
 */
class BaseGame3DFX {
  constructor(canvasId, width, height) {
    this.canvasId = canvasId;
    this.width = width;
    this.height = height;
    this.wUnits = width * SCALE;
    this.hUnits = height * SCALE;

    this.scene = new THREE.Scene();
    const fov = 38;
    this.camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
    this.camZ = (this.hUnits / 2) / Math.tan((fov * Math.PI) / 360);
    this.camera.position.set(0, 0, this.camZ);
    this.camera.lookAt(0, 0, 0);

    this.renderer = null;
    this.domElement = null;

    this._initRenderer();
    this._initLights();
  }

  _initRenderer() {
    if (typeof document === "undefined") return;
    const hostCanvas = document.getElementById(this.canvasId);
    const parent = hostCanvas ? hostCanvas.parentElement : null;
    if (!parent) return;

    const existing = parent.querySelector(".game-3d-overlay");
    if (existing) existing.remove();

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(this.width, this.height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.domElement = this.renderer.domElement;
      this.domElement.className = "game-3d-overlay";
      this.domElement.setAttribute("aria-hidden", "true");
      parent.appendChild(this.domElement);
    } catch (_) {
      this.renderer = null;
    }
  }

  _initLights() {
    // 1. Strong Ambient Base (prevents dark unlit faces)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    this.scene.add(this.ambientLight);

    // 2. Natural Sky & Ground Contrast
    this.hemiLight = new THREE.HemisphereLight(0xfffaed, 0x90a4ae, 1.3);
    this.scene.add(this.hemiLight);

    // 3. Bright Key Light from Front-Top-Right (creates brilliant specular glints)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    this.keyLight.position.set(4, 6, 8);
    this.scene.add(this.keyLight);

    // 4. Warm Rim/Fill Light from Left (ensures edge radiance)
    this.rimLight = new THREE.DirectionalLight(0xfff0dd, 1.8);
    this.rimLight.position.set(-5, 3, 6);
    this.scene.add(this.rimLight);

    // 5. Specular PointLight tracking player/camera
    this.pointLight = new THREE.PointLight(0xfff8d6, 2.4, 14, 1.0);
    this.pointLight.position.set(0, 0.8, 2.5);
    this.scene.add(this.pointLight);
  }

  toX(sx) {
    return (sx - this.width / 2) * SCALE;
  }

  toY(sy) {
    return (this.height / 2 - sy) * SCALE;
  }

  render() {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.domElement && this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.scene) {
      this.scene.clear();
    }
  }
}

/**
 * Runner3DFX - In-Game Three.js 3D Engine for Level 5: "Run to Totoro!"
 * Totoro retains its original 2D sprite design with zero 3D override.
 */
export class Runner3DFX extends BaseGame3DFX {
  constructor(phaserScene) {
    super("game-canvas", 800, 300);
    this.phaserScene = phaserScene;
    this.itemMeshes = new Map();
    this.obsMeshes = new Map();
    this.clouds3D = [];

    // 3D Parallax Clouds in deep Z-space
    for (let i = 0; i < 4; i++) {
      const c = MeshFactory3D.createCloud3D();
      c.position.set((i - 1.5) * 2.2, 0.85 + (i % 2) * 0.25, -0.8);
      this.scene.add(c);
      this.clouds3D.push({ mesh: c, speed: 0.25 + (i % 3) * 0.08 });
    }
  }

  sync(time, dt) {
    const sc = this.phaserScene;
    if (!sc) return;

    // 1. Update 3D Parallax Clouds
    for (const c of this.clouds3D) {
      c.mesh.position.x -= c.speed * dt;
      if (c.mesh.position.x < -4.8) c.mesh.position.x = 4.8;
    }

    // 2. Sync Luminous 3D Collectibles (Brilliant Gold Coins & Steaming Clay Cha Cups)
    const activeItems = new Set(sc.itemList || []);
    for (const [it, mesh] of this.itemMeshes.entries()) {
      if (!activeItems.has(it) || !it.sprite || !it.sprite.active) {
        this.scene.remove(mesh);
        this.itemMeshes.delete(it);
      }
    }

    for (const it of activeItems) {
      if (!it.sprite || !it.sprite.active) continue;
      let mesh = this.itemMeshes.get(it);
      if (!mesh) {
        mesh = it.key === "cha_cup" ? MeshFactory3D.createChaCup() : MeshFactory3D.createCoin();
        this.scene.add(mesh);
        this.itemMeshes.set(it, mesh);
        if (this.renderer) it.sprite.setAlpha(0.01);
      }
      mesh.position.set(this.toX(it.sprite.x), this.toY(it.sprite.y), 0.12);

      // Dynamic rotation with sweeping specular glints
      mesh.rotation.y = time * 0.0055 + (it.phase || 0);
      mesh.rotation.x = Math.sin(time * 0.004 + (it.phase || 0)) * 0.22;
      mesh.rotation.z = Math.cos(time * 0.003 + (it.phase || 0)) * 0.16;

      if (mesh.userData.puffs) {
        mesh.userData.puffs.forEach((p, idx) => {
          p.position.y = 0.12 + ((time * 0.0016 + idx * 0.33) % 1) * 0.13;
        });
      }
    }

    // 3. Sync Luminous 3D Obstacles (Crystalline Boulders, Spikes, Flapping Bugs)
    const activeObs = new Set(sc.obsList || []);
    for (const [o, mesh] of this.obsMeshes.entries()) {
      if (!activeObs.has(o) || !o.sprite || !o.sprite.active) {
        this.scene.remove(mesh);
        this.obsMeshes.delete(o);
      }
    }

    for (const o of activeObs) {
      if (!o.sprite || !o.sprite.active) continue;
      let mesh = this.obsMeshes.get(o);
      if (!mesh) {
        if (o.isBug) {
          mesh = MeshFactory3D.createCrow();
        } else if (o.hitW >= 50) {
          mesh = MeshFactory3D.createRockCluster(true);
        } else if (o.hitH >= 25) {
          mesh = MeshFactory3D.createSpikeHazard();
        } else {
          mesh = MeshFactory3D.createRockCluster(false);
        }
        this.scene.add(mesh);
        this.obsMeshes.set(o, mesh);
        if (this.renderer) o.sprite.setAlpha(0.01);
      }

      const sy = o.isBug ? o.sprite.y : o.sprite.y;
      mesh.position.set(this.toX(o.sprite.x), this.toY(sy), 0.1);
      if (o.isBug) {
        mesh.rotation.y = Math.PI;
        if (mesh.userData.wingL && mesh.userData.wingR) {
          const flap = Math.sin(time * 0.02) * 0.7;
          mesh.userData.wingL.rotation.x = flap;
          mesh.userData.wingR.rotation.x = -flap;
        }
      }
    }

    // Dynamic light tracking player
    if (sc.astro) {
      this.pointLight.position.x = this.toX(sc.astro.x);
      this.pointLight.position.y = this.toY(sc.astro.y - 35);
    }

    this.render();
  }
}

/**
 * Mario3DFX - In-Game Three.js 3D Engine for Level 7: "Run to the Bus Stop"
 * Totoro retains its original 2D pixel-art sprite design with zero 3D override.
 */
export class Mario3DFX extends BaseGame3DFX {
  constructor(phaserScene) {
    super("mario-canvas", 800, 448);
    this.phaserScene = phaserScene;
    this.blockMeshes = new Map();
    this.itemMeshes = new Map();
    this.enemyMeshes = new Map();

    this._applyStageLighting(phaserScene.levelIdx || 0);
    this._buildBlocks3D();
  }

  _applyStageLighting(stageIdx) {
    if (stageIdx === 0) {
      // Dhanmondi Sunset: Warm golden radiance
      this.ambientLight.color.setHex(0xfffaf0);
      this.ambientLight.intensity = 1.9;
      this.keyLight.color.setHex(0xfff5e0);
      this.keyLight.intensity = 2.8;
      this.rimLight.color.setHex(0xffe2b3);
    } else if (stageIdx === 1) {
      // Hatirjheel Twilight: Vibrant rose-gold luster
      this.ambientLight.color.setHex(0xfff0f5);
      this.ambientLight.intensity = 1.8;
      this.keyLight.color.setHex(0xffe6f0);
      this.keyLight.intensity = 2.7;
      this.rimLight.color.setHex(0xff99bb);
    } else {
      // Old Dhaka Night: Crisp lantern radiance
      this.ambientLight.color.setHex(0xede7f6);
      this.ambientLight.intensity = 1.7;
      this.keyLight.color.setHex(0xfff8e7);
      this.keyLight.intensity = 2.9;
      this.rimLight.color.setHex(0xffd54f);
      this.pointLight.intensity = 3.2;
    }
  }

  _buildBlocks3D() {
    const sc = this.phaserScene;
    if (!sc || !sc.solidBlocks) return;
    const brickColor = sc.levelIdx === 1 ? 0x8e6c88 : sc.levelIdx === 2 ? 0x6c7a89 : 0xc96846;
    const qSet = new Set(sc.qBlocks || []);

    for (const b of sc.solidBlocks) {
      const isQ = qSet.has(b);
      if (isQ || b.isBrick) {
        const mesh = isQ
          ? MeshFactory3D.createQuestionBlock()
          : MeshFactory3D.createBrickBlock(brickColor);
        this.scene.add(mesh);
        this.blockMeshes.set(b, { mesh, isQ, bumpOffset: 0, bumpVel: 0 });
        if (this.renderer && b.sprite) {
          b.sprite.setAlpha(0.01);
        }
      }
    }
  }

  onBlockBump(b) {
    const entry = this.blockMeshes.get(b);
    if (entry) {
      entry.bumpVel = 1.8;
      if (entry.mesh.userData && entry.mesh.userData.core) {
        entry.mesh.userData.core.material.color.setHex(0x9e8c7a);
        entry.mesh.userData.core.material.emissiveIntensity = 0.1;
      }
    }
  }

  sync(time, dt) {
    const sc = this.phaserScene;
    if (!sc || !sc.cameras || !sc.cameras.main) return;
    const camX = sc.cameras.main.scrollX;

    // 1. Sync 3D Extruded Blocks with 3D Depth
    for (const [b, entry] of this.blockMeshes.entries()) {
      const sx = b.x + 16 - camX;
      if (sx < -60 || sx > 860) {
        entry.mesh.visible = false;
        continue;
      }
      entry.mesh.visible = true;

      if (entry.bumpVel !== 0 || entry.bumpOffset > 0) {
        entry.bumpOffset += entry.bumpVel * dt;
        entry.bumpVel -= 9.5 * dt;
        if (entry.bumpOffset <= 0) {
          entry.bumpOffset = 0;
          entry.bumpVel = 0;
          entry.mesh.rotation.y = 0;
        } else {
          entry.mesh.rotation.y += dt * 10;
        }
      } else if (entry.isQ && !b.used) {
        entry.mesh.rotation.y = Math.sin(time * 0.0035 + b.x * 0.01) * 0.18;
      }

      entry.mesh.position.set(this.toX(sx), this.toY(b.y + 16) + entry.bumpOffset, 0.05);
    }

    // 2. Sync Luminous 3D Collectibles (Gold Coins, Hearts, Kites)
    const activeItems = new Set(sc.items || []);
    for (const [it, mesh] of this.itemMeshes.entries()) {
      if (!activeItems.has(it) || !it.sprite || !it.sprite.active) {
        this.scene.remove(mesh);
        this.itemMeshes.delete(it);
      }
    }

    for (const it of activeItems) {
      if (!it.sprite || !it.sprite.active) continue;
      let mesh = this.itemMeshes.get(it);
      if (!mesh) {
        if (it.type === "heart") mesh = MeshFactory3D.createHeart();
        else if (it.type === "kite") mesh = MeshFactory3D.createKite();
        else mesh = MeshFactory3D.createCoin();
        this.scene.add(mesh);
        this.itemMeshes.set(it, mesh);
        if (this.renderer) it.sprite.setAlpha(0.01);
      }

      const sx = it.sprite.x - camX;
      if (sx < -50 || sx > 850) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.set(this.toX(sx), this.toY(it.sprite.y), 0.14);

      if (it.type === "kite") {
        mesh.rotation.z = Math.sin(time * 0.0035 + (it.phase || 0)) * 0.22;
        mesh.rotation.y = Math.cos(time * 0.0045 + (it.phase || 0)) * 0.35;
      } else {
        mesh.rotation.y = time * 0.0055 + (it.phase || 0);
        mesh.rotation.x = Math.sin(time * 0.004 + (it.phase || 0)) * 0.22;
        mesh.rotation.z = Math.cos(time * 0.003 + (it.phase || 0)) * 0.16;
      }
    }

    // 3. Sync Luminous 3D Vehicles & Enemies (Rickshaws, CNGs, Flapping Crows)
    const activeEnemies = new Set(sc.enemies || []);
    for (const [e, mesh] of this.enemyMeshes.entries()) {
      if (!activeEnemies.has(e) || !e.sprite || !e.sprite.active) {
        this.scene.remove(mesh);
        this.enemyMeshes.delete(e);
      }
    }

    for (const e of activeEnemies) {
      if (!e.sprite || !e.sprite.active) continue;
      let mesh = this.enemyMeshes.get(e);
      if (!mesh) {
        if (e.isFlyer) mesh = MeshFactory3D.createCrow();
        else if (e.key === "cng" || (e.sprite.texture && e.sprite.texture.key === "cng")) mesh = MeshFactory3D.createCNG();
        else mesh = MeshFactory3D.createRickshaw();
        this.scene.add(mesh);
        this.enemyMeshes.set(e, mesh);
        if (this.renderer) e.sprite.setAlpha(0.01);
      }

      const sx = e.sprite.x - camX;
      if (sx < -70 || sx > 870) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.set(this.toX(sx), this.toY(e.sprite.y), 0.15);

      const targetYaw = e.vx < 0 ? Math.PI : 0;
      mesh.rotation.y += (targetYaw - mesh.rotation.y) * Math.min(1, dt * 12);

      if (mesh.userData.wheels) {
        for (const w of mesh.userData.wheels) {
          w.rotation.z -= Math.abs(e.vx) * dt * 0.14;
        }
      } else if (mesh.userData.wingL && mesh.userData.wingR) {
        const flap = Math.sin(time * 0.018 + (e.phase || 0)) * 0.68;
        mesh.userData.wingL.rotation.x = flap;
        mesh.userData.wingR.rotation.x = -flap;
        mesh.rotation.z = Math.cos(time * 0.005 + (e.phase || 0)) * 0.12;
      }
    }

    // Dynamic light tracking player
    if (sc.p) {
      this.pointLight.position.x = this.toX(sc.p.x - camX);
      this.pointLight.position.y = this.toY(sc.p.y - 20);
    }

    this.render();
  }
}
