import { CONFIG } from './state.js';
import { Particle } from './particles.js';
import { initControls } from './controls.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width, height;

let particles = [];
let controlsHandle = null;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    for (let p of particles) {
        p.width = width;
        p.height = height;
    }
}

window.addEventListener('resize', resize);
resize();

function createParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(width, height));
    }
}

function setParticleCount(n) {
    const current = particles.length;
    if (n > current) {
        for (let i = 0; i < (n - current); i++) particles.push(new Particle(width, height));
    } else if (n < current) {
        particles.length = n;
    }
}

function updateAll() {
    for (let p of particles) p.update(width, height);
}

function drawAll() {
    for (let p of particles) p.draw(ctx, width, height);
}

function getEffectiveScale() {
    return CONFIG.zoomOverride ? CONFIG.zoomScale : CONFIG.scale;
}

function screenToWorld(sx, sy) {
    const effectiveScale = getEffectiveScale();
    const wx = (sx - width / 2) / effectiveScale + CONFIG.offsetX;
    const wy = (height / 2 - sy) / effectiveScale + CONFIG.offsetY;
    return { x: wx, y: wy };
}

function worldToScreen(wx, wy) {
    const effectiveScale = getEffectiveScale();
    const sx = width / 2 + (wx - CONFIG.offsetX) * effectiveScale;
    const sy = height / 2 - (wy - CONFIG.offsetY) * effectiveScale;
    return { x: sx, y: sy };
}

function computeParticlesBounds() {
    if (!particles || particles.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of particles) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, maxX, minY, maxY };
}

function fitViewToParticles() {
    const bounds = computeParticlesBounds();
    if (!bounds) {
        CONFIG.scale = CONFIG.defaultScale;
        CONFIG.offsetX = 0;
        CONFIG.offsetY = 0;
        return;
    }
    const marginFactor = 1.2;
    const worldW = Math.max(0.0001, bounds.maxX - bounds.minX);
    const worldH = Math.max(0.0001, bounds.maxY - bounds.minY);
    const scaleX = width / (worldW * marginFactor);
    const scaleY = height / (worldH * marginFactor);
    let newScale = Math.min(scaleX, scaleY);
    newScale = Math.max(CONFIG.minScale, Math.min(CONFIG.maxScale, newScale));
    CONFIG.scale = newScale;
    CONFIG.offsetX = (bounds.minX + bounds.maxX) / 2;
    CONFIG.offsetY = (bounds.minY + bounds.maxY) / 2;
    for (let p of particles) p.reset();
}

let selecting = false;
let selStart = null;
let selCurrent = null;

canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    selecting = true;
    selStart = { x: e.offsetX, y: e.offsetY };
    selCurrent = { ...selStart };
});

canvas.addEventListener('mousemove', (e) => {
    if (!selecting) return;
    selCurrent = { x: e.offsetX, y: e.offsetY };
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button !== 0) return;
    if (!selecting) return;
    selecting = false;

    
    const x1 = Math.min(selStart.x, selCurrent.x);
    const x2 = Math.max(selStart.x, selCurrent.x);
    const y1 = Math.min(selStart.y, selCurrent.y);
    const y2 = Math.max(selStart.y, selCurrent.y);

    const widthPx = x2 - x1;
    const heightPx = y2 - y1;
    const minSize = 6;
    if (widthPx < minSize || heightPx < minSize) {
        return;
    }

    const cx = x1 + widthPx / 2;
    const cy = y1 + heightPx / 2;
    const centerWorld = screenToWorld(cx, cy);

    const currentScale = getEffectiveScale();
    const newScaleX = currentScale * (width / widthPx);
    const newScaleY = currentScale * (height / heightPx);
    let newScale = Math.min(newScaleX, newScaleY);
    newScale = Math.max(CONFIG.minScale, Math.min(CONFIG.maxScale, newScale));

    CONFIG.zoomOverride = true;
    CONFIG.zoomScale = newScale;
    CONFIG.offsetX = centerWorld.x;
    CONFIG.offsetY = centerWorld.y;
    console.log('Zoom applied:', { zoomOverride: CONFIG.zoomOverride, zoomScale: CONFIG.zoomScale, offsetX: CONFIG.offsetX, offsetY: CONFIG.offsetY });
});

canvas.addEventListener('dblclick', (e) => {
    CONFIG.zoomOverride = false;
    CONFIG.scale = CONFIG.sliderScale;
    CONFIG.offsetX = 0;
    CONFIG.offsetY = 0;
});

function drawSelectionOverlay() {
    if (!selecting || !selStart || !selCurrent) return;
    const x = Math.min(selStart.x, selCurrent.x);
    const y = Math.min(selStart.y, selCurrent.y);
    const w = Math.abs(selCurrent.x - selStart.x);
    const h = Math.abs(selCurrent.y - selStart.y);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}

function animate() {
    ctx.fillStyle = `rgba(18, 18, 18, ${CONFIG.trailOpacity})`;
    ctx.fillRect(0, 0, width, height);

    if (!CONFIG.paused) updateAll();
    drawAll();
    drawSelectionOverlay();

    requestAnimationFrame(animate);
}

createParticles(CONFIG.particleCount);

const container = document.getElementById('controls-content');
const controlsPanel = document.getElementById('controls');
const toggleBtn = document.getElementById('toggle-menu');

toggleBtn.addEventListener('click', () => {
    controlsPanel.classList.toggle('hidden');
    toggleBtn.textContent = controlsPanel.classList.contains('hidden') ? '▶' : '◀';
});

controlsHandle = initControls(container, {
    onConfigChange: () => { controlsHandle?.updateFooter(CONFIG.mu, CONFIG.particleCount, getEffectiveScale()); },
    onParticlesChange: (n) => { setParticleCount(n); controlsHandle?.updateFooter(CONFIG.mu, CONFIG.particleCount, getEffectiveScale()); },
    onPauseToggle: (paused) => { },
    onReset: () => { for (let p of particles) p.reset(); },
    onResetView: () => {
        CONFIG.zoomOverride = false;
        CONFIG.scale = CONFIG.sliderScale;
        CONFIG.offsetX = 0;
        CONFIG.offsetY = 0;
    }
});

controlsHandle.updateFooter(CONFIG.mu, CONFIG.particleCount, getEffectiveScale());

ctx.fillStyle = 'rgb(18, 18, 18)';
ctx.fillRect(0, 0, width, height);

animate();
