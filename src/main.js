import * as THREE from 'three';
import { StellarPath, PATH1, PATH2 } from './stellarPath.js';

// ─────────────────────────────────────────────
//  Scene / Camera / Renderer
// ─────────────────────────────────────────────
const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x02020f);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
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
//  StellarPath instance
// ─────────────────────────────────────────────
const stellarPath = new StellarPath(scene, camera, renderer);

// ─────────────────────────────────────────────
//  UI references
// ─────────────────────────────────────────────
const pageHome     = document.getElementById('page-home');
const pageMass     = document.getElementById('page-mass');
const pageSim      = document.getElementById('page-sim');
const playBtn      = document.getElementById('play-btn');
const stageLabel   = document.getElementById('stage-label');
const stageDesc    = document.getElementById('stage-desc');
const yearsEl      = document.getElementById('years');
const prevBtn      = document.getElementById('prev-btn');
const nextBtn      = document.getElementById('next-btn');
const progressDots = document.getElementById('progress-dots');
const loadingEl    = document.getElementById('loading-overlay');
const loadStatus   = document.getElementById('load-status');
const massInput    = document.getElementById('mass-input');
const beginBtn     = document.getElementById('begin-btn');
const massError    = document.getElementById('mass-error');

// ─────────────────────────────────────────────
//  Progress dots — rebuilt when path is chosen
// ─────────────────────────────────────────────
function buildDots(path) {
  progressDots.innerHTML = '';
  path.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    progressDots.appendChild(dot);
  });
}

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
//  Preload — total unique models across both paths
//  (Nebula + Protostar shared = 7 unique + 1 bg = 8)
// ─────────────────────────────────────────────
const UNIQUE_MODELS = 7;  // nebula, protostar, ms1, red_giant, white_dwarf, ms2, red_supergiant, supernova
const TOTAL_ASSETS  = UNIQUE_MODELS + 1; // +1 background
let   loadedCount   = 0;

playBtn.disabled = true;
playBtn.style.opacity = '0.4';
if (loadStatus) loadStatus.textContent = 'Loading assets… 0%';

function onOneLoaded() {
  loadedCount++;
  const pct = Math.round((loadedCount / TOTAL_ASSETS) * 100);
  if (loadStatus) loadStatus.textContent = `Loading assets… ${pct}%`;
  if (loadedCount >= TOTAL_ASSETS) {
    playBtn.disabled = false;
    playBtn.style.opacity = '1';
    if (loadStatus) loadStatus.textContent = 'Ready';
  }
}

stellarPath.loadBackground().then(onOneLoaded);
stellarPath.preloadAll((loaded, _total) => onOneLoaded());

// ─────────────────────────────────────────────
//  Transition callback
// ─────────────────────────────────────────────
function onProgress(_status, stage) {
  updateUI(stage);
  loadingEl.classList.add('hidden');
}

function goToStage(dir) {
  if (dir === 'next') stellarPath.next(onProgress);
  else                stellarPath.prev(onProgress);
}

// ─────────────────────────────────────────────
//  Mass input validation
// ─────────────────────────────────────────────
massInput.addEventListener('input', () => {
  const val = parseFloat(massInput.value);
  if (!massInput.value || isNaN(val)) {
    beginBtn.disabled = true;
    massError.textContent = '';
  } else if (val < 0.08) {
    beginBtn.disabled = true;
    massError.textContent = 'Minimum stellar mass is 0.08 M\u2609 (brown dwarf limit).';
  } else if (val > 150) {
    beginBtn.disabled = true;
    massError.textContent = 'Maximum stellar mass is 150 M\u2609 (Eddington limit).';
  } else {
    beginBtn.disabled = false;
    massError.textContent = '';
  }
});

// ─────────────────────────────────────────────
//  Page navigation
// ─────────────────────────────────────────────

// Home → Mass input
playBtn.addEventListener('click', () => {
  if (playBtn.disabled) return;
  pageHome.classList.remove('active');
  pageMass.classList.add('active');
  setTimeout(() => massInput.focus(), 50);
});

// Mass input → Sim
beginBtn.addEventListener('click', () => {
  if (beginBtn.disabled) return;

  const mass = parseFloat(massInput.value);

  // Select path based on mass
  stellarPath.selectPath(mass);

  // Rebuild dots for the chosen path
  buildDots(stellarPath.activeStages);

  pageMass.classList.remove('active');
  pageSim.classList.add('active');

  stellarPath.transitionTo(0, onProgress);
});

// Sim navigation
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
