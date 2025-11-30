import { CONFIG } from './state.js';

function createRangeRow(id, labelText, min, max, step, initial, onChange) {
    const row = document.createElement('div');
    row.className = 'control-row';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;

    const range = document.createElement('input');
    range.type = 'range';
    range.id = id;
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = initial;

    const value = document.createElement('div');
    value.className = 'value';
    value.textContent = initial;

    range.addEventListener('input', (e) => {
        value.textContent = e.target.value;
        onChange(Number(e.target.value));
    });

    row.appendChild(label);
    row.appendChild(range);
    row.appendChild(value);

    return row;
}

export function initControls(containerEl, callbacks = {}) {
    containerEl.innerHTML = '';

    const h = document.createElement('h1');
    h.textContent = 'Van der Pol Flow';
    containerEl.appendChild(h);

    const muRow = createRangeRow('mu', 'μ', 0, 5, 0.01, CONFIG.mu, (v) => { CONFIG.mu = v; callbacks.onConfigChange?.(); });
    containerEl.appendChild(muRow);

    const particlesRow = createRangeRow('particles', 'Particles', 100, 10000, 50, CONFIG.particleCount, (v) => { CONSTsafe(); CONFIG.particleCount = v; callbacks.onParticlesChange?.(v); });
    containerEl.appendChild(particlesRow);

    const particleSpeedRow = createRangeRow('pspeed', 'Speed', 0.1, 4, 0.1, CONFIG.particleSpeed, (v) => { CONFIG.particleSpeed = v; callbacks.onConfigChange?.(); });
    containerEl.appendChild(particleSpeedRow);

    const scaleRow = createRangeRow('scale', 'Scale', CONFIG.minScale, CONFIG.maxScale, 10, CONFIG.scale, (v) => { CONFIG.scale = v; callbacks.onConfigChange?.(); });
    containerEl.appendChild(scaleRow);

    const trailRow = createRangeRow('trail', 'Trail', 0, 0.18, 0.001, CONFIG.trailOpacity, (v) => { CONFIG.trailOpacity = v; callbacks.onConfigChange?.(); });
    containerEl.appendChild(trailRow);

    const colorRow = document.createElement('div');
    colorRow.className = 'control-row';
    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Color';
    const colorToggle = document.createElement('input');
    colorToggle.type = 'checkbox';
    colorToggle.checked = CONFIG.colorSpeed;
    const colorValue = document.createElement('div');
    colorValue.className = 'value';
    colorValue.textContent = CONFIG.colorSpeed ? 'On' : 'Off';

    colorToggle.addEventListener('change', () => { CONFIG.colorSpeed = colorToggle.checked; colorValue.textContent = colorToggle.checked ? 'On' : 'Off'; callbacks.onConfigChange?.(); });

    colorRow.appendChild(colorLabel);
    colorRow.appendChild(colorToggle);
    colorRow.appendChild(colorValue);
    containerEl.appendChild(colorRow);

    const lockRow = document.createElement('div');
    lockRow.style.marginTop = '8px';

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = CONFIG.paused ? 'Resume' : 'Pause';
    pauseBtn.addEventListener('click', () => {
        CONFIG.paused = !CONFIG.paused;
        pauseBtn.textContent = CONFIG.paused ? 'Resume' : 'Pause';
        callbacks.onPauseToggle?.(CONFIG.paused);
    });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.style.marginLeft = '8px';
    resetBtn.addEventListener('click', () => {
        callbacks.onReset?.();
    });

    const resetViewBtn = document.createElement('button');
    resetViewBtn.textContent = 'Reset View';
    resetViewBtn.style.marginLeft = '8px';
    resetViewBtn.addEventListener('click', () => {
        callbacks.onResetView?.();
    });

    lockRow.appendChild(pauseBtn);
    lockRow.appendChild(resetBtn);
    lockRow.appendChild(resetViewBtn);

    containerEl.appendChild(lockRow);

    const footer = document.createElement('div');
    footer.id = 'footer';
    const footerMu = document.createElement('div');
    footerMu.textContent = `μ = ${CONFIG.mu} (Damping)`;
    const footerParticle = document.createElement('div');
    footerParticle.textContent = `Particles: ${CONFIG.particleCount}`;
    const footerScale = document.createElement('div');
    footerScale.textContent = `Scale: ${CONFIG.scale}`;
    footer.appendChild(footerMu);
    footer.appendChild(footerParticle);
    footer.appendChild(footerScale);

    return { updateFooter: (muVal, particleVal, scaleVal) => { footerMu.textContent = `μ = ${muVal} (Damping)`; footerParticle.textContent = `Particles: ${particleVal}`; footerScale.textContent = `Scale: ${Math.round(scaleVal)}`; } };
}

function CONSTsafe() {
}
