'use strict';

/* ════════════════════════════════════════════════════════════
   1. CANVAS SCALING ENGINE
   ════════════════════════════════════════════════════════════ */
const CANVAS_W = 1600;
const CANVAS_H = 900;
const canvasEl = document.getElementById('canvas');

function scaleCanvas() {
  const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
  const offX = Math.round((window.innerWidth - CANVAS_W * scale) / 2);
  const offY = Math.round((window.innerHeight - CANVAS_H * scale) / 2);
  
  canvasEl.style.transform = `scale(${scale})`;
  canvasEl.style.left = offX + 'px';
  canvasEl.style.top = offY + 'px';
}

window.addEventListener('resize', scaleCanvas);
scaleCanvas();

/* ════════════════════════════════════════════════════════════
   2. STATE MANAGEMENT
   ════════════════════════════════════════════════════════════ */
let slides = [];
let current = 0;
let curStep = 0;
let isTransitioning = false;

// Transition timing matches style.css
const LEAVE_MS = { fade: 350, wipe: 380, none: 0 };

/* ════════════════════════════════════════════════════════════
   3. SLIDE LOADER (SPA ARCHITECTURE)
   ════════════════════════════════════════════════════════════ */
async function loadSlides() {
  const deck = window.SLIDE_DECK || [];
  
  // Show a simple loading state if needed
  canvasEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; margin-top:400px; font-family:var(--font-sans);">Loading Presentation...</div>';

  const loadedSlides = [];

  // Fetch all slides sequentially to maintain exact order
  for (let i = 0; i < deck.length; i++) {
    try {
      const response = await fetch(deck[i]);
      if (!response.ok) throw new Error(`Failed to load ${deck[i]}`);
      
      const htmlText = await response.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlText;

      // Extract all .slide elements from the fetched file
      const slideEls = tempDiv.querySelectorAll('.slide');
      slideEls.forEach(slideEl => loadedSlides.push(slideEl));

    } catch (err) {
      console.error(err);
    }
  }

  // Clear loading state and inject actual slides
  canvasEl.innerHTML = '';
  slides = loadedSlides;

  slides.forEach((slideEl, index) => {
    canvasEl.appendChild(slideEl);
    
    // Execute standard <script> tags securely (innerHTML doesn't run them)
    executeScripts(slideEl);
  });

  // Boot the first slide
  if (slides.length > 0) {
    initSteps(slides[0]);
    slides[0].classList.add('active');
    startThreeInSlide(slides[0]);
    updateHUD();
  }
}

function executeScripts(container) {
  const scripts = container.querySelectorAll('script:not([type="text/x-threejs"])');
  scripts.forEach(oldScript => {
    const newScript = document.createElement('script');
    // Copy all attributes
    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
    // Copy content
    newScript.textContent = oldScript.textContent;
    // Replace old with new to force browser execution. 
    // This allows document.currentScript to work natively in the slides!
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

/* ════════════════════════════════════════════════════════════
   4. STEP ENGINE
   ════════════════════════════════════════════════════════════ */
function propagateSteps(slideEl) {
  function walk(node, inherited) {
    if (node.nodeType !== 1) return;
    const hasOwn = node.hasAttribute('data-step');
    const eff = hasOwn ? parseInt(node.getAttribute('data-step')) : inherited;
    if (!hasOwn && inherited !== null) node.setAttribute('data-step', inherited);
    Array.from(node.children).forEach(c => walk(c, eff));
  }
  Array.from(slideEl.children).forEach(child => {
    const s = child.hasAttribute('data-step') ? parseInt(child.getAttribute('data-step')) : null;
    Array.from(child.children).forEach(c => walk(c, s));
  });
}

function maxStepOf(slideEl) {
  let max = 0;
  slideEl.querySelectorAll('[data-step]').forEach(el => {
    max = Math.max(max, parseInt(el.getAttribute('data-step')));
  });
  return max;
}

function applySteps(slideEl, upTo) {
  slideEl.querySelectorAll('[data-step]').forEach(el => {
    const s = parseInt(el.getAttribute('data-step'));
    el.classList.toggle('step-visible', s <= upTo);
  });
}

function initSteps(slideEl) {
  propagateSteps(slideEl);
  applySteps(slideEl, 0);
}

/* ════════════════════════════════════════════════════════════
   5. THREE.JS & CANVAS MEMORY MANAGER
   ════════════════════════════════════════════════════════════ */
const threeInstances = {}; // Tracks running animations by ID

function startThreeInSlide(slideEl) {
  slideEl.querySelectorAll('.animation-container').forEach(container => {
    // Generate stable ID if missing
    if (!container.id) container.id = 'tj-' + Math.random().toString(36).slice(2);
    const id = container.id;

    // If it already exists, just resume the RAF loop (don't re-instantiate)
    if (threeInstances[id]) {
      const inst = threeInstances[id];
      if (!inst.animId) {
        const tick = t => {
          inst.animId = requestAnimationFrame(tick);
          inst.animate(t);
          inst.renderer.render(inst.scene, inst.camera);
        };
        inst.animId = requestAnimationFrame(tick);
      }
      return;
    }

    const scriptTag = container.querySelector('script[type="text/x-threejs"]');
    if (!scriptTag) return;

    // Wait one frame to ensure container dimensions are painted
    requestAnimationFrame(() => {
      const W = container.clientWidth || 700;
      const H = container.clientHeight || 200;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000);
      camera.position.z = 4.5;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      let userMod = {};
      try {
        // Securely evaluate the slide's custom Three.js script
        userMod = new Function(
          'THREE', 'scene', 'camera', 'renderer', 'container', 'WIDTH', 'HEIGHT',
          scriptTag.textContent
        )(THREE, scene, camera, renderer, container, W, H) || {};
      } catch (err) { 
        console.error('[Three.js Engine] Script error:', err); 
      }

      const inst = {
        scene, camera, renderer, animId: null,
        animate: userMod.animate || (() => {}),
        dispose: userMod.dispose || (() => {})
      };
      
      threeInstances[id] = inst;

      const tick = t => {
        inst.animId = requestAnimationFrame(tick);
        inst.animate(t);
        inst.renderer.render(inst.scene, inst.camera);
      };
      inst.animId = requestAnimationFrame(tick);
    });
  });
}

function stopThreeInSlide(slideEl) {
  slideEl.querySelectorAll('.animation-container').forEach(container => {
    const inst = threeInstances[container.id];
    // Cancel the RAF to free up CPU/GPU when slide is invisible
    if (inst && inst.animId) { 
      cancelAnimationFrame(inst.animId); 
      inst.animId = null; 
    }
  });
}

/* ════════════════════════════════════════════════════════════
   6. NAVIGATION & TRANSITION ENGINE
   ════════════════════════════════════════════════════════════ */
function updateHUD() {
  const max = maxStepOf(slides[current]);
  document.getElementById('slide-input').value = current + 1;
  document.getElementById('slide-total').textContent = ` / ${slides.length}`;
  document.getElementById('step-counter').textContent = max > 0 ? `${curStep}/${max}` : '';
  document.getElementById('progress').style.width = ((current + 1) / slides.length * 100) + '%';
}

function goTo(n, dir) {
  if (isTransitioning || slides.length === 0) return;
  isTransitioning = true;

  const leaving = slides[current];
  const tr = leaving.getAttribute('data-transition') || 'none';
  const leaveMs = LEAVE_MS[tr] || 0;

  stopThreeInSlide(leaving);

  // Animate out
  if (tr !== 'none') {
    leaving.classList.add(dir === 'prev' ? 'slide-leave-prev' : 'slide-leave');
  }

  setTimeout(() => {
    leaving.classList.remove('active', 'slide-leave', 'slide-leave-prev');

    current = ((n % slides.length) + slides.length) % slides.length;
    curStep = 0;
    
    const entering = slides[current];
    const trIn = entering.getAttribute('data-transition') || 'none';

    initSteps(entering);
    entering.classList.add('active');
    
    if (trIn !== 'none') {
      entering.classList.add(dir === 'prev' ? 'slide-enter-prev' : 'slide-enter');
      setTimeout(() => {
        entering.classList.remove('slide-enter', 'slide-enter-prev');
        isTransitioning = false;
      }, 500);
    } else {
      isTransitioning = false;
    }

    startThreeInSlide(entering);
    updateHUD();
  }, leaveMs);
}

function next() {
  if (isTransitioning || slides.length === 0) return;
  const currentSlide = slides[current];

  // Hook for complex custom slides (like Backprop/Analogy) to handle their own steps
  if (currentSlide.customNext && currentSlide.customNext()) return;

  const max = maxStepOf(currentSlide);
  if (curStep < max) { 
    curStep++; 
    applySteps(currentSlide, curStep); 
    updateHUD(); 
  } else {
    goTo(current + 1, 'next');
  }
}

function prev() {
  if (isTransitioning || slides.length === 0) return;
  const currentSlide = slides[current];

  // Hook for complex custom slides
  if (currentSlide.customPrev && currentSlide.customPrev()) return;

  if (curStep > 0) { 
    curStep--; 
    applySteps(currentSlide, curStep); 
    updateHUD(); 
  } else {
    goTo(current - 1, 'prev');
  }
}

/* ════════════════════════════════════════════════════════════
   7. EVENT LISTENERS
   ════════════════════════════════════════════════════════════ */
// UI Buttons
document.getElementById('btn-next').addEventListener('click', next);
document.getElementById('btn-prev').addEventListener('click', prev);

// Slide Input Navigation
const slideInput = document.getElementById('slide-input');
slideInput.addEventListener('change', (e) => {
  let val = parseInt(e.target.value, 10);
  if (isNaN(val)) {
    val = current + 1;
    e.target.value = val;
    return;
  }
  if (val < 1) val = 1;
  if (val > slides.length) val = slides.length;
  e.target.value = val;
  
  const targetIndex = val - 1;
  if (targetIndex !== current) {
    const dir = targetIndex > current ? 'next' : 'prev';
    goTo(targetIndex, dir);
  }
});
slideInput.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    slideInput.blur();
  }
});

// Keyboard
document.addEventListener('keydown', e => {
  if (['ArrowRight', 'ArrowDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
  if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); prev(); }
  if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  if (e.key === 'Escape' && document.fullscreenElement) exitFullscreen();
});

// Touch / Swipe
let touchX = 0;
document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
}, { passive: true });

/* ════════════════════════════════════════════════════════════
   8. FULLSCREEN API
   ════════════════════════════════════════════════════════════ */
function enterFullscreen() { document.documentElement.requestFullscreen().catch(() => {}); }
function exitFullscreen() { if (document.fullscreenElement) document.exitFullscreen(); }
function toggleFullscreen() { document.fullscreenElement ? exitFullscreen() : enterFullscreen(); }

document.getElementById('fullscreen-btn').addEventListener('click', enterFullscreen);
document.getElementById('exit-fs-btn').addEventListener('click', exitFullscreen);

document.addEventListener('fullscreenchange', () => {
  const fs = !!document.fullscreenElement;
  document.getElementById('fullscreen-btn').style.display = fs ? 'none' : '';
  document.getElementById('exit-fs-btn').style.display = fs ? '' : 'none';
  scaleCanvas();
});

/* ════════════════════════════════════════════════════════════
   9. INITIALIZATION
   ════════════════════════════════════════════════════════════ */
// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', loadSlides);