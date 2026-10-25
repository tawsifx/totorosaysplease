// js/3d/stage3d.js - Interactive 3D Dhaka Voxel World & Diorama Engine powered by Three.js
// Features 3D animated Totoro with swaying leaf umbrella, spoked Rickshaws, CNGs,
// bus stop shelter with real-time PointLight illumination, spinning gold coins, and Krishnachura petal vortex.

import * as THREE from "three";

export class Stage3D {
  constructor(containerId, options = {}) {
    this.container = typeof document !== "undefined" ? document.getElementById(containerId) : null;
    this.options = Object.assign({
      stage: 0, // 0: Dhanmondi, 1: Hatirjheel, 2: Old Dhaka
      interactive: true,
      autoRotate: true,
      width: null,
      height: null
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animId = null;
    this.startTime = (typeof performance !== "undefined" ? performance.now() : Date.now());
    this.lastTime = this.startTime;

    // Scene groups
    this.totoroGroup = null;
    this.umbrellaGroup = null;
    this.rickshawGroup = null;
    this.cngGroup = null;
    this.busStopGroup = null;
    this.coinGroup = null;
    this.petalsMesh = null;
    this.petalData = [];
    this.lights = {};

    // Interactive Camera Controls
    this.targetRotY = 0;
    this.targetRotX = 0;
    this.currentRotY = 0;
    this.currentRotX = 0;
    this.isPointerDown = false;
    this.prevPointerPos = { x: 0, y: 0 };

    // Dynamic celebration state
    this.celebrateTimer = 0;
    this.jumpVelocity = 0;
    this.totoroBaseY = 0.95;

    if (this.container) {
      this.init();
    }
  }

  init() {
    if (!this.container || typeof window === "undefined") return;

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup
    const w = this.options.width || this.container.clientWidth || 800;
    const h = this.options.height || this.container.clientHeight || 450;
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 2.2, 5.8);
    this.camera.lookAt(0, 1.2, 0);

    // 3. WebGLRenderer with shadows and transparency
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.className = "three-canvas";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.outline = "none";

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting System
    this.setupLighting();

    // 5. Environment & Ground
    this.buildGround();

    // 6. 3D Bus Stop Shelter
    this.buildBusStop();

    // 7. 3D Animated Totoro with Leaf Umbrella
    this.buildTotoro();

    // 8. 3D Dhaka Vehicles (Rickshaw & CNG)
    this.buildVehicles();

    // 9. 3D Spinning Gold Coins & Steam
    this.buildCollectibles();

    // 10. 3D Krishnachura Petal Vortex System
    this.buildPetals();

    // 11. Event Listeners for Interaction & Resize
    this.setupEvents();

    // 12. Apply stage styling
    this.setStage(this.options.stage);

    // Start loop
    this.animate();
  }

  setupLighting() {
    // Ambient Light (warm Dhaka golden tone)
    const ambient = new THREE.AmbientLight(0xfff5eb, 0.85);
    this.scene.add(ambient);
    this.lights.ambient = ambient;

    // Directional Sunlight with Soft Shadows
    const sun = new THREE.DirectionalLight(0xffebd2, 1.8);
    sun.position.set(4, 8, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 20;
    sun.shadow.camera.left = -4;
    sun.shadow.camera.right = 4;
    sun.shadow.camera.top = 4;
    sun.shadow.camera.bottom = -4;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);
    this.lights.sun = sun;

    // PointLight inside Bus Stop Streetlamp
    const lampLight = new THREE.PointLight(0xffa834, 2.8, 8, 1.2);
    lampLight.position.set(-1.4, 2.5, 0.4);
    lampLight.castShadow = true;
    lampLight.shadow.bias = -0.002;
    this.scene.add(lampLight);
    this.lights.lamp = lampLight;

    // Subtle Cyan/Rose Rim Light from the side
    const rimLight = new THREE.DirectionalLight(0xf48fb1, 0.5);
    rimLight.position.set(-5, 3, -4);
    this.scene.add(rimLight);
    this.lights.rim = rimLight;
  }

  buildGround() {
    // Ground Foundation with Dhaka pavement texture
    const groundGeo = new THREE.PlaneGeometry(24, 24);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xded5cb,
      roughness: 0.85,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Sidewalk Curb Raised Platform
    const curbGeo = new THREE.BoxGeometry(16, 0.14, 3.2);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x7a6f66,
      roughness: 0.7
    });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(0, 0.07, -0.2);
    curb.receiveShadow = true;
    this.scene.add(curb);

    // Asphalt Road Front Strip
    const roadGeo = new THREE.BoxGeometry(16, 0.02, 3.5);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xb5aba0,
      roughness: 0.9
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, 0.01, 2.2);
    road.receiveShadow = true;
    this.scene.add(road);

    // White dashed road markings
    const markGeo = new THREE.BoxGeometry(0.7, 0.025, 0.08);
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let x = -7; x <= 7; x += 1.8) {
      const mark = new THREE.Mesh(markGeo, markMat);
      mark.position.set(x, 0.02, 2.2);
      this.scene.add(mark);
    }
  }

  buildBusStop() {
    this.busStopGroup = new THREE.Group();
    this.busStopGroup.position.set(-1.4, 0, -0.6);

    // Steel Support Pillars (Dark Charcoal)
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8, roughness: 0.3 });
    const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.4, 16);

    const pillarLeft = new THREE.Mesh(pillarGeo, pillarMat);
    pillarLeft.position.set(-1.1, 1.2, 0);
    pillarLeft.castShadow = true;
    this.busStopGroup.add(pillarLeft);

    const pillarRight = new THREE.Mesh(pillarGeo, pillarMat);
    pillarRight.position.set(1.1, 1.2, 0);
    pillarRight.castShadow = true;
    this.busStopGroup.add(pillarRight);

    // Translucent Back Route Display Panel
    const panelGeo = new THREE.BoxGeometry(2.1, 1.3, 0.04);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xfef9f0,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88
    });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 1.2, -0.15);
    panel.castShadow = true;
    this.busStopGroup.add(panel);

    // Route banner header (Dhaka Crimson)
    const routeHeaderGeo = new THREE.BoxGeometry(2.0, 0.2, 0.05);
    const routeHeaderMat = new THREE.MeshStandardMaterial({ color: 0xd9384f, roughness: 0.5 });
    const routeHeader = new THREE.Mesh(routeHeaderGeo, routeHeaderMat);
    routeHeader.position.set(0, 1.7, -0.14);
    this.busStopGroup.add(routeHeader);

    // Wooden Waiting Bench
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8c583a, roughness: 0.7 });
    const benchPlank = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.4), woodMat);
    benchPlank.position.set(0, 0.45, 0.05);
    benchPlank.castShadow = true;
    this.busStopGroup.add(benchPlank);

    const benchLegsMat = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.6, roughness: 0.4 });
    const legLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.35), benchLegsMat);
    legLeft.position.set(-0.75, 0.225, 0.05);
    legLeft.castShadow = true;
    this.busStopGroup.add(legLeft);

    const legRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.35), benchLegsMat);
    legRight.position.set(0.75, 0.225, 0.05);
    legRight.castShadow = true;
    this.busStopGroup.add(legRight);

    // Arched Dhaka Green & Crimson Bus Shelter Roof
    const roofGeo = new THREE.CylinderGeometry(1.4, 1.4, 2.6, 24, 1, false, Math.PI * 0.15, Math.PI * 0.7);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1b5e20,
      roughness: 0.5,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = Math.PI * 0.1;
    roof.position.set(0, 2.35, 0.1);
    roof.castShadow = true;
    this.busStopGroup.add(roof);

    // Glowing Shelter Lantern
    const lanternGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.22, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffe46b,
      emissive: 0xffaa2b,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(0, 2.2, 0.15);
    this.busStopGroup.add(lantern);

    // Bus Stop Sign Post ("BUS")
    const signGroup = new THREE.Group();
    signGroup.position.set(-1.6, 0, 0.3);

    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 12), pillarMat);
    signPole.position.set(0, 1.05, 0);
    signPole.castShadow = true;
    signGroup.add(signPole);

    const signDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 24), new THREE.MeshStandardMaterial({
      color: 0xd9384f,
      roughness: 0.4
    }));
    signDisc.rotation.x = Math.PI / 2;
    signDisc.position.set(0, 1.95, 0);
    signDisc.castShadow = true;
    signGroup.add(signDisc);

    this.busStopGroup.add(signGroup);
    this.scene.add(this.busStopGroup);
  }

  buildTotoro() {
    this.totoroGroup = new THREE.Group();
    this.totoroGroup.position.set(0.65, this.totoroBaseY, -0.15);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6e6d60, roughness: 0.7, metalness: 0.05 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xf2ebd4, roughness: 0.6 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x21211b, roughness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.4 });

    // Main Volumetric Pear Body
    const bodyGeo = new THREE.SphereGeometry(0.68, 24, 24);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1.0, 1.18, 0.95);
    body.castShadow = true;
    this.totoroGroup.add(body);

    // Big Cream Belly
    const bellyGeo = new THREE.SphereGeometry(0.55, 20, 20);
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.scale.set(0.9, 1.05, 0.75);
    belly.position.set(0, -0.05, 0.28);
    this.totoroGroup.add(belly);

    // Distinctive Chevron markings on chest (7 curved marks)
    const markGeo = new THREE.TorusGeometry(0.07, 0.018, 8, 12, Math.PI * 0.85);
    const chevronCoords = [
      [-0.2, 0.24, 0.58], [0, 0.28, 0.6], [0.2, 0.24, 0.58],
      [-0.26, 0.08, 0.62], [-0.08, 0.12, 0.64], [0.08, 0.12, 0.64], [0.26, 0.08, 0.62]
    ];
    chevronCoords.forEach(([cx, cy, cz]) => {
      const ch = new THREE.Mesh(markGeo, darkMat);
      ch.rotation.z = Math.PI * 0.95;
      ch.position.set(cx, cy, cz);
      this.totoroGroup.add(ch);
    });

    // Pointed Leaf-like Ears with Pivot for Twitching
    const earGeo = new THREE.ConeGeometry(0.12, 0.52, 16);
    this.earLeft = new THREE.Mesh(earGeo, bodyMat);
    this.earLeft.position.set(-0.35, 0.95, -0.05);
    this.earLeft.rotation.z = 0.22;
    this.earLeft.castShadow = true;
    this.totoroGroup.add(this.earLeft);

    this.earRight = new THREE.Mesh(earGeo, bodyMat);
    this.earRight.position.set(0.35, 0.95, -0.05);
    this.earRight.rotation.z = -0.22;
    this.earRight.castShadow = true;
    this.totoroGroup.add(this.earRight);

    // Eyes with white sclera and black pupils
    const eyeWhiteGeo = new THREE.SphereGeometry(0.08, 14, 14);
    const eyePupilGeo = new THREE.SphereGeometry(0.045, 12, 12);

    const eyeL = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    eyeL.position.set(-0.25, 0.42, 0.54);
    const pupilL = new THREE.Mesh(eyePupilGeo, darkMat);
    pupilL.position.set(-0.25, 0.43, 0.61);
    this.totoroGroup.add(eyeL);
    this.totoroGroup.add(pupilL);

    const eyeR = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    eyeR.position.set(0.25, 0.42, 0.54);
    const pupilR = new THREE.Mesh(eyePupilGeo, darkMat);
    pupilR.position.set(0.25, 0.43, 0.61);
    this.totoroGroup.add(eyeR);
    this.totoroGroup.add(pupilR);

    // Black Nose & Mouth
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.05, 12), noseMat);
    nose.rotation.x = Math.PI * 0.45;
    nose.position.set(0, 0.36, 0.64);
    this.totoroGroup.add(nose);

    // Whiskers (3 on left, 3 on right)
    const whiskerGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.35, 6);
    [-0.04, 0, 0.04].forEach((dy, idx) => {
      const wL = new THREE.Mesh(whiskerGeo, darkMat);
      wL.rotation.z = Math.PI * 0.45 + idx * 0.08;
      wL.position.set(-0.48, 0.35 + dy, 0.45);
      this.totoroGroup.add(wL);

      const wR = new THREE.Mesh(whiskerGeo, darkMat);
      wR.rotation.z = -Math.PI * 0.45 - idx * 0.08;
      wR.position.set(0.48, 0.35 + dy, 0.45);
      this.totoroGroup.add(wR);
    });

    // Paws & Umbrella holding arm
    const pawGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const pawL = new THREE.Mesh(pawGeo, bodyMat);
    pawL.scale.set(0.8, 1.2, 0.9);
    pawL.position.set(-0.58, -0.05, 0.15);
    pawL.castShadow = true;
    this.totoroGroup.add(pawL);

    const pawR = new THREE.Mesh(pawGeo, bodyMat);
    pawR.scale.set(0.8, 1.2, 0.9);
    pawR.position.set(0.55, 0.08, 0.28);
    pawR.castShadow = true;
    this.totoroGroup.add(pawR);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.25, 0.14, 0.4);
    const footL = new THREE.Mesh(footGeo, bodyMat);
    footL.position.set(-0.3, -0.74, 0.08);
    footL.castShadow = true;
    this.totoroGroup.add(footL);

    const footR = new THREE.Mesh(footGeo, bodyMat);
    footR.position.set(0.3, -0.74, 0.08);
    footR.castShadow = true;
    this.totoroGroup.add(footR);

    // Leaf Umbrella (Totoro holds his big lotus/taro leaf)
    this.umbrellaGroup = new THREE.Group();
    this.umbrellaGroup.position.set(0.54, 0.2, 0.35);

    // Bamboo stalk handle
    const stalkGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8);
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0x3e7557, roughness: 0.6 });
    const stalk = new THREE.Mesh(stalkGeo, stalkMat);
    stalk.position.set(0, 0.7, 0);
    stalk.castShadow = true;
    this.umbrellaGroup.add(stalk);

    // Curved vibrant green leaf canopy
    const leafGeo = new THREE.CylinderGeometry(0.82, 0.6, 0.22, 24, 1, false);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x43a047,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, 1.5, 0);
    leaf.rotation.x = 0.1;
    leaf.castShadow = true;
    this.umbrellaGroup.add(leaf);

    // Golden leaf rim highlight
    const leafRimGeo = new THREE.TorusGeometry(0.82, 0.02, 8, 24);
    const leafRimMat = new THREE.MeshStandardMaterial({ color: 0x86d4aa, roughness: 0.3 });
    const leafRim = new THREE.Mesh(leafRimGeo, leafRimMat);
    leafRim.rotation.x = Math.PI / 2 + 0.1;
    leafRim.position.set(0, 1.4, 0);
    this.umbrellaGroup.add(leafRim);

    this.totoroGroup.add(this.umbrellaGroup);
    this.scene.add(this.totoroGroup);
  }

  buildVehicles() {
    // 1. Dhaka Cycle Rickshaw Model
    this.rickshawGroup = new THREE.Group();
    this.rickshawGroup.position.set(2.4, 0.38, 1.6);
    this.rickshawGroup.scale.set(0.85, 0.85, 0.85);

    const rickMat = new THREE.MeshStandardMaterial({ color: 0xe91e63, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.6, roughness: 0.3 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.6 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x43a047, metalness: 0.7, roughness: 0.4 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.8 });

    // Ornate Passenger Hood
    const hoodGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.7, 16, 1, false, 0, Math.PI);
    const hood = new THREE.Mesh(hoodGeo, rickMat);
    hood.rotation.z = Math.PI / 2;
    hood.rotation.y = -Math.PI / 2;
    hood.position.set(-0.3, 0.6, 0);
    hood.castShadow = true;
    this.rickshawGroup.add(hood);

    // Passenger Cushion Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.55), blueMat);
    seat.position.set(-0.25, 0.28, 0);
    this.rickshawGroup.add(seat);

    // Chassis Frame & Cycle handlebars
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.4), frameMat);
    frame.position.set(0.1, 0.2, 0);
    this.rickshawGroup.add(frame);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8), goldMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.65, 0.65, 0);
    this.rickshawGroup.add(handle);

    // Spoked Wheels
    this.rickshawWheels = [];
    const wheelGeo = new THREE.TorusGeometry(0.32, 0.04, 8, 20);
    const spokeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.64, 4);

    const createWheel = (x, y, z) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(x, y, z);
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.castShadow = true;
      wGroup.add(tire);
      for (let a = 0; a < 4; a++) {
        const sp = new THREE.Mesh(spokeGeo, goldMat);
        sp.rotation.z = (Math.PI / 4) * a;
        wGroup.add(sp);
      }
      this.rickshawGroup.add(wGroup);
      this.rickshawWheels.push(wGroup);
    };

    createWheel(-0.25, 0, -0.32); // Rear left
    createWheel(-0.25, 0, 0.32);  // Rear right
    createWheel(0.65, 0, 0);      // Front wheel

    this.scene.add(this.rickshawGroup);

    // 2. Green Dhaka CNG Auto-Rickshaw Model
    this.cngGroup = new THREE.Group();
    this.cngGroup.position.set(-2.8, 0.4, 2.0);
    this.cngGroup.scale.set(0.85, 0.85, 0.85);

    const cngGreenMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5, metalness: 0.1 });
    const cngYellowMat = new THREE.MeshStandardMaterial({ color: 0xfdd835, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x81d4fa, roughness: 0.1, transparent: true, opacity: 0.75 });

    // Curved green body
    const cngBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 0.75), cngGreenMat);
    cngBody.position.set(0, 0.35, 0);
    cngBody.castShadow = true;
    this.cngGroup.add(cngBody);

    // Yellow waist band
    const cngStripe = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.1, 0.76), cngYellowMat);
    cngStripe.position.set(0, 0.22, 0);
    this.cngGroup.add(cngStripe);

    // Glass Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.7), glassMat);
    windshield.position.set(0.4, 0.55, 0);
    windshield.rotation.z = -0.3;
    this.cngGroup.add(windshield);

    // Headlight (glowing)
    const cngHeadlight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff59d }));
    cngHeadlight.position.set(0.66, 0.28, 0);
    this.cngGroup.add(cngHeadlight);

    // CNG wheels
    this.cngWheels = [];
    const cngWheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
    cngWheelGeo.rotateZ(Math.PI / 2);

    const createCngWheel = (x, y, z) => {
      const wh = new THREE.Mesh(cngWheelGeo, tireMat);
      wh.position.set(x, y, z);
      wh.castShadow = true;
      this.cngGroup.add(wh);
      this.cngWheels.push(wh);
    };

    createCngWheel(-0.4, 0, -0.4);
    createCngWheel(-0.4, 0, 0.4);
    createCngWheel(0.45, 0, 0);

    this.scene.add(this.cngGroup);
  }

  buildCollectibles() {
    this.coinGroup = new THREE.Group();

    // 3D Metallic Gold Coins
    const coinGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 24);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x996500,
      emissiveIntensity: 0.2
    });

    this.coins = [];
    const coinPositions = [
      [-0.4, 1.4, 1.2],
      [0.0, 1.6, 1.2],
      [0.4, 1.4, 1.2]
    ];
    coinPositions.forEach(([cx, cy, cz], idx) => {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(cx, cy, cz);
      coin.castShadow = true;
      this.coinGroup.add(coin);
      this.coins.push({ mesh: coin, baseY: cy, offset: idx * 0.8 });
    });

    this.scene.add(this.coinGroup);
  }

  buildPetals() {
    // 3D Swirling Krishnachura Petals Particle System
    const petalCount = 75;
    const petalGeo = new THREE.CircleGeometry(0.06, 6);
    const petalColors = [0xe84a5f, 0xff7b54, 0xf25c84, 0xffa0b4];

    this.petalGroup = new THREE.Group();
    for (let i = 0; i < petalCount; i++) {
      const col = petalColors[i % petalColors.length];
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.82
      });
      const p = new THREE.Mesh(petalGeo, mat);
      const px = (Math.random() - 0.5) * 12;
      const py = Math.random() * 5 + 0.5;
      const pz = (Math.random() - 0.5) * 8;
      p.position.set(px, py, pz);
      this.petalGroup.add(p);
      this.petalData.push({
        mesh: p,
        vx: -(Math.random() * 0.8 + 0.6),
        vy: -(Math.random() * 0.4 + 0.2),
        rotX: Math.random() * 2,
        rotY: Math.random() * 2,
        phase: Math.random() * 10
      });
    }
    this.scene.add(this.petalGroup);
  }

  setupEvents() {
    const el = this.renderer.domElement;

    // Pointer move / hover for smooth parallax
    const onPointerMove = e => {
      const rect = el.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      if (this.isPointerDown) {
        const dx = clientX - this.prevPointerPos.x;
        const dy = clientY - this.prevPointerPos.y;
        this.targetRotY += dx * 0.008;
        this.targetRotX += dy * 0.005;
        this.prevPointerPos = { x: clientX, y: clientY };
      } else {
        this.targetRotY = x * 0.45;
        this.targetRotX = y * 0.25;
      }
    };

    const onPointerDown = e => {
      this.isPointerDown = true;
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      this.prevPointerPos = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      this.isPointerDown = false;
    };

    el.addEventListener("mousemove", onPointerMove);
    el.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mouseup", onPointerUp);

    el.addEventListener("touchmove", onPointerMove, { passive: true });
    el.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    // Responsive resize handler
    window.addEventListener("resize", () => this.onResize());
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w > 0 && h > 0) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }
  }

  setStage(stageIdx) {
    this.options.stage = stageIdx;
    if (!this.lights.sun) return;

    if (stageIdx === 0) {
      // Stage 1: Dhanmondi Golden Sunset
      this.lights.ambient.color.setHex(0xfff3e6);
      this.lights.ambient.intensity = 0.9;
      this.lights.sun.color.setHex(0xffdfb3);
      this.lights.sun.intensity = 2.0;
      this.lights.lamp.intensity = 1.8;
      if (this.rickshawGroup) this.rickshawGroup.visible = true;
      if (this.cngGroup) this.cngGroup.visible = false;
    } else if (stageIdx === 1) {
      // Stage 2: Hatirjheel Rose Twilight
      this.lights.ambient.color.setHex(0xfce4ec);
      this.lights.ambient.intensity = 0.75;
      this.lights.sun.color.setHex(0xf48fb1);
      this.lights.sun.intensity = 1.4;
      this.lights.lamp.intensity = 2.4;
      if (this.rickshawGroup) this.rickshawGroup.visible = false;
      if (this.cngGroup) this.cngGroup.visible = true;
    } else {
      // Stage 3: Old Dhaka Dusky Night
      this.lights.ambient.color.setHex(0xe8e0f0);
      this.lights.ambient.intensity = 0.65;
      this.lights.sun.color.setHex(0xffd54f);
      this.lights.sun.intensity = 1.0;
      this.lights.lamp.intensity = 3.6;
      if (this.rickshawGroup) this.rickshawGroup.visible = true;
      if (this.cngGroup) this.cngGroup.visible = true;
    }
  }

  resetCamera() {
    this.targetRotX = 0;
    this.targetRotY = 0;
    this.currentRotX = 0;
    this.currentRotY = 0;
  }

  onJump() {
    // Totoro reacts to jump with an ear twitch & umbrella bounce
    if (this.jumpVelocity <= 0 && this.totoroGroup) {
      this.jumpVelocity = 4.2;
    }
  }

  onScore() {
    // 3D Coin collection burst flash
    if (this.lights.lamp) {
      const orig = this.lights.lamp.intensity;
      this.lights.lamp.intensity = orig + 2.5;
      setTimeout(() => { if (this.lights.lamp) this.lights.lamp.intensity = orig; }, 180);
    }
  }

  onWin() {
    // Totoro celebration sequence: continuous joyful bouncing
    this.celebrateTimer = 5.0;
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());
    const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const time = (now - this.startTime) / 1000;

    // 1. Smooth Camera Rotation with Damping
    this.currentRotY += (this.targetRotY - this.currentRotY) * 0.08;
    this.currentRotX += (this.targetRotX - this.currentRotX) * 0.08;

    this.camera.position.x = Math.sin(this.currentRotY) * 5.8;
    this.camera.position.z = Math.cos(this.currentRotY) * 5.8;
    this.camera.position.y = 2.2 + this.currentRotX * 1.5;
    this.camera.lookAt(0, 1.2, 0);

    // 2. Animated Totoro Breathing & Bouncing
    if (this.totoroGroup) {
      const breath = Math.sin(time * 2.4) * 0.035;
      this.totoroGroup.scale.set(1 + breath * 0.5, 1 - breath, 1 + breath * 0.5);

      // Ear twitch
      if (this.earLeft && this.earRight) {
        this.earLeft.rotation.z = 0.22 + Math.sin(time * 3.5) * 0.06;
        this.earRight.rotation.z = -0.22 - Math.sin(time * 3.5 + 0.4) * 0.06;
      }

      // Umbrella swaying in the wind
      if (this.umbrellaGroup) {
        this.umbrellaGroup.rotation.z = Math.sin(time * 1.8) * 0.08;
        this.umbrellaGroup.rotation.x = Math.cos(time * 1.5) * 0.05;
      }

      // Jump / Celebrate physics
      if (this.jumpVelocity > 0 || this.totoroGroup.position.y > this.totoroBaseY) {
        this.totoroGroup.position.y += this.jumpVelocity * dt;
        this.jumpVelocity -= 14 * dt;
        if (this.totoroGroup.position.y <= this.totoroBaseY) {
          this.totoroGroup.position.y = this.totoroBaseY;
          this.jumpVelocity = 0;
        }
      }

      // Celebration jumping loop
      if (this.celebrateTimer > 0) {
        this.celebrateTimer -= dt;
        if (this.totoroGroup.position.y <= this.totoroBaseY + 0.02) {
          this.jumpVelocity = 4.8;
        }
      }
    }

    // 3. 3D Spinning Gold Coins with Specular Glint
    if (this.coins) {
      this.coins.forEach(c => {
        c.mesh.rotation.y = time * 2.8 + c.offset;
        c.mesh.position.y = c.baseY + Math.sin(time * 3 + c.offset) * 0.08;
      });
    }

    // 4. Rotating Vehicle Wheels
    if (this.rickshawWheels) {
      this.rickshawWheels.forEach(w => {
        w.rotation.y += dt * 3.2;
      });
    }
    if (this.cngWheels) {
      this.cngWheels.forEach(w => {
        w.rotation.x += dt * 3.5;
      });
    }

    // 5. Swirling Krishnachura Petal Vortex in 3D
    if (this.petalData) {
      this.petalData.forEach(p => {
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt + Math.sin(time * 2 + p.phase) * 0.008;
        p.mesh.rotation.x += p.rotX * dt;
        p.mesh.rotation.y += p.rotY * dt;

        // Wrap around 3D boundary
        if (p.mesh.position.x < -6) p.mesh.position.x = 6;
        if (p.mesh.position.y < 0.1) p.mesh.position.y = 5.0;
      });
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.scene) {
      this.scene.clear();
    }
  }
}
