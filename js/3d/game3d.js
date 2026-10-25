// js/3d/game3d.js - Real-Time In-Game Three.js 3D Engine & Effects Layer
// Enhances "Run to the Bus Stop" (Mario) and "Run to Totoro!" (Dino/Runner) directly inside the game canvas
// with 3D Rickshaws, 3D CNGs, 3D Flapping Crows, 3D Extruded ? Blocks, 3D Spinning Gold Coins,
// 3D Steaming Clay Cha Cups, 3D Crystalline Obstacles, 3D Voxel Totoro, and 3D Torus Shockwaves.

import * as THREE from "three";

const SCALE = 0.01; // 100 Phaser pixels = 1.0 Three.js world unit at z = 0

/**
 * Shared 3D Mesh Builders (Totoro, Coins, Hearts, Cha Cups, Vehicles, Obstacles, Particles)
 */
export const MeshFactory3D = {
  createCoin() {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffcf40,
      metalness: 0.72,
      roughness: 0.22,
      emissive: 0x5a3e00,
      emissiveIntensity: 0.25
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffe875,
      metalness: 0.8,
      roughness: 0.18
    });

    // Coin disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.036, 20), goldMat);
    disc.rotation.x = Math.PI / 2;
    group.add(disc);

    // Embossed outer torus rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.018, 8, 20), rimMat);
    group.add(rim);

    // Center emblem bar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.048), rimMat);
    group.add(bar);

    return group;
  },

  createChaCup() {
    const group = new THREE.Group();
    const clayMat = new THREE.MeshStandardMaterial({
      color: 0xc86432,
      roughness: 0.65,
      metalness: 0.08
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xdf7f42,
      roughness: 0.55
    });
    const teaMat = new THREE.MeshStandardMaterial({
      color: 0xe6b88a,
      roughness: 0.25,
      metalness: 0.15,
      emissive: 0x4a2c11,
      emissiveIntensity: 0.2
    });

    // Tapered terracotta bhar (clay cup)
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.065, 0.16, 16), clayMat);
    group.add(cup);

    // Lip rim
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.014, 8, 16), rimMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.075;
    group.add(lip);

    // Milk tea liquid surface
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.015, 14), teaMat);
    tea.position.y = 0.068;
    group.add(tea);

    // 3D Steam puffs
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
    const puffs = [];
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.025 + i * 0.006, 8, 8), steamMat);
      puff.position.set((i - 1) * 0.025, 0.12 + i * 0.045, 0);
      group.add(puff);
      puffs.push(puff);
    }
    group.userData.puffs = puffs;
    return group;
  },

  createHeart() {
    const group = new THREE.Group();
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xf25c84,
      roughness: 0.25,
      metalness: 0.15,
      emissive: 0x6e1430,
      emissiveIntensity: 0.35
    });

    const leftLobe = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), heartMat);
    leftLobe.position.set(-0.042, 0.035, 0);
    group.add(leftLobe);

    const rightLobe = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), heartMat);
    rightLobe.position.set(0.042, 0.035, 0);
    group.add(rightLobe);

    const bottomCone = new THREE.Mesh(new THREE.ConeGeometry(0.098, 0.12, 12), heartMat);
    bottomCone.rotation.x = Math.PI;
    bottomCone.position.set(0, -0.035, 0);
    group.add(bottomCone);

    return group;
  },

  createKite() {
    const group = new THREE.Group();
    const kiteMat = new THREE.MeshStandardMaterial({
      color: 0xff5e8e,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      roughness: 0.3
    });

    // Diamond body (rotated 3D box)
    const diamond = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.02), kiteMat);
    diamond.rotation.z = Math.PI / 4;
    group.add(diamond);

    // Inner gold diamond
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.028), accentMat);
    inner.rotation.z = Math.PI / 4;
    group.add(inner);

    // Tail ribbons
    const tail1 = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 6), accentMat);
    tail1.position.set(0, -0.14, 0);
    group.add(tail1);

    return group;
  },

  createQuestionBlock() {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf7b93e,
      metalness: 0.45,
      roughness: 0.28,
      emissive: 0x4d3200,
      emissiveIntensity: 0.18
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xffe07d,
      metalness: 0.55,
      roughness: 0.2
    });
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e7,
      emissive: 0xffea9f,
      emissiveIntensity: 0.4
    });

    // Core 3D extruded block
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), goldMat);
    group.add(core);

    // Raised bevel frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.305, 0.305, 0.22), trimMat);
    group.add(frame);

    // 3D "?" emblem relief on front
    const qTop = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.03), dotMat);
    qTop.position.set(0, 0.065, 0.145);
    group.add(qTop);

    const qMid = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.03), dotMat);
    qMid.position.set(0.03, 0.025, 0.145);
    group.add(qMid);

    const qDot = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.048, 0.03), dotMat);
    qDot.position.set(0, -0.07, 0.145);
    group.add(qDot);

    group.userData = { core, frame, used: false };
    return group;
  },

  createBrickBlock(colorHex = 0xc96846) {
    const group = new THREE.Group();
    const brickMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.65,
      metalness: 0.08
    });
    const mortarMat = new THREE.MeshStandardMaterial({
      color: 0x8f4329,
      roughness: 0.8
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.30, 0.24), mortarMat);
    group.add(base);

    // Upper and lower 3D brick courses
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
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xe63956, roughness: 0.4 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.5, roughness: 0.25 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x118ab2, roughness: 0.5 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.7 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 0.7, roughness: 0.25 });

    // 3D Hood Canopy (Dhaka colorful rickshaw hood)
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 12, 1, false, 0, Math.PI), hoodMat);
    hood.rotation.x = Math.PI / 2;
    hood.position.set(-0.08, 0.18, 0);
    group.add(hood);

    // Gold decorative hood band
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.035, 0.23), trimMat);
    band.position.set(-0.08, 0.18, 0);
    group.add(band);

    // Passenger Seat & Footboard
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.20), seatMat);
    seat.position.set(-0.08, 0.11, 0);
    group.add(seat);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.16), frameMat);
    chassis.position.set(0.0, 0.07, 0);
    group.add(chassis);

    // Handlebars & Front fork
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), frameMat);
    fork.position.set(0.14, 0.14, 0);
    fork.rotation.z = 0.2;
    group.add(fork);

    // 3D Spoked Wheels (Rear pair + Front wheel)
    const wheels = [];
    const wheelPositions = [
      [-0.10, 0.075, 0.11],
      [-0.10, 0.075, -0.11],
      [0.16, 0.075, 0.0]
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.016, 8, 16), tireMat);
      wGroup.add(tire);
      const spoke1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.012), frameMat);
      const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.12, 0.012), frameMat);
      wGroup.add(spoke1, spoke2);
      group.add(wGroup);
      wheels.push(wGroup);
    });

    group.userData.wheels = wheels;
    return group;
  },

  createCNG() {
    const group = new THREE.Group();
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x1b9aaa, roughness: 0.35, metalness: 0.2 });
    const bodyGreen = new THREE.MeshStandardMaterial({ color: 0x06a77d, roughness: 0.32, metalness: 0.25 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xa8dadc, roughness: 0.15, metalness: 0.6 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe66d, emissive: 0xffb703, emissiveIntensity: 0.8 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x22222b, roughness: 0.75 });

    // Lower 3D Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.22), bodyGreen);
    cabin.position.set(0, 0.11, 0);
    group.add(cabin);

    // Rounded Front Nose
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.13, 12), greenMat);
    nose.position.set(0.16, 0.11, 0);
    group.add(nose);

    // Top Canopy Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.04, 0.21), roofMat);
    roof.position.set(-0.02, 0.24, 0);
    group.add(roof);

    // Windshield
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.18), glassMat);
    glass.position.set(0.12, 0.19, 0);
    glass.rotation.z = 0.22;
    group.add(glass);

    // Glowing Yellow Headlight
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), lampMat);
    headlight.position.set(0.22, 0.12, 0);
    group.add(headlight);

    // 3 Wheels
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
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0x2b2d42,
      roughness: 0.4,
      metalness: 0.35
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x3d405b,
      roughness: 0.35,
      metalness: 0.4
    });
    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      roughness: 0.3
    });

    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), featherMat);
    body.scale.set(1.35, 0.85, 0.9);
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), featherMat);
    head.position.set(0.09, 0.04, 0);
    group.add(head);

    // Beak (pointing right +X)
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.08, 8), beakMat);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.16, 0.04, 0);
    group.add(beak);

    // Articulated 3D Flapping Wings
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
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x8d8278,
      roughness: 0.75,
      metalness: 0.12,
      flatShading: true
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xa89b91,
      roughness: 0.68,
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
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xe05378,
      roughness: 0.35,
      metalness: 0.3,
      emissive: 0x4a1022,
      emissiveIntensity: 0.2
    });
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      roughness: 0.3
    });

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 12), coneMat);
    spike.position.set(0, 0.13, 0);
    group.add(spike);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.015, 8, 12), bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 0.12, 0);
    group.add(band);

    return group;
  },

  createTotoro3D() {
    const group = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0x7b8287, roughness: 0.65 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.55 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });

    // Plump 3D Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), furMat);
    body.scale.set(1.0, 1.18, 0.92);
    body.position.set(0, 0.26, 0);
    group.add(body);

    // Cream Belly Patch
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), bellyMat);
    belly.scale.set(0.88, 1.0, 0.55);
    belly.position.set(0, 0.23, 0.12);
    group.add(belly);

    // 3D Ears
    const earGeo = new THREE.ConeGeometry(0.045, 0.16, 10);
    const earL = new THREE.Mesh(earGeo, furMat);
    earL.position.set(-0.11, 0.56, 0);
    earL.rotation.z = 0.18;
    group.add(earL);

    const earR = new THREE.Mesh(earGeo, furMat);
    earR.position.set(0.11, 0.56, 0);
    earR.rotation.z = -0.18;
    group.add(earR);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), darkMat);
    eyeL.position.set(-0.08, 0.42, 0.19);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), darkMat);
    eyeR.position.set(0.08, 0.42, 0.19);
    group.add(eyeR);

    // 3D Swaying Leaf Umbrella
    const umbrella = new THREE.Group();
    umbrella.position.set(0.20, 0.36, 0.08);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 8), darkMat);
    stem.position.set(0, 0.14, 0);
    umbrella.add(stem);

    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.12, 14), leafMat);
    canopy.position.set(0, 0.34, 0);
    umbrella.add(canopy);
    group.add(umbrella);

    group.userData = { earL, earR, umbrella };
    return group;
  },

  createCloud3D() {
    const group = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      transparent: true,
      opacity: 0.72
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
 * Base Three.js Overlay Controller attached directly inside `.game-card`
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
    this.shockwaves = [];
    this.shards = [];
    this.petals = [];

    this._initRenderer();
    this._initLights();
    this._initPetals();
  }

  _initRenderer() {
    if (typeof document === "undefined") return;
    const hostCanvas = document.getElementById(this.canvasId);
    const parent = hostCanvas ? hostCanvas.parentElement : null;
    if (!parent) return;

    // Remove any stale overlay inside this card
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
    this.ambientLight = new THREE.AmbientLight(0xfff5eb, 1.15);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffe8c2, 1.9);
    this.dirLight.position.set(3, 5, 6);
    this.scene.add(this.dirLight);

    this.pointLight = new THREE.PointLight(0xffb703, 1.5, 6);
    this.pointLight.position.set(0, 0.8, 1.5);
    this.scene.add(this.pointLight);
  }

  _initPetals() {
    const petalGeo = new THREE.BoxGeometry(0.045, 0.028, 0.008);
    const petalColors = [0xf25c84, 0xff8da9, 0xffb703, 0xfbcfe8];
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: petalColors[i % petalColors.length],
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(petalGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * this.wUnits,
        (Math.random() - 0.5) * this.hUnits,
        0.15 + Math.random() * 0.4
      );
      this.scene.add(mesh);
      this.petals.push({
        mesh,
        vx: -(0.4 + Math.random() * 0.6),
        vy: -(0.15 + Math.random() * 0.25),
        rx: 1.5 + Math.random() * 2.5,
        ry: 1.5 + Math.random() * 2.5,
        rz: 1.0 + Math.random() * 2.0,
        phase: Math.random() * 6.28
      });
    }
  }

  /**
   * Convert Phaser canvas coordinates (sx, sy) to Three.js world coordinates at z = 0
   */
  toX(sx) {
    return (sx - this.width / 2) * SCALE;
  }

  toY(sy) {
    return (this.height / 2 - sy) * SCALE;
  }

  /**
   * Spawn a 3D expanding Torus shockwave ring at Phaser screen coords (sx, sy)
   */
  spawnShockwave(sx, sy, colorHex = 0xffe066) {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 8, 20), mat);
    ring.position.set(this.toX(sx), this.toY(sy), 0.15);
    ring.rotation.x = Math.PI / 2.4;
    this.scene.add(ring);
    this.shockwaves.push({ mesh: ring, mat, scale: 1.0, life: 1.0 });
  }

  /**
   * Spawn 3D tumbling polyhedral shards/sparkles at Phaser screen coords (sx, sy)
   */
  spawnBurst3D(sx, sy, colorHex = 0xffcf40, count = 8) {
    const geo = new THREE.OctahedronGeometry(0.038, 0);
    const wx = this.toX(sx);
    const wy = this.toY(sy);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        metalness: 0.5,
        roughness: 0.2,
        transparent: true,
        opacity: 1.0
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(wx, wy, 0.2);
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 0.8 + Math.random() * 1.1;
      this.scene.add(mesh);
      this.shards.push({
        mesh,
        mat,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 0.5,
        vz: (Math.random() - 0.5) * 1.2,
        rx: (Math.random() - 0.5) * 10,
        ry: (Math.random() - 0.5) * 10,
        life: 1.0
      });
    }
  }

  updateCommonFX(time, dt) {
    // 1. Update 3D tumbling Krishnachura petals
    const halfW = this.wUnits / 2 + 0.4;
    const halfH = this.hUnits / 2 + 0.4;
    for (const p of this.petals) {
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += (p.vy + Math.sin(time * 0.003 + p.phase) * 0.08) * dt;
      p.mesh.rotation.x += p.rx * dt;
      p.mesh.rotation.y += p.ry * dt;
      p.mesh.rotation.z += p.rz * dt;
      if (p.mesh.position.x < -halfW) p.mesh.position.x = halfW;
      if (p.mesh.position.y < -halfH) p.mesh.position.y = halfH;
    }

    // 2. Update 3D Torus Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt * 2.6;
      sw.scale += dt * 3.8;
      sw.mesh.scale.set(sw.scale, sw.scale, 1);
      sw.mat.opacity = Math.max(0, sw.life);
      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mat.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update 3D Polyhedral Shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.life -= dt * 2.1;
      s.vy -= 3.2 * dt; // 3D gravity
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.mesh.rotation.x += s.rx * dt;
      s.mesh.rotation.y += s.ry * dt;
      s.mat.opacity = Math.max(0, s.life);
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        s.mat.dispose();
        this.shards.splice(i, 1);
      }
    }
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
 * Runner3DFX - In-Game Three.js 3D Engine for Level 5: "Run to Totoro!" (Dino/Runner Game)
 */
export class Runner3DFX extends BaseGame3DFX {
  constructor(phaserScene) {
    super("game-canvas", 800, 300);
    this.phaserScene = phaserScene;
    this.itemMeshes = new Map();
    this.obsMeshes = new Map();
    this.totoroMesh = null;
    this.clouds3D = [];

    // Create 3D Parallax Clouds in deep Z-space
    for (let i = 0; i < 4; i++) {
      const c = MeshFactory3D.createCloud3D();
      c.position.set((i - 1.5) * 2.2, 0.85 + (i % 2) * 0.25, -0.8);
      this.scene.add(c);
      this.clouds3D.push({ mesh: c, speed: 0.25 + (i % 3) * 0.08 });
    }
  }

  onJump(sx, sy) {
    this.spawnShockwave(sx, sy, 0xe05378);
    this.spawnBurst3D(sx, sy, 0xf7cb45, 6);
  }

  onCollect(sx, sy, isChai) {
    this.spawnShockwave(sx, sy, isChai ? 0xdf7f28 : 0xffcf40);
    this.spawnBurst3D(sx, sy, isChai ? 0xdf7f28 : 0xffcf40, 10);
  }

  onWin(sx, sy) {
    this.spawnShockwave(sx, sy - 30, 0xf25c84);
    this.spawnBurst3D(sx, sy - 40, 0xf25c84, 16);
  }

  sync(time, dt) {
    const sc = this.phaserScene;
    if (!sc) return;

    this.updateCommonFX(time, dt);

    // 1. Update 3D Parallax Clouds
    for (const c of this.clouds3D) {
      c.mesh.position.x -= c.speed * dt;
      if (c.mesh.position.x < -4.8) c.mesh.position.x = 4.8;
    }

    // 2. Sync 3D Collectibles (3D Spinning Gold Coins & 3D Steaming Clay Cha Cups)
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
        if (this.renderer) it.sprite.setAlpha(0.01); // Let 3D mesh shine while preserving 2D sprite state
      }
      mesh.position.set(this.toX(it.sprite.x), this.toY(it.sprite.y), 0.12);
      mesh.rotation.y = time * 0.0045 + (it.phase || 0);
      mesh.rotation.z = Math.sin(time * 0.003 + (it.phase || 0)) * 0.15;

      if (mesh.userData.puffs) {
        mesh.userData.puffs.forEach((p, idx) => {
          p.position.y = 0.11 + ((time * 0.0015 + idx * 0.33) % 1) * 0.12;
        });
      }
    }

    // 3. Sync 3D Obstacles (3D Crystalline Boulders, 3D Road Spikes, 3D Flapping Bugs)
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
        mesh.rotation.y = Math.PI; // Facing left toward runner
        if (mesh.userData.wingL && mesh.userData.wingR) {
          const flap = Math.sin(time * 0.018) * 0.65;
          mesh.userData.wingL.rotation.x = flap;
          mesh.userData.wingR.rotation.x = -flap;
        }
      }
    }

    // 4. Sync 3D Voxel Totoro at the Finish
    if (sc.totoro && sc.totoro.active) {
      if (!this.totoroMesh) {
        this.totoroMesh = MeshFactory3D.createTotoro3D();
        this.scene.add(this.totoroMesh);
        if (this.renderer) sc.totoro.setAlpha(0.01);
      }
      const bounce = sc.state === "won" ? Math.abs(Math.sin(time * 0.008)) * 0.14 : 0;
      this.totoroMesh.position.set(this.toX(sc.totoro.x), this.toY(sc.totoro.y) + bounce, 0.15);
      this.totoroMesh.rotation.y = -0.35 + Math.sin(time * 0.002) * 0.12;
      const breath = Math.sin(time * 0.003) * 0.04;
      this.totoroMesh.scale.set(1 + breath, 1 - breath * 0.8, 1 + breath);
      if (this.totoroMesh.userData.umbrella) {
        this.totoroMesh.userData.umbrella.rotation.z = Math.sin(time * 0.0025) * 0.1;
      }
    }

    // Follow player X with dynamic pointLight
    if (sc.astro) {
      this.pointLight.position.x = this.toX(sc.astro.x);
      this.pointLight.position.y = this.toY(sc.astro.y - 35);
    }

    this.render();
  }
}

/**
 * Mario3DFX - In-Game Three.js 3D Engine for Level 7: "Run to the Bus Stop" (Mario Platformer)
 */
export class Mario3DFX extends BaseGame3DFX {
  constructor(phaserScene) {
    super("mario-canvas", 800, 448);
    this.phaserScene = phaserScene;
    this.blockMeshes = new Map();
    this.itemMeshes = new Map();
    this.enemyMeshes = new Map();
    this.totoroMesh = null;
    this.clouds3D = [];

    this._applyStageLighting(phaserScene.levelIdx || 0);
    this._buildBlocks3D();
  }

  _applyStageLighting(stageIdx) {
    if (stageIdx === 0) {
      // Dhanmondi Sunset
      this.ambientLight.color.setHex(0xfff5e6);
      this.dirLight.color.setHex(0xffdf9e);
    } else if (stageIdx === 1) {
      // Hatirjheel Twilight
      this.ambientLight.color.setHex(0xfce4ec);
      this.dirLight.color.setHex(0xff9ebb);
    } else {
      // Old Dhaka Lantern Night
      this.ambientLight.color.setHex(0xe2dbf0);
      this.dirLight.color.setHex(0xffd166);
      this.pointLight.intensity = 2.4;
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

    // 3D Totoro waiting at the Bus Stop Goal
    if (sc.goalX) {
      this.totoroMesh = MeshFactory3D.createTotoro3D();
      this.scene.add(this.totoroMesh);
      if (this.renderer && sc.totoro) {
        sc.totoro.setAlpha(0.01);
      }
    }
  }

  onJump(worldX, worldY, camX) {
    this.spawnShockwave(worldX - camX, worldY, 0xffe066);
    this.spawnBurst3D(worldX - camX, worldY, 0xffffff, 5);
  }

  onBlockBump(b, isHeart, camX) {
    const entry = this.blockMeshes.get(b);
    if (entry) {
      entry.bumpVel = 1.6;
      if (entry.mesh.userData && entry.mesh.userData.core) {
        entry.mesh.userData.core.material.color.setHex(0x9e8c7a);
        entry.mesh.userData.core.material.emissiveIntensity = 0;
      }
    }
    const sx = b.x + 16 - camX;
    const sy = b.y;
    this.spawnShockwave(sx, sy, isHeart ? 0xf25c84 : 0xffcf40);
    this.spawnBurst3D(sx, sy, isHeart ? 0xf25c84 : 0xffcf40, 10);
  }

  onStomp(worldX, worldY, camX) {
    const sx = worldX - camX;
    this.spawnShockwave(sx, worldY, 0xffd166);
    this.spawnBurst3D(sx, worldY, 0xe05378, 12);
  }

  onCollect(worldX, worldY, type, camX) {
    const sx = worldX - camX;
    const col = type === "heart" ? 0xf25c84 : type === "kite" ? 0xff8da9 : 0xffcf40;
    this.spawnShockwave(sx, worldY, col);
    this.spawnBurst3D(sx, worldY, col, 9);
  }

  onWin(worldX, worldY, camX) {
    const sx = worldX - camX;
    this.spawnShockwave(sx, worldY - 30, 0xf25c84);
    this.spawnBurst3D(sx, worldY - 40, 0xf25c84, 18);
  }

  sync(time, dt) {
    const sc = this.phaserScene;
    if (!sc || !sc.cameras || !sc.cameras.main) return;
    const camX = sc.cameras.main.scrollX;

    this.updateCommonFX(time, dt);

    // 1. Sync 3D Extruded ? Blocks and Brick Platforms in camera frustum
    for (const [b, entry] of this.blockMeshes.entries()) {
      const sx = b.x + 16 - camX;
      if (sx < -60 || sx > 860) {
        entry.mesh.visible = false;
        continue;
      }
      entry.mesh.visible = true;

      if (entry.bumpVel !== 0 || entry.bumpOffset > 0) {
        entry.bumpOffset += entry.bumpVel * dt;
        entry.bumpVel -= 8.5 * dt;
        if (entry.bumpOffset <= 0) {
          entry.bumpOffset = 0;
          entry.bumpVel = 0;
          entry.mesh.rotation.y = 0;
        } else {
          entry.mesh.rotation.y += dt * 10;
        }
      } else if (entry.isQ && !b.used) {
        entry.mesh.rotation.y = Math.sin(time * 0.003 + b.x * 0.01) * 0.18;
      }

      entry.mesh.position.set(this.toX(sx), this.toY(b.y + 16) + entry.bumpOffset, 0.05);
    }

    // 2. Sync 3D Collectibles (3D Coins, 3D Hearts, 3D Kites)
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
        mesh.rotation.z = Math.sin(time * 0.003 + (it.phase || 0)) * 0.22;
        mesh.rotation.y = Math.cos(time * 0.004 + (it.phase || 0)) * 0.35;
      } else {
        mesh.rotation.y = time * 0.0045 + (it.phase || 0);
      }
    }

    // 3. Sync 3D Enemies (3D Spoked Rickshaws, 3D Green CNGs, 3D Flapping Crows)
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
        else if (e.sprite.texture && e.sprite.texture.key === "cng") mesh = MeshFactory3D.createCNG();
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

      // Smooth 3D yaw rotation based on travel direction (vx >= 0 faces +X, vx < 0 faces -X)
      const targetYaw = e.vx < 0 ? Math.PI : 0;
      mesh.rotation.y += (targetYaw - mesh.rotation.y) * Math.min(1, dt * 12);

      // Animate 3D wheels or 3D flapping crow wings
      if (mesh.userData.wheels) {
        for (const w of mesh.userData.wheels) {
          w.rotation.z -= Math.abs(e.vx) * dt * 0.12;
        }
      } else if (mesh.userData.wingL && mesh.userData.wingR) {
        const flap = Math.sin(time * 0.016 + (e.phase || 0)) * 0.65;
        mesh.userData.wingL.rotation.x = flap;
        mesh.userData.wingR.rotation.x = -flap;
        mesh.rotation.z = Math.cos(time * 0.005 + (e.phase || 0)) * 0.1;
      }
    }

    // 4. Sync 3D Totoro at the Bus Stop Goal
    if (this.totoroMesh && sc.totoro) {
      const sx = sc.totoro.x - camX;
      if (sx >= -100 && sx <= 900) {
        this.totoroMesh.visible = true;
        const winHop = sc.state === "win" ? Math.abs(Math.sin(time * 0.01)) * 0.18 : 0;
        this.totoroMesh.position.set(this.toX(sx), this.toY(sc.totoro.y) + winHop, 0.16);
        this.totoroMesh.rotation.y = -0.3 + Math.sin(time * 0.002) * 0.15;
        const breath = Math.sin(time * 0.003) * 0.04;
        this.totoroMesh.scale.set(1 + breath, 1 - breath * 0.8, 1 + breath);
        if (this.totoroMesh.userData.umbrella) {
          this.totoroMesh.userData.umbrella.rotation.z = Math.sin(time * 0.0025) * 0.1;
        }
      } else {
        this.totoroMesh.visible = false;
      }
    }

    // 5. Move 3D PointLight with player
    if (sc.p) {
      this.pointLight.position.x = this.toX(sc.p.x - camX);
      this.pointLight.position.y = this.toY(sc.p.y - 20);
    }

    this.render();
  }
}
