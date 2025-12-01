import { CONFIG } from './state.js';

let muSweepInterval = null;
let muSweepDirection = 1;

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

    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    const standardTab = document.createElement('button');
    standardTab.className = 'tab-btn active';
    standardTab.textContent = 'Standard VdP';
    standardTab.dataset.mode = 'standard';
    
    const forcedTab = document.createElement('button');
    forcedTab.className = 'tab-btn';
    forcedTab.textContent = 'Forced VdP';
    forcedTab.dataset.mode = 'forced';
    
    tabContainer.appendChild(standardTab);
    tabContainer.appendChild(forcedTab);
    containerEl.appendChild(tabContainer);

    const h = document.createElement('h1');
    h.textContent = 'Van der Pol Flow';
    containerEl.appendChild(h);

    const muRow = createRangeRow('mu', 'μ', 0, 5, 0.01, CONFIG.mu, (v) => { CONFIG.mu = v; callbacks.onConfigChange?.(); });
    containerEl.appendChild(muRow);

    const particlesRow = createRangeRow('particles', 'Particles', 100, 10000, 50, CONFIG.particleCount, (v) => { CONSTsafe(); CONFIG.particleCount = v; callbacks.onParticlesChange?.(v); });
    containerEl.appendChild(particlesRow);

    const particleSpeedRow = createRangeRow('pspeed', 'Speed', 0.1, 4, 0.1, CONFIG.particleSpeed, (v) => { CONFIG.particleSpeed = v; callbacks.onConfigChange?.(); });
    containerEl.appendChild(particleSpeedRow);

    const forceAmplitudeRow = createRangeRow('forceAmplitude', 'Amplitude (A)', 0, 5, 0.1, CONFIG.forceAmplitude, (v) => { CONFIG.forceAmplitude = v; callbacks.onConfigChange?.(); });
    forceAmplitudeRow.className = 'control-row forced-param';
    forceAmplitudeRow.style.display = 'none';
    containerEl.appendChild(forceAmplitudeRow);

    const forceOmegaRow = createRangeRow('forceOmega', 'Omega (ω)', 0.1, 10, 0.1, CONFIG.forceOmega, (v) => { CONFIG.forceOmega = v; callbacks.onConfigChange?.(); });
    forceOmegaRow.className = 'control-row forced-param';
    forceOmegaRow.style.display = 'none';
    containerEl.appendChild(forceOmegaRow);

    const scaleRow = createRangeRow('scale', 'Scale', CONFIG.minScale, CONFIG.maxScale, 10, CONFIG.scale, (v) => { 
        CONFIG.scale = v; 
        CONFIG.sliderScale = v; 
        CONFIG.zoomOverride = false;
        callbacks.onConfigChange?.(); 
    });
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

    const advancedContainer = document.createElement('div');
    advancedContainer.className = 'advanced-container';

    const advancedHeader = document.createElement('button');
    advancedHeader.className = 'advanced-toggle';
    advancedHeader.innerHTML = '<span class="toggle-icon">▶</span> μ Sweep Animation';
    
    const advancedPanel = document.createElement('div');
    advancedPanel.className = 'advanced-panel';
    advancedPanel.style.display = 'none';

    advancedHeader.addEventListener('click', () => {
        const isHidden = advancedPanel.style.display === 'none';
        advancedPanel.style.display = isHidden ? 'block' : 'none';
        advancedHeader.querySelector('.toggle-icon').textContent = isHidden ? '▼' : '▶';
    });

    const muBottomRow = document.createElement('div');
    muBottomRow.className = 'control-row';
    const muBottomLabel = document.createElement('label');
    muBottomLabel.textContent = 'μ Bottom';
    const muBottomInput = document.createElement('input');
    muBottomInput.type = 'number';
    muBottomInput.className = 'num-input';
    muBottomInput.value = 0;
    muBottomInput.min = 0;
    muBottomInput.max = 5;
    muBottomInput.step = 0.1;
    muBottomRow.appendChild(muBottomLabel);
    muBottomRow.appendChild(muBottomInput);
    advancedPanel.appendChild(muBottomRow);

    const muTopRow = document.createElement('div');
    muTopRow.className = 'control-row';
    const muTopLabel = document.createElement('label');
    muTopLabel.textContent = 'μ Top';
    const muTopInput = document.createElement('input');
    muTopInput.type = 'number';
    muTopInput.className = 'num-input';
    muTopInput.value = 5;
    muTopInput.min = 0;
    muTopInput.max = 5;
    muTopInput.step = 0.1;
    muTopRow.appendChild(muTopLabel);
    muTopRow.appendChild(muTopInput);
    advancedPanel.appendChild(muTopRow);

    const stepRow = document.createElement('div');
    stepRow.className = 'control-row';
    const stepLabel = document.createElement('label');
    stepLabel.textContent = 'Step';
    const stepInput = document.createElement('input');
    stepInput.type = 'number';
    stepInput.className = 'num-input';
    stepInput.value = 0.05;
    stepInput.min = 0.01;
    stepInput.max = 1;
    stepInput.step = 0.01;
    stepRow.appendChild(stepLabel);
    stepRow.appendChild(stepInput);
    advancedPanel.appendChild(stepRow);

    const intervalRow = document.createElement('div');
    intervalRow.className = 'control-row';
    const intervalLabel = document.createElement('label');
    intervalLabel.textContent = 'Interval (ms)';
    const intervalInput = document.createElement('input');
    intervalInput.type = 'number';
    intervalInput.className = 'num-input';
    intervalInput.value = 100;
    intervalInput.min = 10;
    intervalInput.max = 2000;
    intervalInput.step = 10;
    intervalRow.appendChild(intervalLabel);
    intervalRow.appendChild(intervalInput);
    advancedPanel.appendChild(intervalRow);

    const sweepBtnRow = document.createElement('div');
    sweepBtnRow.className = 'sweep-btn-row';

    const startSweepBtn = document.createElement('button');
    startSweepBtn.textContent = 'Start Sweep';
    startSweepBtn.className = 'sweep-btn';

    const stopSweepBtn = document.createElement('button');
    stopSweepBtn.textContent = 'Stop';
    stopSweepBtn.className = 'sweep-btn';
    stopSweepBtn.disabled = true;

    const muSlider = document.getElementById('mu');
    const muValueDisplay = muRow.querySelector('.value');

    startSweepBtn.addEventListener('click', () => {
        const muBottom = parseFloat(muBottomInput.value);
        const muTop = parseFloat(muTopInput.value);
        const step = parseFloat(stepInput.value);
        const interval = parseInt(intervalInput.value);

        if (muBottom >= muTop) {
            alert('μ Bottom must be less than μ Top');
            return;
        }

        if (muSweepInterval) clearInterval(muSweepInterval);
        
        muSweepDirection = 1;
        startSweepBtn.disabled = true;
        stopSweepBtn.disabled = false;

        muSweepInterval = setInterval(() => {
            let newMu = CONFIG.mu + (step * muSweepDirection);
            
            if (newMu >= muTop) {
                newMu = muTop;
                muSweepDirection = -1;
            } else if (newMu <= muBottom) {
                newMu = muBottom;
                muSweepDirection = 1;
            }

            CONFIG.mu = Math.round(newMu * 100) / 100;
            muSlider.value = CONFIG.mu;
            muValueDisplay.textContent = CONFIG.mu;
            callbacks.onConfigChange?.();
        }, interval);
    });

    stopSweepBtn.addEventListener('click', () => {
        if (muSweepInterval) {
            clearInterval(muSweepInterval);
            muSweepInterval = null;
        }
        startSweepBtn.disabled = false;
        stopSweepBtn.disabled = true;
    });

    sweepBtnRow.appendChild(startSweepBtn);
    sweepBtnRow.appendChild(stopSweepBtn);
    advancedPanel.appendChild(sweepBtnRow);

    advancedContainer.appendChild(advancedHeader);
    advancedContainer.appendChild(advancedPanel);
    containerEl.appendChild(advancedContainer);

    const switchMode = (mode) => {
        CONFIG.oscillatorMode = mode;
        CONFIG.time = 0;
        
        standardTab.classList.toggle('active', mode === 'standard');
        forcedTab.classList.toggle('active', mode === 'forced');
        
        const forcedParams = containerEl.querySelectorAll('.forced-param');
        forcedParams.forEach(param => {
            param.style.display = mode === 'forced' ? 'flex' : 'none';
        });
        
        callbacks.onReset?.();
        callbacks.onConfigChange?.();
    };
    
    standardTab.addEventListener('click', () => switchMode('standard'));
    forcedTab.addEventListener('click', () => switchMode('forced'));

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
