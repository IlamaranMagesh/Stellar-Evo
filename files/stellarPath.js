import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─────────────────────────────────────────────
//  Stellar Evolution Stage Definitions
// ─────────────────────────────────────────────
export const STAGES = [
  {
    id: 'nebula',
    label: 'Nebula',
    modelPath: '/3d_models/Nebula/',
    description: 'A vast cloud of gas and dust — the birthplace of stars.',
    durationYears: 10_000_000,       // 10 million years
    cameraDistance: 8,
    lightColor: 0x8866ff,
    lightIntensity: 0.6,
    ambientIntensity: 0.4,
  },
  {
    id: 'protostar',
    label: 'Protostar',
    modelPath: '/3d_models/Protostar/',
    description: 'Gravity collapses the cloud. A hot, dense core ignites.',
    durationYears: 100_000,
    cameraDistance: 5,
    lightColor: 0xff6633,
    lightIntensity: 1.0,
    ambientIntensity: 0.3,
  },
  {
    id: 'main_sequence',
    label: 'Main Sequence',
    modelPath: '/3d_models/MainSequence/',
    description: 'Hydrogen fusion sustains the star for billions of years.',
    durationYears: 10_000_000_000,   // 10 billion years
    cameraDistance: 5,
    lightColor: 0xffffaa,
    lightIntensity: 2.0,
    ambientIntensity: 0.2,
  },
  {
    id: 'red_giant',
    label: 'Red Giant',
    modelPath: '/3d_models/RedGiant/',
    description: 'Hydrogen exhausted — the outer layers expand enormously.',
    durationYears: 1_000_000_000,
    cameraDistance: 9,
    lightColor: 0xff3300,
    lightIntensity: 1.5,
    ambientIntensity: 0.25,
  },
  {
    id: 'white_dwarf',
    label: 'White Dwarf',
    modelPath: '/3d_models/WhiteDwarf/',
    description: 'The stellar remnant slowly cools over trillions of years.',
    durationYears: 1_000_000_000_000,
    cameraDistance: 4,
    lightColor: 0xaaddff,
    lightIntensity: 0.8,
    ambientIntensity: 0.5,
  },
];

// ─────────────────────────────────────────────
//  Helper — find the first .gltf inside a folder
//  (We simply try common filenames; adjust if yours differ)
// ─────────────────────────────────────────────
function resolveGLTFUrl(folderPath) {
  // Try <FolderName>.gltf, scene.gltf, model.gltf
  const folder = folderPath.replace(/\/$/, '');
  const name   = folder.split('/').pop();
  // Return an array of candidates; loader will try in order
  return [`${folder}/${name}.gltf`, `${folder}/scene.gltf`, `${folder}/model.gltf`];
}

// ─────────────────────────────────────────────
//  StellarPath class
// ─────────────────────────────────────────────
export class StellarPath {
  /**
   * @param {THREE.Scene}    scene
   * @param {THREE.Camera}   camera
   * @param {THREE.Renderer} renderer
   */
  constructor(scene, camera, renderer) {
    this.scene    = scene;
    this.camera   = camera;
    this.renderer = renderer;

    this.loader       = new GLTFLoader();
    this.currentIndex = 0;
    this.currentModel = null;
    this.pointLight   = null;
    this.ambientLight = null;
    this.isAnimating  = false;

    this._cache = [];
    this._background = null;
    this._setupLights();
  }

  // ── Lights ──────────────────────────────────
  _setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    this.pointLight.position.set(5, 5, 5);
    this.scene.add(this.pointLight);
  }

  // ── Background: load public/scene.gltf ──────
  loadBackground() {
    return new Promise((resolve) => {
      this.loader.load(
        '/scene.gltf',
        (gltf) => {
          const bg = gltf.scene;
          // Push it far back so it doesn't occlude star models
          bg.position.set(0, 0, -30);
          // Scale up if needed so it fills the view
          bg.scale.setScalar(10);
          this.scene.add(bg);
          this._background = bg;
          resolve();
        },
        undefined,
        (err) => {
          console.warn('Could not load background scene.gltf:', err);
          // Fallback: simple star particles
          this._setupParticlesFallback();
          resolve();
        }
      );
    });
  }

  _setupParticlesFallback() {
    const geometry  = new THREE.BufferGeometry();
    const count     = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 200;
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, sizeAttenuation: true });
    this.scene.add(new THREE.Points(geometry, material));
  }

  // ── Preload ALL stage models ──────────────────
  /**
   * Loads all STAGES in parallel and caches them.
   * Call this once at startup; resolves when every model is ready.
   * @returns {Promise}
   */
  preloadAll(onEachLoaded) {
    this._cache = new Array(STAGES.length).fill(null);

    const promises = STAGES.map((stage, i) =>
      this._loadOneStage(i).then((model) => {
        // Prepare model but keep it hidden + off-scene
        this._prepareModel(model, stage);
        this._cache[i] = model;
        if (onEachLoaded) onEachLoaded(i, STAGES.length);
      })
    );

    return Promise.all(promises);
  }

  // ── Load a single stage (internal) ───────────
  _loadOneStage(index) {
    return new Promise((resolve) => {
      const stage      = STAGES[index];
      const candidates = resolveGLTFUrl(stage.modelPath);
      let   tried      = 0;

      const tryNext = () => {
        if (tried >= candidates.length) {
          console.warn(`Could not load GLTF for ${stage.label}. Using fallback.`);
          resolve(this._fallbackMesh(stage));
          return;
        }
        const url = candidates[tried++];
        this.loader.load(url, (gltf) => resolve(gltf.scene), undefined, () => tryNext());
      };
      tryNext();
    });
  }

  // ── Centre + scale a model (done once at preload) ─
  _prepareModel(model, stage) {
    const box    = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    model.position.sub(centre);
    const size = box.getSize(new THREE.Vector3()).length();
    if (size > 0) model.scale.setScalar(3 / size);
    this._setOpacity(model, 0); // invisible until needed
  }

  // ── Procedural fallback sphere ───────────────
  _fallbackMesh(stage) {
    const colors = {
      nebula:       0x8844cc,
      protostar:    0xff6622,
      main_sequence:0xffffaa,
      red_giant:    0xff2200,
      white_dwarf:  0xaaccff,
    };
    const color = colors[stage.id] || 0xffffff;
    const geo   = new THREE.SphereGeometry(1.5, 64, 64);
    const mat   = new THREE.MeshStandardMaterial({
      color,
      emissive:          color,
      emissiveIntensity: 0.4,
      roughness:         0.6,
      metalness:         0.1,
    });
    return new THREE.Mesh(geo, mat);
  }

  // ── Instant transition using preloaded cache ──
  async transitionTo(index, onProgress) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const stage      = STAGES[index];
    const nextModel  = this._cache[index];

    if (!nextModel) {
      console.error(`Model for stage ${index} not in cache — call preloadAll() first.`);
      this.isAnimating = false;
      return;
    }

    // Add next model to scene (still invisible)
    this._setOpacity(nextModel, 0);
    this.scene.add(nextModel);

    // Cross-fade: fade out old, fade in new simultaneously
    const outPromise = this.currentModel ? this._fadeOut(this.currentModel) : Promise.resolve();
    const inPromise  = this._fadeIn(nextModel);
    await Promise.all([outPromise, inPromise]);

    // Remove old model from scene (stays cached — do NOT dispose)
    if (this.currentModel && this.currentModel !== nextModel) {
      this.scene.remove(this.currentModel);
    }

    this.currentModel = nextModel;
    this.currentIndex = index;

    // Update lights
    this.pointLight.color.set(stage.lightColor);
    this.pointLight.intensity  = stage.lightIntensity;
    this.ambientLight.intensity = stage.ambientIntensity;

    // Move camera
    this._animateCamera(stage.cameraDistance);

    if (onProgress) onProgress('ready', stage);
    this.isAnimating = false;
  }

  // ── Navigation helpers ───────────────────────
  async next(onProgress) {
    const nextIndex = Math.min(this.currentIndex + 1, STAGES.length - 1);
    if (nextIndex === this.currentIndex && this.currentModel) return; // already at end
    await this.transitionTo(nextIndex, onProgress);
  }

  async prev(onProgress) {
    const prevIndex = Math.max(this.currentIndex - 1, 0);
    if (prevIndex === this.currentIndex && this.currentModel) return;
    await this.transitionTo(prevIndex, onProgress);
  }

  get isFirst() { return this.currentIndex === 0; }
  get isLast()  { return this.currentIndex === STAGES.length - 1; }

  // ── Animate ──────────────────────────────────
  tick(delta) {
    if (this.currentModel) {
      this.currentModel.rotation.y += delta * 0.3;
    }
  }

  // ── Camera smooth move ───────────────────────
  _animateCamera(targetZ) {
    const start    = this.camera.position.z;
    const end      = targetZ;
    const duration = 1200; // ms
    let   elapsed  = 0;
    let   last     = performance.now();

    const step = (now) => {
      elapsed += now - last;
      last     = now;
      const t  = Math.min(elapsed / duration, 1);
      const e  = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out
      this.camera.position.z = start + (end - start) * e;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ── Fade helpers ─────────────────────────────
  _fadeOut(obj) {
    return new Promise((resolve) => {
      const duration = 600;
      let   elapsed  = 0;
      let   last     = performance.now();

      const step = (now) => {
        elapsed += now - last;
        last     = now;
        const t  = Math.min(elapsed / duration, 1);
        this._setOpacity(obj, 1 - t);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  _fadeIn(obj) {
    return new Promise((resolve) => {
      const duration = 800;
      let   elapsed  = 0;
      let   last     = performance.now();

      const step = (now) => {
        elapsed += now - last;
        last     = now;
        const t  = Math.min(elapsed / duration, 1);
        this._setOpacity(obj, t);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  _setOpacity(obj, value) {
    obj.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          m.transparent = true;
          m.opacity     = value;
        });
      }
    });
  }

}
