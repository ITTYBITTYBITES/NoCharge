/**
 * SoundEngine — Web Component wrapping the Singing Bowl canvas engine.
 * Provides toolbar controls and embed code generation.
 */

import { SoundCanvas } from './SoundCanvas.js';
import { generateEmbedCode } from '../../utils/StateSerializer.js';

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

  .toolbar button {
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
  }

  .toolbar button:hover {
    background: var(--panel, #1c1c1c);
    border-color: var(--accent, #0f9d58);
  }

  .toolbar button:active {
    transform: scale(0.97);
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
    <span class="bowl-count" aria-live="polite">0 bowls</span>
  </div>
  <div class="canvas-wrap">
    <canvas aria-label="Singing bowl canvas — tap to place bowls, tap a bowl to strike it"></canvas>
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
  }

  connectedCallback() {
    const canvas = this.shadowRoot.querySelector('canvas');
    const wrap = this.shadowRoot.querySelector('.canvas-wrap');
    const countEl = this.shadowRoot.querySelector('.bowl-count');
    const embedOutput = this.shadowRoot.querySelector('.embed-output');

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
    });

    // Hydrate from hash if present
    const { readStateFromHash } = require_serializer();
    if (window.location.hash) {
      const states = readStateFromHash(this._soundCanvas.logicalWidth, this._soundCanvas.logicalHeight);
      if (states.length > 0) {
        this._soundCanvas.hydrate(states);
        countEl.textContent = `${states.length} bowl${states.length !== 1 ? 's' : ''}`;
      }
    }

    // Toolbar actions
    this.shadowRoot.querySelector('[data-action="clear"]').addEventListener('click', () => {
      this._soundCanvas.clear();
      countEl.textContent = '0 bowls';
      embedOutput.classList.remove('visible');
    });

    this.shadowRoot.querySelector('[data-action="embed"]').addEventListener('click', () => {
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
  }

  disconnectedCallback() {
    if (this._soundCanvas) {
      this._soundCanvas.destroy();
      this._soundCanvas = null;
    }
  }
}

/**
 * Lazy import to avoid circular issues in some bundlers.
 * In practice this just re-exports the serializer.
 */
function require_serializer() {
  // Inline minimal decode for hydration to avoid async import complexity
  return {
    readStateFromHash(canvasWidth, canvasHeight) {
      const hash = window.location.hash;
      if (!hash) return [];
      try {
        const cleaned = hash.replace(/^#/, '');
        let base64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) base64 += '=';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const view = new DataView(bytes.buffer);
        const count = Math.floor(bytes.length / 8);
        const bowls = [];
        for (let i = 0; i < count; i++) {
          const off = i * 8;
          if (off + 8 > bytes.length) break;
          const nx = view.getUint16(off, false);
          const ny = view.getUint16(off + 2, false);
          const fn = view.getUint16(off + 4, false);
          const pb = view.getUint16(off + 6, false);
          bowls.push({
            x: (nx / 65535) * canvasWidth,
            y: (ny / 65535) * canvasHeight,
            freq: Math.round(100 + (fn / 65535) * 780),
            profile: pb === 1 ? 'quartz' : 'bronze',
          });
        }
        return bowls;
      } catch {
        return [];
      }
    },
  };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Register the custom element
if (!customElements.get('singing-bowl-engine')) {
  customElements.define('singing-bowl-engine', SingingBowlEngine);
}

export { SingingBowlEngine };
