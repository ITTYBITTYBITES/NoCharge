/**
 * SoundEngine — Web Component wrapping the Singing Bowl canvas engine.
 * Provides toolbar controls (Clear / Embed / Harmonic Presets), a
 * "Tap Anywhere to Start" unlock overlay, and a mobile tuning overlay.
 */

import { SoundCanvas } from './SoundCanvas.js';
import { generateEmbedCode, readStateFromHash } from '../../utils/StateSerializer.js';
import { getAudioContext, isAudioUnlocked } from '../../utils/audio/AudioContextManager.js';

/** Harmonic tuning presets (Hz). Selecting one clears + spawns pre-tuned bowls. */
const PRESETS = {
  pentatonic: [261.63, 293.66, 329.63, 392.0, 440.0],
  solfeggio: [396, 417, 528, 639, 741, 852],
  chakra: [256, 288, 320, 341.3, 384, 426.7, 480],
};

const TEMPLATE = `
<style>
  :host {
    display: block;
    contain: layout style;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    color: var(--text, #e0e0e0);
  }

  .engine-container {
    display: grid;
    gap: 0.75rem;
    max-width: 100%;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    padding: 0.5rem 0;
  }

  .toolbar button,
  .toolbar select {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.85rem;
    border-radius: 6px;
    border: 1px solid var(--line, rgba(255,255,255,0.08));
    background: var(--panel-2, #242424);
    color: var(--text, #e0e0e0);
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    min-height: 36px;
    font-family: inherit;
  }

  .toolbar button:hover,
  .toolbar select:hover {
    background: var(--panel, #1c1c1c);
    border-color: var(--accent, #0f9d58);
  }

  .toolbar button:active {
    transform: scale(0.97);
  }

  .toolbar select {
    color-scheme: dark;
  }

  .toolbar .bowl-count {
    font-size: 0.8rem;
    color: var(--muted, #9a9a9a);
    margin-left: auto;
  }

  .canvas-wrap {
    position: relative;
    border-radius: var(--radius, 12px);
    overflow: hidden;
    background: linear-gradient(135deg, #181818, #1a1a1a);
    border: 1px solid var(--line, rgba(255,255,255,0.08));
    box-shadow: var(--shadow, 0 18px 48px rgba(0,0,0,0.35));
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
  }

  /* Full-canvas unlock overlay — shown whenever audio is absent or suspended */
  .start-overlay {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1rem;
    background: rgba(12, 12, 14, 0.78);
    backdrop-filter: blur(3px);
    cursor: pointer;
    color: var(--text, #e0e0e0);
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    user-select: none;
  }

  .start-overlay[hidden] {
    display: none;
  }

  .start-overlay .tap-icon {
    font-size: 1.6rem;
    margin-bottom: 0.35rem;
  }

  /* Mobile tuning overlay above a selected bowl */
  .tune-overlay {
    position: absolute;
    z-index: 20;
    width: 232px;
    padding: 0.6rem 0.7rem 0.65rem;
    border-radius: 10px;
    background: rgba(28, 28, 30, 0.96);
    border: 1px solid var(--line, rgba(255,255,255,0.14));
    box-shadow: 0 10px 28px rgba(0,0,0,0.5);
    color: var(--text, #e0e0e0);
    pointer-events: auto;
  }

  .tune-overlay[hidden] {
    display: none;
  }

  .tune-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.45rem;
  }

  .tune-freq {
    font-weight: 600;
    font-size: 0.9rem;
  }

  .tune-close {
    border: none;
    background: transparent;
    color: var(--muted, #9a9a9a);
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0.2rem 0.35rem;
    border-radius: 4px;
  }

  .tune-close:hover {
    color: var(--text, #e0e0e0);
    background: rgba(255,255,255,0.08);
  }

  .tune-slider {
    width: 100%;
    margin: 0.25rem 0 0.5rem;
    accent-color: var(--accent, #0f9d58);
    touch-action: none;
  }

  .tune-steps {
    display: flex;
    gap: 0.4rem;
    justify-content: space-between;
  }

  .tune-steps button {
    flex: 1;
    padding: 0.35rem 0;
    border-radius: 6px;
    border: 1px solid var(--line, rgba(255,255,255,0.1));
    background: var(--panel, #1c1c1c);
    color: var(--text, #e0e0e0);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    min-height: 34px;
  }

  .tune-steps button:hover {
    border-color: var(--accent, #0f9d58);
  }

  .embed-output {
    display: none;
    margin-top: 0.5rem;
    padding: 0.6rem;
    border-radius: 6px;
    background: var(--panel-2, #242424);
    border: 1px solid var(--line, rgba(255,255,255,0.08));
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.75rem;
    color: var(--muted, #9a9a9a);
    word-break: break-all;
    line-height: 1.5;
    overflow-x: auto;
  }

  .embed-output.visible {
    display: block;
  }

  .embed-output .copy-btn {
    display: inline-block;
    margin-top: 0.4rem;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    border: 1px solid var(--line, rgba(255,255,255,0.08));
    background: var(--panel, #1c1c1c);
    color: var(--accent, #0f9d58);
    font-size: 0.72rem;
    cursor: pointer;
  }

  .embed-output .copy-btn:hover {
    background: var(--panel-2, #242424);
  }
</style>
<div class="engine-container">
  <div class="toolbar">
    <button data-action="clear" aria-label="Clear all bowls">Clear</button>
    <button data-action="embed" aria-label="Get embed code">Embed</button>
    <select class="preset-select" aria-label="Harmonic presets">
      <option value="">Harmonic Presets</option>
      <option value="pentatonic">Pentatonic Scale</option>
      <option value="solfeggio">Solfeggio Frequencies</option>
      <option value="chakra">Chakra Tones</option>
    </select>
    <span class="bowl-count" aria-live="polite">0 bowls</span>
  </div>
  <div class="canvas-wrap">
    <canvas aria-label="Singing bowl canvas — tap to place bowls, tap a bowl to strike it, drag to move, circle the rim to sing, long-press to tune"></canvas>
    <div class="tune-overlay" role="dialog" aria-label="Tune bowl frequency" hidden>
      <div class="tune-header">
        <span class="tune-freq">440 Hz</span>
        <button class="tune-close" aria-label="Close tuning controls">✕</button>
      </div>
      <input class="tune-slider" type="range" min="100" max="880" step="1" aria-label="Bowl frequency in hertz">
      <div class="tune-steps">
        <button data-step="-10" aria-label="Decrease frequency by 10 hertz">−10 Hz</button>
        <button data-step="10" aria-label="Increase frequency by 10 hertz">+10 Hz</button>
      </div>
    </div>
    <div class="start-overlay" role="button" tabindex="0" aria-label="Tap anywhere to start">
      <div><div class="tap-icon">🫕</div>Tap Anywhere to Start</div>
    </div>
  </div>
  <div class="embed-output" role="region" aria-label="Embed code"></div>
</div>
`;

class SingingBowlEngine extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = TEMPLATE;
    this._soundCanvas = null;
    this._tuneBowlId = null;
    this._overlayTimer = null;
  }

  connectedCallback() {
    const shadow = this.shadowRoot;
    const canvas = shadow.querySelector('canvas');
    const wrap = shadow.querySelector('.canvas-wrap');
    const countEl = shadow.querySelector('.bowl-count');
    const embedOutput = shadow.querySelector('.embed-output');
    const presetSelect = shadow.querySelector('.preset-select');
    const startOverlay = shadow.querySelector('.start-overlay');
    const tuneOverlay = shadow.querySelector('.tune-overlay');
    const tuneSlider = shadow.querySelector('.tune-slider');
    const tuneFreqEl = shadow.querySelector('.tune-freq');
    const tuneClose = shadow.querySelector('.tune-close');

    // Set canvas size from container
    const rect = wrap.getBoundingClientRect();
    const width = rect.width || 600;
    const height = Math.max(300, Math.min(500, width * 0.6));
    wrap.style.height = `${height}px`;

    this._soundCanvas = new SoundCanvas(canvas, {
      onStateChange: () => {
        const count = this._soundCanvas.bowls.length;
        countEl.textContent = `${count} bowl${count !== 1 ? 's' : ''}`;
        // Hide embed output when state changes
        embedOutput.classList.remove('visible');
      },
      onSelect: (bowl) => {
        if (!bowl) {
          this._closeTune();
          return;
        }
        this._openTune(bowl, wrap, tuneOverlay, tuneSlider, tuneFreqEl);
      },
    });

    // Hydrate from hash if present — visual only, no audio until first gesture.
    if (window.location.hash) {
      const states = readStateFromHash(this._soundCanvas.logicalWidth, this._soundCanvas.logicalHeight);
      if (states.length > 0) {
        this._soundCanvas.hydrate(states);
        countEl.textContent = `${states.length} bowl${states.length !== 1 ? 's' : ''}`;
      }
    }

    // ---- Start overlay: shown whenever audio is absent or suspended ----
    const refreshOverlay = () => {
      startOverlay.hidden = isAudioUnlocked();
    };
    const unlockAndDismiss = async () => {
      // Resume + initialize the audio graph inside this user gesture.
      await getAudioContext();
      refreshOverlay();
    };
    startOverlay.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      unlockAndDismiss();
    });
    startOverlay.addEventListener('touchstart', (e) => {
      e.preventDefault();
      unlockAndDismiss();
    });
    startOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        unlockAndDismiss();
      }
    });
    // Keep the overlay in sync with audio state (e.g. after tab suspend).
    refreshOverlay();
    this._overlayTimer = setInterval(refreshOverlay, 500);

    // ---- Toolbar actions ----
    shadow.querySelector('[data-action="clear"]').addEventListener('click', () => {
      this._closeTune();
      this._soundCanvas.clear();
      countEl.textContent = '0 bowls';
      embedOutput.classList.remove('visible');
    });

    shadow.querySelector('[data-action="embed"]').addEventListener('click', () => {
      const states = this._soundCanvas.getStates();
      const code = generateEmbedCode(
        states,
        this._soundCanvas.logicalWidth,
        this._soundCanvas.logicalHeight,
      );
      embedOutput.innerHTML = `
        <code>${escapeHtml(code)}</code>
        <br><button class="copy-btn">Copy to clipboard</button>
      `;
      embedOutput.classList.add('visible');

      embedOutput.querySelector('.copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
          embedOutput.querySelector('.copy-btn').textContent = 'Copied!';
          setTimeout(() => {
            embedOutput.querySelector('.copy-btn').textContent = 'Copy to clipboard';
          }, 1500);
        });
      });
    });

    // ---- Harmonic presets ----
    presetSelect.addEventListener('change', () => {
      const name = presetSelect.value;
      if (!name) return;
      const freqs = PRESETS[name];
      if (!freqs) return;
      this._closeTune();
      this._soundCanvas.loadPreset(freqs);
      countEl.textContent = `${freqs.length} bowls`;
      presetSelect.value = '';
    });

    // ---- Mobile tuning overlay ----
    const applyTune = () => {
      const f = Number(tuneSlider.value);
      tuneFreqEl.textContent = `${Math.round(f)} Hz`;
      if (this._tuneBowlId !== null) {
        this._soundCanvas.setBowlFreq(this._tuneBowlId, f);
      }
    };
    tuneSlider.addEventListener('input', applyTune);
    tuneSlider.addEventListener('change', applyTune);
    tuneClose.addEventListener('click', () => this._closeTune());
    shadow.querySelectorAll('.tune-steps button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.step);
        const next = Math.max(100, Math.min(880, Number(tuneSlider.value) + delta));
        tuneSlider.value = next;
        applyTune();
      });
    });
  }

  /** Open the mobile tuning overlay above a selected bowl. */
  _openTune(bowl, wrap, tuneOverlay, tuneSlider, tuneFreqEl) {
    this._tuneBowlId = bowl.id;
    tuneSlider.value = bowl.freq;
    tuneFreqEl.textContent = `${Math.round(bowl.freq)} Hz`;
    tuneOverlay.hidden = false;

    const wrapRect = wrap.getBoundingClientRect();
    const w = wrapRect.width || this._soundCanvas.logicalWidth;
    const h = wrapRect.height || this._soundCanvas.logicalHeight;
    const ow = tuneOverlay.offsetWidth || 232;
    const oh = tuneOverlay.offsetHeight || 130;

    // Center over the bowl horizontally, hover above it vertically; clamp to canvas.
    let left = bowl.x - ow / 2;
    let top = bowl.y - oh - 12;
    left = Math.max(4, Math.min(w - ow - 4, left));
    top = Math.max(4, Math.min(Math.max(4, h - oh - 4), top));
    tuneOverlay.style.left = `${left}px`;
    tuneOverlay.style.top = `${top}px`;
  }

  _closeTune() {
    this._tuneBowlId = null;
    const tuneOverlay = this.shadowRoot.querySelector('.tune-overlay');
    if (tuneOverlay) tuneOverlay.hidden = true;
  }

  disconnectedCallback() {
    if (this._overlayTimer !== null) {
      clearInterval(this._overlayTimer);
      this._overlayTimer = null;
    }
    if (this._soundCanvas) {
      this._soundCanvas.destroy();
      this._soundCanvas = null;
    }
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;');
}

// Register the custom element
if (!customElements.get('singing-bowl-engine')) {
  customElements.define('singing-bowl-engine', SingingBowlEngine);
}

export { SingingBowlEngine };
