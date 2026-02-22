import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─────────────────────────────────────────────
//  PATH 1 — Low/Medium mass  (0.3 – 8 M☉)
//  Nebula → Protostar → Main Sequence →
//  Red Giant → White Dwarf
// ─────────────────────────────────────────────
export const PATH1 = [
  {
    id: 'nebula',
    label: 'Nebula',
    modelPath: '/3d_models/Nebula/',
    description: 'A vast cloud of gas and dust — the birthplace of stars.',
    durationYears: 10_000_000,
    cameraDistance: 8,
    lightColor: 0x8866ff,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 4,
  },
  {
    id: 'protostar',
    label: 'Protostar',
    modelPath: '/3d_models/Protostar2/',
    description: 'Gravity collapses the cloud. A hot, dense core ignites.',
    durationYears: 100_000,
    cameraDistance: 8,
    lightColor: 0xff6633,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 1.5,
  },
  {
    id: 'main_sequence',
    label: 'Main Sequence',
    modelPath: '/3d_models/MainSequence/',
    description: 'Hydrogen fusion sustains the star for billions of years.',
    durationYears: 10_000_000_000,
    cameraDistance: 8,
    lightColor: 0xffffaa,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 1.5,
  },
  {
    id: 'red_giant',
    label: 'Red Giant',
    modelPath: '/3d_models/RedGiant/',
    description: 'Hydrogen exhausted — the outer layers expand enormously.',
    durationYears: 1_000_000_000,
    cameraDistance: 8,
    lightColor: 0xff3300,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 1.5,
  },
  {
    id: 'white_dwarf',
    label: 'White Dwarf',
    modelPath: '/3d_models/WhiteDwarf/',
    description: 'The stellar remnant slowly cools over trillions of years.',
    durationYears: 1_000_000_000_000,
    cameraDistance: 8,
    lightColor: 0xaaddff,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 1.5,
  },
];

// ─────────────────────────────────────────────
//  PATH 2 — High mass  (> 8 M☉)
//  Nebula → Protostar → Main Sequence 2 →
//  Red Supergiant → Supernova
// ─────────────────────────────────────────────
export const PATH2 = [
  {
    id: 'nebula',
    label: 'Nebula',
    modelPath: '/3d_models/Nebula/',
    description: 'A vast cloud of gas and dust — the birthplace of stars.',
    durationYears: 10_000_000,
    cameraDistance: 8,
    lightColor: 0x8866ff,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 4,
  },
  {
    id: 'protostar',
    label: 'Protostar',
    modelPath: '/3d_models/Protostar2/',
    description: 'Gravity collapses the cloud. A hot, dense core ignites.',
    durationYears: 100_000,
    cameraDistance: 8,
    lightColor: 0xff6633,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 1.5,
  },
  {
    id: 'main_sequence2',
    label: 'Main Sequence',
    modelPath: '/3d_models/MainSequence2/',
    description: 'A massive star burns hydrogen at a furious rate — its life is brief but brilliant.',
    durationYears: 10_000_000,
    cameraDistance: 8,
    lightColor: 0xaaddff,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 1.5,
  },
  {
    id: 'red_supergiant',
    label: 'Red Supergiant',
    modelPath: '/3d_models/RedSupergaint/',
    description: 'The core exhausts its fuel — the star swells into a colossal red supergiant.',
    durationYears: 100_000,
    cameraDistance: 8,
    lightColor: 0xff2200,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 1.5,
  },
  {
    id: 'supernova',
    label: 'Supernova',
    modelPath: '/3d_models/Supernova/',
    description: 'The core collapses in an instant — a colossal explosion tears the star apart.',
    durationYears: 1_000_000_000_000,
    cameraDistance: 8,
    lightColor: 0xffffff,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
    displaySize: 1.5,
  },
];

// ─────────────────────────────────────────────
//  Backwards-compatible export (defaults to PATH1)
// ─────────────────────────────────────────────
export const STAGES = PATH1;

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function resolveGLTFUrl(folderPath) {
  const folder = folderPath.replace(/\/$/, '');
  const name   = folder.split('/').pop();
  return [
    `${folder}/${name}.gltf`,
    `${folder}/scene.gltf`,
    `${folder}/model.gltf`,
    `${folder}/model.glb`,
  ];
}

// Normalise + scale model — works for meshes AND point-cloud models
function fitModel(model, displaySize) {
  const box = new THREE.Box3();
  model.traverse((obj) => {
    if (obj.isMesh || obj.isPoints || obj.isLine) {
      obj.geometry?.computeBoundingBox();
      box.union(new THREE.Box3().setFromObject(obj));
    }
  });

  if (box.isEmpty()) {
    console.warn('fitModel: empty bounding box, using default scale');
    model.scale.setScalar(displaySize);
    return;
  }

  const centre = box.getCenter(new THREE.Vector3());
  const size   = box.getSize(new THREE.Vector3()).length();
  console.log(`fitModel [${model.name || '?'}]: raw diagonal = ${size.toFixed(4)}`);

  model.position.sub(centre);
  if (size > 0) model.scale.setScalar(displaySize / size);
}

// ─────────────────────────────────────────────
//  StellarPath
// ─────────────────────────────────────────────
export class StellarPath {
  constructor(scene, camera, renderer) {
    this.scene    = scene;
    this.camera   = camera;
    this.renderer = renderer;

    this.loader    = new GLTFLoader();

    // Two separate caches, one per path
    this._cache1     = [];   // PATH1 models
    this._cache2     = [];   // PATH2 models
    this._activeCache = [];  // points to whichever path is in use

    this._activePath  = PATH1;  // current path array
    this._background  = null;

    this._transition  = null;
    this.currentModel = null;
    this.currentIndex = 0;
    this.isAnimating  = false;
    this.stellarMass  = 1.0;

    this.pointLight   = null;
    this.ambientLight = null;

    this._drag = { active: false, lastX: 0, lastY: 0, velX: 0, velY: 0 };

    this._setupLights();
    this._bindDrag();
  }

  // ── Select active path based on mass ─────────
  selectPath(mass) {
    if (mass > 8) {
      this._activePath  = PATH2;
      this._activeCache = this._cache2;
    } else {
      this._activePath  = PATH1;
      this._activeCache = this._cache1;
    }
    this.stellarMass  = mass;
    this.currentIndex = 0;
    this.currentModel = null;
  }

  get activeStages() { return this._activePath; }

  // ── Lights ───────────────────────────────────
  _setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(this.ambientLight);
    this.pointLight = new THREE.PointLight(0xffffff, 1.5, 200);
    this.pointLight.position.set(5, 5, 5);
    this.scene.add(this.pointLight);
  }

  // ── Drag ─────────────────────────────────────
  _bindDrag() {
    const canvas = this.renderer.domElement;
    const onDown = (x, y) => {
      if (this.isAnimating) return;
      this._drag.active = true;
      this._drag.lastX  = x;
      this._drag.lastY  = y;
      this._drag.velX   = 0;
      this._drag.velY   = 0;
    };
    const onMove = (x, y) => {
      if (!this._drag.active || !this.currentModel) return;
      const dx = x - this._drag.lastX;
      const dy = y - this._drag.lastY;
      this._drag.velX = dy * 0.005;
      this._drag.velY = dx * 0.005;
      this.currentModel.rotation.x += this._drag.velX;
      this.currentModel.rotation.y += this._drag.velY;
      this._drag.lastX = x;
      this._drag.lastY = y;
    };
    const onUp = () => { this._drag.active = false; };

    canvas.addEventListener('mousedown',  (e) => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove',  (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup',    onUp);
    canvas.addEventListener('touchstart', (e) => onDown(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove',  (e) => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchend',   onUp);
  }

  // ── Background ───────────────────────────────
  loadBackground() {
    return new Promise((resolve) => {
      this.loader.load(
        '/scene.gltf',
        (gltf) => {
          const bg  = gltf.scene;
          const box = new THREE.Box3().setFromObject(bg);
          bg.position.sub(box.getCenter(new THREE.Vector3()));
          bg.scale.setScalar(20);
          this.scene.add(bg);
          this._background = bg;
          resolve();
        },
        undefined,
        (err) => {
          console.warn('Background load failed:', err);
          this._particleFallback();
          resolve();
        }
      );
    });
  }

  _particleFallback() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(3000 * 3).map(() => (Math.random() - 0.5) * 200);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 })));
  }

  // ── Preload both paths in parallel ───────────
  preloadAll(onEachLoaded) {
    // Deduplicate shared stages (Nebula + Protostar appear in both paths)
    // Build a map: modelPath → loaded model, shared between caches
    const sharedModelCache = new Map();

    const totalUnique = PATH1.length + PATH2.length - 2; // nebula+protostar counted once each
    let loadedCount = 0;

    const loadStage = (stage) => {
      if (sharedModelCache.has(stage.modelPath)) {
        // Already loading/loaded — return the same promise
        return sharedModelCache.get(stage.modelPath);
      }
      const p = this._loadOne(stage).then((model) => {
        fitModel(model, stage.displaySize);
        loadedCount++;
        if (onEachLoaded) onEachLoaded(loadedCount, totalUnique);
        return model;
      });
      sharedModelCache.set(stage.modelPath, p);
      return p;
    };

    const p1 = Promise.all(PATH1.map((stage, i) =>
      loadStage(stage).then((model) => { this._cache1[i] = model; })
    ));

    const p2 = Promise.all(PATH2.map((stage, i) =>
      loadStage(stage).then((model) => { this._cache2[i] = model; })
    ));

    return Promise.all([p1, p2]).then(() => {
      // Default active cache
      this._activeCache = this._cache1;
    });
  }

  _loadOne(stage) {
    return new Promise((resolve) => {
      const candidates = resolveGLTFUrl(stage.modelPath);
      let tried = 0;
      const tryNext = () => {
        if (tried >= candidates.length) {
          console.warn(`[${stage.id}] all paths failed — using fallback sphere`);
          resolve(this._fallbackSphere(stage));
          return;
        }
        const url = candidates[tried++];
        console.log(`[${stage.id}] trying: ${url}`);
        this.loader.load(
          url,
          (gltf) => { console.log(`[${stage.id}] loaded OK: ${url}`); resolve(gltf.scene); },
          undefined,
          (err) => { console.warn(`[${stage.id}] failed: ${url}`, err.message ?? err); tryNext(); }
        );

      };
      tryNext();
    });
  }

  _fallbackSphere(stage) {
    const colorMap = {
      nebula: 0x8844cc, protostar: 0xff6622,
      main_sequence: 0xffffaa, main_sequence2: 0x88ccff,
      red_giant: 0xff2200, red_supergiant: 0xff1100,
      white_dwarf: 0xaaccff, supernova: 0xffffff,
    };
    const color = colorMap[stage.id] ?? 0xffffff;
    return new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 })
    );
  }

  // ── Transition (tick-driven) ──────────────────
  transitionTo(index, onProgress) {
    if (this.isAnimating) return;

    const nextModel = this._activeCache[index];
    if (!nextModel) {
      console.error(`Stage ${index} not in active cache`);
      return;
    }

    this.isAnimating = true;
    this._drag.velX = 0;
    this._drag.velY = 0;

    const prevModel = this.currentModel;
    const stage     = this._activePath[index];
    const fromSize  = this._activePath[this.currentIndex]?.displaySize ?? stage.displaySize;
    const toSize    = stage.displaySize;

    nextModel.scale.setScalar(toSize);
    nextModel.rotation.set(0, prevModel ? prevModel.rotation.y : 0, 0);

    this._transition = {
      prevModel,
      nextModel,
      stage,
      index,
      fromSize,
      toSize,
      onProgress,
      spinUpDur:   prevModel ? 500 : 0,
      spinDownDur: 600,
      elapsed: 0,
      phase: 'spinUp',
      swapped: false,
      SPIN_MAX: 0.28,
    };
  }

  // ── Tick ─────────────────────────────────────
  tick(delta) {
    if (this._background) {
      this._background.rotation.y += 0.0001;
      this._background.rotation.x += 0.00004;
    }

    if (!this.isAnimating && !this._drag.active && this.currentModel) {
      this.currentModel.rotation.x += this._drag.velX;
      this.currentModel.rotation.y += this._drag.velY;
      this._drag.velX *= 0.92;
      this._drag.velY *= 0.92;
    }

    if (!this._transition) return;

    const dt = delta * 1000;
    const tr = this._transition;
    tr.elapsed += dt;

    if (tr.phase === 'spinUp') {
      const t   = Math.min(tr.elapsed / (tr.spinUpDur || 1), 1);
      const eIn = t * t;

      if (tr.prevModel) {
        tr.prevModel.rotation.y += eIn * tr.SPIN_MAX;
        // const eScale = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        // tr.prevModel.scale.setScalar(tr.fromSize + (tr.toSize - tr.fromSize) * eScale);
      }

      if (t >= 1 && !tr.swapped) {
        tr.swapped = true;
        if (tr.prevModel) this.scene.remove(tr.prevModel);

        tr.nextModel.rotation.y = tr.prevModel ? tr.prevModel.rotation.y : 0;
        tr.nextModel.scale.setScalar(tr.toSize);
        this.scene.add(tr.nextModel);

        this.currentModel = tr.nextModel;
        this.currentIndex = tr.index;

        this.pointLight.color.set(tr.stage.lightColor);
        this.pointLight.intensity   = tr.stage.lightIntensity;
        this.ambientLight.intensity = tr.stage.ambientIntensity;

        this._animateCamera(tr.stage.cameraDistance);

        tr.phase   = 'spinDown';
        tr.elapsed = 0;
      }

    } else if (tr.phase === 'spinDown') {
      const t    = Math.min(tr.elapsed / tr.spinDownDur, 1);
      const eOut = 1 - (1 - t) * (1 - t);
      this.currentModel.rotation.y += tr.SPIN_MAX * (1 - eOut);

      if (t >= 1) {
        this._transition = null;
        this.isAnimating = false;
        if (tr.onProgress) tr.onProgress('ready', tr.stage);
      }
    }
  }

  // ── Navigation ────────────────────────────────
  next(onProgress) {
    const i = Math.min(this.currentIndex + 1, this._activePath.length - 1);
    if (i === this.currentIndex) return;
    this.transitionTo(i, onProgress);
  }

  prev(onProgress) {
    const i = Math.max(this.currentIndex - 1, 0);
    if (i === this.currentIndex) return;
    this.transitionTo(i, onProgress);
  }

  get isFirst() { return this.currentIndex === 0; }
  get isLast()  { return this.currentIndex === this._activePath.length - 1; }

  // ── Camera lerp ───────────────────────────────
  _animateCamera(targetZ) {
    const startZ = this.camera.position.z;
    const dur    = 900;
    let elapsed  = 0, last = performance.now();
    const step = (now) => {
      elapsed += now - last; last = now;
      const t = Math.min(elapsed / dur, 1);
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      this.camera.position.z = startZ + (targetZ - startZ) * e;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _setOpacity(obj, value) {
    obj.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => { m.transparent = true; m.opacity = value; });
      }
    });
  }
}
