import { CONFIG } from './state.js';

function getEffectiveScale() {
    const scale = CONFIG.zoomOverride ? CONFIG.zoomScale : CONFIG.scale;
    return scale;
}

export function getVector(x, y) {
    const dx = y;
    let dy = CONFIG.mu * (1 - x * x) * y - x;
    
    if (CONFIG.oscillatorMode === 'forced') {
        dy += CONFIG.forceAmplitude * Math.sin(CONFIG.forceOmega * CONFIG.time);
    }
    
    return { x: dx, y: dy };
}

export class Particle {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.reset(true);
    }

    reset(first = false) {
        const scale = getEffectiveScale();
        const viewWorldWidth = (this.width / scale);
        const viewWorldHeight = (this.height / scale);
        this.x = CONFIG.offsetX + (Math.random() - 0.5) * viewWorldWidth;
        this.y = CONFIG.offsetY + (Math.random() - 0.5) * viewWorldHeight;
        this.life = Math.random() * 200 + 50;
        this.age = 0;
        this.history = first ? [] : [];
    }

    update(width, height) {
        this.width = width;
        this.height = height;

        const v = getVector(this.x, this.y);
        this.x += v.x * (0.01 * CONFIG.particleSpeed);
        this.y += v.y * (0.01 * CONFIG.particleSpeed);
        
        if (CONFIG.oscillatorMode === 'forced') {
            CONFIG.time += 0.01 * CONFIG.particleSpeed;
        }

        this.age++;
        if (this.age > this.life) {
            this.reset();
            return;
        }

        const scale = getEffectiveScale();
        const halfWidthNorm = (this.width / scale) / 2;
        const halfHeightNorm = (this.height / scale) / 2;
        const marginFactor = 1.2;
        const boundX = halfWidthNorm * marginFactor;
        const boundY = halfHeightNorm * marginFactor;

        const minX = CONFIG.offsetX - boundX;
        const maxX = CONFIG.offsetX + boundX;
        const minY = CONFIG.offsetY - boundY;
        const maxY = CONFIG.offsetY + boundY;
        if (this.x < minX || this.x > maxX || this.y < minY || this.y > maxY) {
            this.reset();
        }
    }

    draw(ctx, width, height) {
        const scale = getEffectiveScale();
        const screenX = width / 2 + (this.x - CONFIG.offsetX) * scale;
        const screenY = height / 2 - (this.y - CONFIG.offsetY) * scale;

        const v = getVector(this.x, this.y);
        const speed = Math.sqrt(v.x * v.x + v.y * v.y);

        ctx.beginPath();
        ctx.arc(screenX, screenY, 1.2, 0, Math.PI * 2);

        if (CONFIG.colorSpeed) {
            const hue = Math.max(0, 240 - (speed * 40));
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        }
        ctx.fill();
    }
}
