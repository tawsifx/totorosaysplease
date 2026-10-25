// js/3d/game3d.js - Real-Time In-Game Three.js 3D Engine with Luminous Specular Lighting
// Enhances "Run to the Bus Stop" (Mario) and "Run to Totoro!" (Dino/Runner) with
// bright, gleaming 3D Gold Coins, Steaming Clay Cha Cups, Ruby Hearts, Diamond Kites,
// Question Blocks, Rickshaws, CNGs, Flapping Crows, and Crystalline Obstacles.
// Note: Totoro preserves its authentic 2D pixel-art sprite design with zero 3D override.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const SCALE = 0.01; // 100 Phaser pixels = 1.0 Three.js world unit at z = 0

// External 3D Crow Model (GLB) Asset Loader (PSX Animals Free by heyheythere, CC BY 4.0)
let _crowGltfTemplate = null;
const _pendingCrowMeshes = new Set();

function initExternalCrowModel() {
  if (typeof window === "undefined") return;
  try {
    const loader = new GLTFLoader();
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      "/models/crow_atlas.png",
      (atlasTex) => {
        atlasTex.magFilter = THREE.NearestFilter;
        atlasTex.minFilter = THREE.NearestFilter;
        loader.load(
          "/models/crow.glb",
          (gltf) => {
            const crowScene = gltf.scene;
            crowScene.traverse((child) => {
              if (child.isMesh) {
                child.material = new THREE.MeshPhongMaterial({
                  map: atlasTex,
                  specular: 0x4a5568,
                  shininess: 90
                });
              }
            });
            // Orient bird to face forward (+X)
            crowScene.rotation.y = Math.PI / 2;
            crowScene.scale.set(0.72, 0.72, 0.72);
            _crowGltfTemplate = crowScene;

            // Upgrade any currently active placeholder meshes
            for (const grp of _pendingCrowMeshes) {
              if (grp && grp.parent) {
                while (grp.children.length > 0) {
                  grp.remove(grp.children[0]);
                }
                const model = _crowGltfTemplate.clone(true);
                grp.add(model);
                const wingL = model.getObjectByName("crow_wing_l");
                const wingR = model.getObjectByName("crow_wing_r");
                grp.userData.isGltf = true;
                grp.userData.model = model;
                grp.userData.wingL = wingL;
                grp.userData.wingR = wingR;
                grp.userData.setFlap = (flap) => {
                  if (wingL && wingR) {
                    wingL.rotation.z = flap;
                    wingR.rotation.z = -flap;
                  }
                };
              }
            }
            _pendingCrowMeshes.clear();
          },
          undefined,
          (err) => {
            console.warn("External /models/crow.glb fallback to procedural model", err);
          }
        );
      },
      undefined,
      (err) => {
        console.warn("External /models/crow_atlas.png load error", err);
      }
    );
  } catch (err) {
    console.warn("External crow asset initialization skipped:", err);
  }
}

initExternalCrowModel();

/**
 * Shared Luminous 3D Mesh Builders
 * Uses bright MeshPhongMaterial with vivid specular highlights and self-luminous emissive glow.
 */
export const MeshFactory3D = {
  createCoin() {
    const group = new THREE.Group();

    // Natural warm metallic gold / antique brass material (warm tone, subtle specular, no blinding yellow/glare)
    const goldMat = new THREE.MeshPhongMaterial({
      color: 0xc89b38,
      emissive: 0x2c1d05,
      emissiveIntensity: 0.10,
      specular: 0xccb077,
      shininess: 45
    });

    const rimMat = new THREE.MeshPhongMaterial({
      color: 0xbe8f30,
      emissive: 0x261904,
      emissiveIntensity: 0.10,
      specular: 0xc4a66a,
      shininess: 40
    });

    // Coin cylinder disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.038, 24), goldMat);
    disc.rotation.x = Math.PI / 2;
    group.add(disc);

    // Bevelled outer torus rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.016, 10, 24), rimMat);
    group.add(rim);

    // Subtle embossed relief star on front & back
    const starMat = new THREE.MeshPhongMaterial({
      color: 0xd8aa44,
      emissive: 0x2c1d05,
      emissiveIntensity: 0.10,
      specular: 0xd9c288,
      shininess: 45
    });
    const starFront = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 0), starMat);
    starFront.position.z = 0.022;
    starFront.scale.set(1.0, 1.0, 0.3);
    group.add(starFront);

    const starBack = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 0), starMat);
    starBack.position.z = -0.022;
    starBack.scale.set(1.0, 1.0, 0.3);
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

    // Vibrant Dhaka Enamel & Rexine Materials
    const hoodMat = new THREE.MeshPhongMaterial({ color: 0xd81b60, emissive: 0x4a0018, emissiveIntensity: 0.32, specular: 0xffffff, shininess: 130 });
    const hoodStripeOrange = new THREE.MeshPhongMaterial({ color: 0xff9100, emissive: 0x663300, emissiveIntensity: 0.38, specular: 0xffffff, shininess: 160 });
    const hoodStripeYellow = new THREE.MeshPhongMaterial({ color: 0xffea00, emissive: 0x665500, emissiveIntensity: 0.42, specular: 0xffffff, shininess: 180 });
    const hoodStripeBlue = new THREE.MeshPhongMaterial({ color: 0x00b0ff, emissive: 0x003366, emissiveIntensity: 0.35, specular: 0xffffff, shininess: 150 });
    const trimGoldMat = new THREE.MeshPhongMaterial({ color: 0xffd700, emissive: 0x774400, emissiveIntensity: 0.45, specular: 0xffffff, shininess: 220 });
    const fringeMat = new THREE.MeshPhongMaterial({ color: 0xffeb3b, emissive: 0x554400, emissiveIntensity: 0.3, specular: 0xffffff, shininess: 80 });

    const seatMat = new THREE.MeshPhongMaterial({ color: 0x0288d1, emissive: 0x002c4c, emissiveIntensity: 0.28, specular: 0x80d8ff, shininess: 120 });
    const seatPipeMat = new THREE.MeshPhongMaterial({ color: 0xffea00, emissive: 0x554400, emissiveIntensity: 0.3, specular: 0xffffff, shininess: 150 });
    const woodDeckMat = new THREE.MeshPhongMaterial({ color: 0x8d6e63, emissive: 0x271913, emissiveIntensity: 0.2, specular: 0xbcaaa4, shininess: 60 });
    const frameMat = new THREE.MeshPhongMaterial({ color: 0xd50000, emissive: 0x400000, emissiveIntensity: 0.3, specular: 0xff8a80, shininess: 160 });

    const chromeMat = new THREE.MeshPhongMaterial({ color: 0xf5f5f5, specular: 0xffffff, shininess: 250 });
    const tireMat = new THREE.MeshPhongMaterial({ color: 0x1a1a24, specular: 0x555566, shininess: 50 });
    const flapMat = new THREE.MeshPhongMaterial({ color: 0x111116, specular: 0x333344, shininess: 30 });

    // 1. Passenger Seat, Backrest & Armrests
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.20), seatMat);
    seat.position.set(-0.09, 0.12, 0);
    group.add(seat);

    const seatPiping = new THREE.Mesh(new THREE.BoxGeometry(0.164, 0.012, 0.204), seatPipeMat);
    seatPiping.position.set(-0.09, 0.155, 0);
    group.add(seatPiping);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.20), seatMat);
    backrest.position.set(-0.17, 0.20, 0);
    group.add(backrest);

    // Left and Right Armrests
    const armGeo = new THREE.BoxGeometry(0.14, 0.035, 0.024);
    const armL = new THREE.Mesh(armGeo, seatMat);
    armL.position.set(-0.09, 0.17, 0.10);
    const armR = new THREE.Mesh(armGeo, seatMat);
    armR.position.set(-0.09, 0.17, -0.10);
    group.add(armL, armR);

    // Slatted Passenger Footrest Platform
    const footDeck = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.19), woodDeckMat);
    footDeck.position.set(0.02, 0.075, 0);
    group.add(footDeck);

    // 2. The Authentic Dhaka Canopy Hood (Emerges from the back, curves over head, opens in front)
    // Outer Hood Shell Profile: rises vertically behind passenger backrest at x = -0.18, curves over the head to front visor at x = -0.02
    const hoodThickness = 0.016;
    const hoodShape = new THREE.Shape();
    hoodShape.moveTo(-0.18, 0.16);
    hoodShape.lineTo(-0.18, 0.25);
    hoodShape.quadraticCurveTo(-0.16, 0.33, -0.02, 0.30);
    hoodShape.lineTo(-0.02, 0.30 - hoodThickness);
    hoodShape.quadraticCurveTo(-0.15, 0.31, -0.18 + hoodThickness, 0.25);
    hoodShape.lineTo(-0.18 + hoodThickness, 0.16);
    hoodShape.closePath();

    const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, { depth: 0.22, bevelEnabled: false });
    hoodGeo.translate(0, 0, -0.11);
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    group.add(hood);

    // Side Rexine Panels (enclosing the rear sides of the passenger compartment)
    const sideShape = new THREE.Shape();
    sideShape.moveTo(-0.18, 0.16);
    sideShape.lineTo(-0.18, 0.25);
    sideShape.quadraticCurveTo(-0.16, 0.33, -0.02, 0.30);
    sideShape.lineTo(-0.02, 0.22);
    sideShape.quadraticCurveTo(-0.10, 0.18, -0.18, 0.16);
    sideShape.closePath();

    const sideGeoL = new THREE.ExtrudeGeometry(sideShape, { depth: 0.005, bevelEnabled: false });
    sideGeoL.translate(0, 0, 0.105);
    const sideL = new THREE.Mesh(sideGeoL, hoodMat);

    const sideGeoR = new THREE.ExtrudeGeometry(sideShape, { depth: 0.005, bevelEnabled: false });
    sideGeoR.translate(0, 0, -0.110);
    const sideR = new THREE.Mesh(sideGeoR, hoodMat);
    group.add(sideL, sideR);

    // Dhaka Traditional Appliqué Bands (Orange, Yellow, Cyan arch stripes wrapping the hood)
    const stripeShape = new THREE.Shape();
    stripeShape.moveTo(-0.182, 0.18);
    stripeShape.lineTo(-0.182, 0.252);
    stripeShape.quadraticCurveTo(-0.162, 0.332, -0.018, 0.302);
    stripeShape.lineTo(-0.018, 0.296);
    stripeShape.quadraticCurveTo(-0.158, 0.324, -0.176, 0.25);
    stripeShape.lineTo(-0.176, 0.18);
    stripeShape.closePath();

    const makeStripe = (mat, zPos) => {
      const geo = new THREE.ExtrudeGeometry(stripeShape, { depth: 0.034, bevelEnabled: false });
      geo.translate(0, 0, zPos - 0.017);
      return new THREE.Mesh(geo, mat);
    };

    group.add(makeStripe(hoodStripeOrange, 0.055));
    group.add(makeStripe(hoodStripeYellow, 0.0));
    group.add(makeStripe(hoodStripeBlue, -0.055));

    // Chrome Structural Canopy Rib Arch along Front Visor Opening
    const visorRim = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.226), chromeMat);
    visorRim.position.set(-0.02, 0.30, 0);
    group.add(visorRim);

    // Classic Scissor Folding Struts on Left and Right Sides (folding canopy mechanism)
    [-0.115, 0.115].forEach((sz) => {
      // Rear strut
      const strutRear = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 6), chromeMat);
      strutRear.position.set(-0.13, 0.21, sz);
      strutRear.rotation.z = 0.55;
      // Front strut
      const strutFront = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.13, 6), chromeMat);
      strutFront.position.set(-0.07, 0.23, sz);
      strutFront.rotation.z = -0.55;
      // Center hinge pin
      const hinge = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), trimGoldMat);
      hinge.position.set(-0.10, 0.17, sz);
      group.add(strutRear, strutFront, hinge);
    });

    // Scalloped Golden Fringe along the Front Visor Rim
    const fringeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.018, 0.224), fringeMat);
    fringeTrim.position.set(-0.02, 0.29, 0);
    group.add(fringeTrim);

    // Miniature Hanging Tassels along the front canopy opening
    for (let tz = -0.095; tz <= 0.096; tz += 0.032) {
      const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0065, 0.022, 6), trimGoldMat);
      tassel.position.set(-0.02, 0.275, tz);
      group.add(tassel);
    }

    // 3. Iconic Painted Rickshaw Backplate (UNESCO Intangible Folk Art)
    const backplateBorder = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.20), trimGoldMat);
    backplateBorder.position.set(-0.195, 0.12, 0);
    group.add(backplateBorder);

    // Folk Art Panel layers: sunset orange, peacock teal medallion, lotus red motif
    const backplateFolkArt = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.136, 0.176), hoodStripeOrange);
    backplateFolkArt.position.set(-0.196, 0.12, 0);
    group.add(backplateFolkArt);

    const artMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.018, 12), hoodStripeBlue);
    artMedallion.rotation.z = Math.PI / 2;
    artMedallion.position.set(-0.198, 0.12, 0);
    group.add(artMedallion);

    const artHeart = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.035), hoodMat);
    artHeart.rotation.x = Math.PI / 4;
    artHeart.position.set(-0.20, 0.12, 0);
    group.add(artHeart);

    // Decorative metallic corner studs on the backplate
    [
      [0.055, 0.075],
      [0.055, -0.075],
      [-0.055, 0.075],
      [-0.055, -0.075]
    ].forEach(([sy, sz]) => {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), chromeMat);
      stud.position.set(-0.198, 0.12 + sy, sz);
      group.add(stud);
    });

    // 4. Bicycle Tubular Steel Chassis, Fork & Steering Handlebar
    const chassisBeam = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.028, 0.08), frameMat);
    chassisBeam.position.set(0.01, 0.065, 0);
    group.add(chassisBeam);

    // Diagonal Frame Tube from bottom bracket to head tube
    const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), frameMat);
    topTube.rotation.z = -0.55;
    topTube.position.set(0.07, 0.13, 0);
    group.add(topTube);

    // Driver Saddle (Cycle Seat)
    const saddle = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.07, 5), tireMat);
    saddle.rotation.z = Math.PI / 2;
    saddle.position.set(0.01, 0.18, 0);
    group.add(saddle);

    // Front Steering Fork
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.20, 8), chromeMat);
    fork.position.set(0.15, 0.14, 0);
    fork.rotation.z = 0.22;
    group.add(fork);

    // Chrome Handlebars with Grips
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), chromeMat);
    handlebar.rotation.x = Math.PI / 2;
    handlebar.position.set(0.14, 0.23, 0);
    group.add(handlebar);

    // Classic Brass Rickshaw Bell on Handlebar
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), trimGoldMat);
    bell.position.set(0.14, 0.245, 0.05);
    group.add(bell);

    // Handlebar Flower Vase Bouquet (Traditional Dhaka Rickshaw Accent)
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.028, 8), trimGoldMat);
    vase.position.set(0.14, 0.24, -0.04);
    group.add(vase);
    const flower1 = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), hoodMat);
    flower1.position.set(0.14, 0.26, -0.04);
    const flower2 = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), hoodStripeYellow);
    flower2.position.set(0.135, 0.255, -0.03);
    group.add(flower1, flower2);

    // 5. Authentic 3D Spoked Bicycle Wheels with Mudguards & Mudflaps
    const wheels = [];
    const wheelPositions = [
      [-0.11, 0.078, 0.115, true],  // Rear Left (with mudguard)
      [-0.11, 0.078, -0.115, true], // Rear Right (with mudguard)
      [0.17, 0.078, 0.0, true]      // Front Center (with mudguard)
    ];

    wheelPositions.forEach(([wx, wy, wz, hasGuard]) => {
      // Rotating Wheel Assembly
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);

      // Black Rubber Tire
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.014, 8, 18), tireMat);
      wGroup.add(tire);

      // Chrome Rim
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.063, 0.005, 6, 18), chromeMat);
      wGroup.add(rim);

      // Central Hub
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.024, 8), chromeMat);
      hub.rotation.x = Math.PI / 2;
      wGroup.add(hub);

      // 8 Radial Spokes forming a 16-point star
      for (let s = 0; s < 4; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.126, 0.004, 0.004), chromeMat);
        spoke.rotation.z = (s * Math.PI) / 4;
        wGroup.add(spoke);
      }

      group.add(wGroup);
      wheels.push(wGroup);

      // Sleek Arched Chrome Mudguard over each wheel (no solid green clipping faces)
      if (hasGuard) {
        // High-shine chrome curved fender arc hovering cleanly over the tire tread
        const guard = new THREE.Mesh(
          new THREE.TorusGeometry(0.082, 0.005, 6, 16, Math.PI * 0.78),
          chromeMat
        );
        guard.rotation.z = Math.PI * 0.12;
        guard.position.set(wx, wy, wz);
        group.add(guard);

        // Thin chrome fender stay strut connecting fender to axle
        const stay = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.08, 6), chromeMat);
        stay.position.set(wx - 0.04, wy + 0.03, wz);
        stay.rotation.z = -0.6;
        group.add(stay);

        // Hanging Black Rubber Mudflap at rear of guard
        const flap = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.030, 0.026), flapMat);
        flap.position.set(wx - 0.072, wy - 0.015, wz);
        group.add(flap);
      }
    });

    group.userData.wheels = wheels;
    return group;
  },

  createCNG() {
    const group = new THREE.Group();

    // Authentic Dhaka CNG Colors & Materials
    // Deep Dhaka emerald green with glossy clearcoat specular shine
    const greenMat = new THREE.MeshPhongMaterial({
      color: 0x0a8740,
      emissive: 0x003d15,
      emissiveIntensity: 0.28,
      specular: 0x98ff98,
      shininess: 170
    });
    // Distinctive Yellow Dhaka Metro civic registration waist stripe & license plate
    const yellowStripeMat = new THREE.MeshPhongMaterial({
      color: 0xffd600,
      emissive: 0x665500,
      emissiveIntensity: 0.38,
      specular: 0xffffff,
      shininess: 200
    });
    // Signature Dhaka welded metal safety bars / security cage
    const metalCageMat = new THREE.MeshPhongMaterial({
      color: 0x37474f,
      emissive: 0x182024,
      emissiveIntensity: 0.2,
      specular: 0xb0bec5,
      shininess: 140
    });
    // Dark matte vinyl / canvas roof canopy
    const roofMat = new THREE.MeshPhongMaterial({
      color: 0x212529,
      emissive: 0x111116,
      emissiveIntensity: 0.15,
      specular: 0x555566,
      shininess: 60
    });
    // Clear cyan-tinted front windshield glass
    const glassMat = new THREE.MeshPhongMaterial({
      color: 0xdff9fb,
      emissive: 0x003344,
      emissiveIntensity: 0.18,
      opacity: 0.82,
      transparent: true,
      specular: 0xffffff,
      shininess: 240
    });
    // Bright halogen headlights
    const lampMat = new THREE.MeshPhongMaterial({
      color: 0xfffde7,
      emissive: 0xfff59d,
      emissiveIntensity: 0.95,
      specular: 0xffffff,
      shininess: 250
    });
    // Amber turn signal indicators
    const amberMat = new THREE.MeshPhongMaterial({
      color: 0xff9800,
      emissive: 0xff6d00,
      emissiveIntensity: 0.8,
      specular: 0xffffff,
      shininess: 200
    });
    // Red brake tail lamps
    const brakeMat = new THREE.MeshPhongMaterial({
      color: 0xd50000,
      emissive: 0xff1744,
      emissiveIntensity: 0.9,
      specular: 0xffffff,
      shininess: 200
    });
    // Tires & mechanical parts
    const tireMat = new THREE.MeshPhongMaterial({ color: 0x1a1a24, specular: 0x555566, shininess: 50 });
    const chromeMat = new THREE.MeshPhongMaterial({ color: 0xf5f5f5, specular: 0xffffff, shininess: 240 });
    const seatMat = new THREE.MeshPhongMaterial({ color: 0x263238, specular: 0x78909c, shininess: 80 });

    // 1. Lower Body & Aerodynamic Semi-Rounded Front Scudo (Cowling)
    // Rear & mid passenger cabin base (rectangular body connecting seamlessly to front)
    const rearCabin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.23), greenMat);
    rearCabin.position.set(-0.08, 0.10, 0);
    group.add(rearCabin);

    // Dhaka Metro Yellow Civic Registration Stripe along straight side waist
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.016, 0.006), yellowStripeMat);
    stripeL.position.set(-0.08, 0.11, 0.116);
    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.016, 0.006), yellowStripeMat);
    stripeR.position.set(-0.08, 0.11, -0.116);
    group.add(stripeL, stripeR);

    // Aerodynamic Semi-Rounded Front Scudo (smooth curved cylinder curving forward in +X)
    const scudoGeo = new THREE.CylinderGeometry(0.105, 0.115, 0.11, 24, 1, false, 0, Math.PI);
    const scudo = new THREE.Mesh(scudoGeo, greenMat);
    scudo.position.set(0.03, 0.105, 0);
    scudo.scale.set(1.25, 1.0, 1.0);
    group.add(scudo);

    // Bevelled spherical dome cap rounding the top of the front scudo
    const scudoCap = new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 10, 0, Math.PI, 0, Math.PI / 2), greenMat);
    scudoCap.position.set(0.03, 0.16, 0);
    scudoCap.scale.set(1.25, 0.45, 1.0);
    group.add(scudoCap);

    // Curved Yellow Registration Stripe wrapping seamlessly across the semi-rounded front scudo
    const stripeFront = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.116, 0.016, 24, 1, true, 0, Math.PI), yellowStripeMat);
    stripeFront.position.set(0.03, 0.11, 0);
    stripeFront.scale.set(1.26, 1.0, 1.0);
    group.add(stripeFront);

    // Aerodynamic Curved Front Mudguard hugging the front steering wheel
    const frontFender = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.048, 14, 1, true, 0, Math.PI * 0.75), greenMat);
    frontFender.rotation.x = Math.PI / 2;
    frontFender.rotation.z = Math.PI * 0.12;
    frontFender.position.set(0.165, 0.068, 0);
    group.add(frontFender);

    // 2. The Signature Dhaka Security Grille & Protective Bars
    // Left & Right passenger cabin cage bars
    [-0.116, 0.116].forEach((sideZ) => {
      // Horizontal safety waist rail
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.012), metalCageMat);
      railTop.position.set(-0.06, 0.19, sideZ);
      const railMid = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.012), metalCageMat);
      railMid.position.set(-0.06, 0.15, sideZ);
      group.add(railTop, railMid);

      // Vertical security bars
      [-0.13, -0.09, -0.05, -0.01].forEach((bx) => {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6), metalCageMat);
        bar.position.set(bx, 0.17, sideZ);
        group.add(bar);
      });
    });

    // Front corner windshield pillar frame (raked back smoothly)
    const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 6), metalCageMat);
    pillarL.position.set(0.10, 0.20, 0.095);
    pillarL.rotation.z = -0.25;
    const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 6), metalCageMat);
    pillarR.position.set(0.10, 0.20, -0.095);
    pillarR.rotation.z = -0.25;
    group.add(pillarL, pillarR);

    // Rear corner roof pillars
    const rearPillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), metalCageMat);
    rearPillarL.position.set(-0.17, 0.19, 0.10);
    const rearPillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), metalCageMat);
    rearPillarR.position.set(-0.17, 0.19, -0.10);
    group.add(rearPillarL, rearPillarR);

    // 3. Cabin Canvas Roof with Semi-Rounded Front & Curved Windshield
    // Main rear roof
    const roofBack = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.035, 0.23), roofMat);
    roofBack.position.set(-0.07, 0.25, 0);
    group.add(roofBack);

    // Rounded Front Roof Canopy
    const roofFront = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.035, 20, 1, false, 0, Math.PI), roofMat);
    roofFront.position.set(0.03, 0.25, 0);
    roofFront.scale.set(1.22, 1.0, 1.0);
    group.add(roofFront);

    // Curved Wraparound Front Windshield Glass
    const glassGeo = new THREE.CylinderGeometry(0.098, 0.106, 0.095, 20, 1, true, Math.PI * 0.12, Math.PI * 0.76);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0.03, 0.195, 0);
    glass.scale.set(1.22, 1.0, 1.0);
    group.add(glass);

    // Single Windshield Wiper Arm (Authentic diagonal detail)
    const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.07, 0.006), tireMat);
    wiper.position.set(0.142, 0.195, 0.02);
    wiper.rotation.z = 0.42;
    wiper.rotation.y = 0.15;
    group.add(wiper);

    // 4. Dual Headlights & Amber Indicators Form-Fitted on Semi-Rounded Scudo
    [-0.052, 0.052].forEach((hz) => {
      // Angle the bezel to follow the scudo curvature
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 12), chromeMat);
      bezel.rotation.z = Math.PI / 2;
      bezel.rotation.x = hz > 0 ? -0.22 : 0.22;
      bezel.position.set(0.152, 0.115, hz);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.020, 10, 10), lampMat);
      bulb.position.set(0.158, 0.115, hz);
      group.add(bezel, bulb);
    });

    // Amber Turn Signal Indicators contoured to the front-side curve
    [-0.092, 0.092].forEach((az) => {
      const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.02, 0.024), amberMat);
      indicator.position.set(0.118, 0.115, az);
      indicator.rotation.y = az > 0 ? -0.35 : 0.35;
      group.add(indicator);
    });

    // Central Dhaka Taxi Registration Badge / Meter Pod
    const meterBadge = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.032, 0.042), yellowStripeMat);
    meterBadge.position.set(0.162, 0.145, 0);
    group.add(meterBadge);

    // 5. Interior Passenger & Driver Cabin
    const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), seatMat);
    driverSeat.position.set(0.06, 0.12, 0);
    group.add(driverSeat);

    const passengerBench = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.19), seatMat);
    passengerBench.position.set(-0.11, 0.12, 0);
    group.add(passengerBench);

    // 6. Rear Engine Bay, Taillights & Dhaka Metro License Plate
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.23), tireMat);
    rearBumper.position.set(-0.18, 0.075, 0);
    group.add(rearBumper);

    // Dual Red Brake Lamps
    [-0.08, 0.08].forEach((rz) => {
      const tailLamp = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.022, 0.026), brakeMat);
      tailLamp.position.set(-0.192, 0.10, rz);
      group.add(tailLamp);
    });

    // Rear Dhaka Metro License Plate (Yellow with border)
    const licensePlate = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.028, 0.075), yellowStripeMat);
    licensePlate.position.set(-0.192, 0.075, 0);
    group.add(licensePlate);

    // 7. Three-Wheeler Wheels (1 front, 2 rear)
    const wheels = [];
    const cngWheelPositions = [
      [-0.12, 0.055, 0.115], // Rear Left
      [-0.12, 0.055, -0.115], // Rear Right
      [0.17, 0.055, 0.0]     // Front Center
    ];

    cngWheelPositions.forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(wx, wy, wz);

      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.018, 8, 16), tireMat);
      wGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.022, 10), chromeMat);
      rim.rotation.x = Math.PI / 2;
      wGroup.add(rim);

      // Central axle hub
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), metalCageMat);
      wGroup.add(cap);

      group.add(wGroup);
      wheels.push(wGroup);
    });

    group.userData.wheels = wheels;
    return group;
  },

  createCrow() {
    const group = new THREE.Group();

    // If external 3D Crow GLB model is loaded, clone it
    if (_crowGltfTemplate) {
      const model = _crowGltfTemplate.clone(true);
      group.add(model);
      const wingL = model.getObjectByName("crow_wing_l");
      const wingR = model.getObjectByName("crow_wing_r");
      group.userData = {
        isGltf: true,
        model,
        wingL,
        wingR,
        setFlap(flap) {
          if (wingL && wingR) {
            wingL.rotation.z = flap;
            wingR.rotation.z = -flap;
          }
        }
      };
      return group;
    }

    // High-fidelity fallback model with authentic Dhaka House Crow (Corvus splendens) anatomy
    const featherMat = new THREE.MeshPhongMaterial({
      color: 0x1a1a24,
      emissive: 0x0a0a14,
      emissiveIntensity: 0.22,
      specular: 0x5c6bc0,
      shininess: 140
    });
    const collarMat = new THREE.MeshPhongMaterial({
      color: 0x546e7a,
      emissive: 0x1b272c,
      emissiveIntensity: 0.18,
      specular: 0x90a4ae,
      shininess: 100
    });
    const beakMat = new THREE.MeshPhongMaterial({
      color: 0xffa000,
      emissive: 0x553300,
      emissiveIntensity: 0.35,
      specular: 0xffffff,
      shininess: 180
    });
    const eyeWhiteMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 200 });
    const eyePupilMat = new THREE.MeshPhongMaterial({ color: 0x000000, shininess: 100 });

    // Aerodynamic body & chest
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 10), featherMat);
    body.rotation.z = -Math.PI / 2;
    body.scale.set(1.0, 1.0, 0.7);
    group.add(body);

    // Dhaka House Crow ash-grey neck collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.065, 0.05, 10), collarMat);
    collar.rotation.z = -Math.PI / 2;
    collar.position.set(0.06, 0.02, 0);
    group.add(collar);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), featherMat);
    head.position.set(0.10, 0.035, 0);
    group.add(head);

    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.075, 8), beakMat);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.165, 0.035, 0);
    group.add(beak);

    // Alert Eyes
    [-0.038, 0.038].forEach((ez) => {
      const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), eyeWhiteMat);
      eyeW.position.set(0.115, 0.045, ez);
      const eyeP = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), eyePupilMat);
      eyeP.position.set(0.120, 0.045, ez * 1.05);
      group.add(eyeW, eyeP);
    });

    // Fanned tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.08), featherMat);
    tail.position.set(-0.13, -0.01, 0);
    tail.rotation.z = 0.2;
    group.add(tail);

    // Sculpted Wings
    const wingGeo = new THREE.BoxGeometry(0.14, 0.014, 0.18);
    const wingL = new THREE.Mesh(wingGeo, featherMat);
    wingL.position.set(0.01, 0.03, 0.10);
    const wingR = new THREE.Mesh(wingGeo, featherMat);
    wingR.position.set(0.01, 0.03, -0.10);
    group.add(wingL, wingR);

    group.userData = {
      isGltf: false,
      wingL,
      wingR,
      setFlap(flap) {
        wingL.rotation.x = flap;
        wingR.rotation.x = -flap;
      }
    };

    _pendingCrowMeshes.add(group);
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

      // Smooth natural collectible animation (clean upright coin spin)
      if (it.key === "cha_cup") {
        mesh.rotation.y = Math.sin(time * 0.002 + (it.phase || 0)) * 0.35;
        mesh.rotation.x = 0;
        mesh.rotation.z = 0;
      } else {
        mesh.rotation.y = time * 0.0038 + (it.phase || 0);
        mesh.rotation.x = 0;
        mesh.rotation.z = 0;
      }

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
        if (mesh.userData.setFlap) {
          const flap = Math.sin(time * 0.02) * 0.7;
          mesh.userData.setFlap(flap);
        } else if (mesh.userData.wingL && mesh.userData.wingR) {
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
      } else if (it.type === "heart") {
        mesh.rotation.y = time * 0.0035 + (it.phase || 0);
        mesh.rotation.x = 0;
        mesh.rotation.z = Math.sin(time * 0.003 + (it.phase || 0)) * 0.08;
      } else {
        // Smooth classic upright coin spin
        mesh.rotation.y = time * 0.0038 + (it.phase || 0);
        mesh.rotation.x = 0;
        mesh.rotation.z = 0;
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
      } else if (mesh.userData.setFlap) {
        const flap = Math.sin(time * 0.018 + (e.phase || 0)) * 0.68;
        mesh.userData.setFlap(flap);
        mesh.rotation.z = Math.cos(time * 0.005 + (e.phase || 0)) * 0.12;
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
