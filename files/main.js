import * as THREE from 'three';
import { StellarPath, STAGES } from './stellarPath.js';

// ─────────────────────────────────────────────
//  Scene / Camera / Renderer
// ─────────────────────────────────────────────
const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x02020f);

const camera   = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ─────────────────────────────────────────────
//  Stellar evolution path
// ─────────────────────────────────────────────
const stellarPath = new StellarPath(scene, camera, renderer);

// ─────────────────────────────────────────────
//  UI element references
// ─────────────────────────────────────────────
const pageHome     = document.getElementById('page-home');
const pageSim      = document.getElementById('page-sim');
const playBtn      = document.getElementById('play-btn');
const stageLabel   = document.getElementById('stage-label');
const stageDesc    = document.getElementById('stage-desc');
const yearsEl      = document.getElementById('years');
const prevBtn      = document.getElementById('prev-btn');
const nextBtn      = document.getElementById('next-btn');
const progressDots = document.getElementById('progress-dots');
const loadingEl    = document.getElementById('loading-overlay');
const loadStatus   = document.getElementById('load-status');   // text below spinner on home page

// ─────────────────────────────────────────────
//  Progress dots (sim page)
// ─────────────────────────────────────────────
STAGES.forEach((_, i) => {
  const dot = document.createElement('div');
  dot.classList.add('dot');
  if (i === 0) dot.classList.add('active');
  progressDots.appendChild(dot);
});

function updateDots(index) {
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active',  i === index);
    d.classList.toggle('visited', i < index);
  });
}

// ─────────────────────────────────────────────
//  UI helpers
// ─────────────────────────────────────────────
function formatYears(n) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(0)} trillion yrs`;
  if (n >= 1e9)  return `${(n / 1e9).toFixed(0)} billion yrs`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(0)} million yrs`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(0)} thousand yrs`;
  return `${n} yrs`;
}

function updateUI(stage) {
  stageLabel.textContent = stage.label;
  stageDesc.textContent  = stage.description;
  yearsEl.textContent    = `~${formatYears(stage.durationYears)}`;
  prevBtn.disabled       = stellarPath.isFirst;
  nextBtn.disabled       = stellarPath.isLast;
  updateDots(stellarPath.currentIndex);
}

// ─────────────────────────────────────────────
//  Preload everything at startup
// ─────────────────────────────────────────────
let loaded = 0;
const total = STAGES.length + 1; // +1 for background

function onOneLoaded() {
  loaded++;
  const pct = Math.round((loaded / total) * 100);
  if (loadStatus) loadStatus.textContent = `Loading assets… ${pct}%`;
  if (loaded >= total) {
    // All done — unlock Play button
    playBtn.disabled = false;
    playBtn.style.opacity = '1';
    if (loadStatus) loadStatus.textContent = 'Ready';
  }
}

// Disable play until ready
playBtn.disabled = true;
playBtn.style.opacity = '0.4';
if (loadStatus) loadStatus.textContent = 'Loading assets… 0%';

// Start background load
stellarPath.loadBackground().then(onOneLoaded);

// Start model preload (all 5 in parallel)
stellarPath.preloadAll((_i, _total) => onOneLoaded());

// ─────────────────────────────────────────────
//  Stage transition
// ─────────────────────────────────────────────
function onProgress(_status, stage) {
  updateUI(stage);
  loadingEl.classList.add('hidden');
}

async function goToStage(dir) {
  if (dir === 'next') await stellarPath.next(onProgress);
  else                await stellarPath.prev(onProgress);
}

// ─────────────────────────────────────────────
//  Button wiring
// ─────────────────────────────────────────────
playBtn.addEventListener('click', async () => {
  if (playBtn.disabled) return;
  pageHome.classList.remove('active');
  pageSim.classList.add('active');
  // Show first stage immediately (no loading — already cached)
  await stellarPath.transitionTo(0, onProgress);
});

nextBtn.addEventListener('click', () => goToStage('next'));
prevBtn.addEventListener('click', () => goToStage('prev'));

window.addEventListener('keydown', (e) => {
  if (!pageSim.classList.contains('active')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToStage('next');
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goToStage('prev');
});

// ─────────────────────────────────────────────
//  Render loop
// ─────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  stellarPath.tick(delta);
  renderer.render(scene, camera);
}
animate();
