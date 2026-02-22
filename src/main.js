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
const pageHome    = document.getElementById('page-home');
const pageMass    = document.getElementById('page-mass');
const pageSim     = document.getElementById('page-sim');
const playBtn     = document.getElementById('play-btn');
const stageLabel  = document.getElementById('stage-label');
const stageDesc   = document.getElementById('stage-desc');
const yearsEl     = document.getElementById('years');
const loadingEl   = document.getElementById('loading-overlay');
const loadStatus  = document.getElementById('load-status');
const massInput   = document.getElementById('mass-input');
const beginBtn    = document.getElementById('begin-btn');
const massError   = document.getElementById('mass-error');

// Slider elements
const evoSlider     = document.getElementById('evo-slider');
const sliderLabels  = document.getElementById('slider-labels');

// ─────────────────────────────────────────────
//  Slider — build for a given path
// ─────────────────────────────────────────────
function buildSlider(path) {
  const count = path.length;

  // Set slider range to match stage count
  evoSlider.min   = 0;
  evoSlider.max   = count - 1;
  evoSlider.step  = 1;
  evoSlider.value = 0;

  // Build labels
  sliderLabels.innerHTML = '';
  path.forEach((stage) => {
    const span = document.createElement('span');
    span.classList.add('slider-label');
    span.textContent = stage.label;
    // Click on label → jump to that stage
    span.addEventListener('click', () => {
      const idx = path.indexOf(stage);
      evoSlider.value = idx;
      onSliderChange(idx);
    });
    sliderLabels.appendChild(span);
  });

  updateSliderUI(0, count);
}

// Update track fill + label highlights
function updateSliderUI(index, total) {
  const pct = total > 1 ? (index / (total - 1)) * 100 : 0;
  evoSlider.style.setProperty('--fill', `${pct}%`);

  document.querySelectorAll('.slider-label').forEach((el, i) => {
    el.classList.toggle('active',  i === index);
    el.classList.toggle('visited', i < index);
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
  updateSliderUI(stellarPath.currentIndex, stellarPath.activeStages.length);
}

// ─────────────────────────────────────────────
//  Slider change handler
// ─────────────────────────────────────────────
function onSliderChange(index) {
  if (stellarPath.isAnimating) {
    // Snap slider back if mid-animation
    evoSlider.value = stellarPath.currentIndex;
    return;
  }
  if (index === stellarPath.currentIndex) return;
  stellarPath.transitionTo(index, onProgress);
}

evoSlider.addEventListener('input', () => {
  onSliderChange(parseInt(evoSlider.value));
});

// Keyboard: left/right arrows still work
window.addEventListener('keydown', (e) => {
  if (!pageSim.classList.contains('active')) return;
  if (stellarPath.isAnimating) return;

  const cur = stellarPath.currentIndex;
  const max = stellarPath.activeStages.length - 1;

  if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && cur < max) {
    evoSlider.value = cur + 1;
    onSliderChange(cur + 1);
  }
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && cur > 0) {
    evoSlider.value = cur - 1;
    onSliderChange(cur - 1);
  }
});

// ─────────────────────────────────────────────
//  Transition callback
// ─────────────────────────────────────────────
function onProgress(_status, stage) {
  updateUI(stage);
  // Keep slider thumb in sync if transition was triggered by keyboard
  evoSlider.value = stellarPath.currentIndex;
  loadingEl.classList.add('hidden');
}

// ─────────────────────────────────────────────
//  Preload
// ─────────────────────────────────────────────
const TOTAL_ASSETS = 8; // 7 unique models + 1 background
let   loadedCount  = 0;

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
stellarPath.preloadAll(() => onOneLoaded());

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

// Mass → Sim
beginBtn.addEventListener('click', () => {
  if (beginBtn.disabled) return;

  const mass = parseFloat(massInput.value);
  stellarPath.selectPath(mass);

  // Build slider for the chosen path
  buildSlider(stellarPath.activeStages);

  pageMass.classList.remove('active');
  pageSim.classList.add('active');

  stellarPath.transitionTo(0, onProgress);
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
