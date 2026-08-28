/**
 * SoundCanvas — Canvas rendering engine and gesture handler for singing bowls.
 * High-DPI, 60 FPS loop, PointerEvents, haptic feedback, harmonic connection lines.
 */

import { unlockAudioContext, isAudioUnlocked, suspendAudio, resumeAudio } from '../../utils/audio/AudioContextManager.js';
import { strikeBowl } from '../../utils/audio/BowlSynthesizer.js';
import { pushStateToHash } from '../../utils/StateSerializer.js';

const MIN_FREQ = 100;
const MAX_FREQ = 880;
const SPAWN_MIN_FREQ = 220;
const SPAWN_MAX_FREQ = 520;
const BOWL_RADIUS = 28;
const HIT_RADIUS = 40;

/** Perfect 5th and Octave ratio tolerances */
const PERFECT_FIFTH = 1.5;
const OCTAVE = 2.0;
const RATIO_TOLERANCE = 0.04;

/**
 * @typedef {{ id: number, x: number, y: number, freq: number, profile: 'bronze'|'quartz', ripple: number, rippleAlpha: number }} Bowl
 */

export class SoundCanvas {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ onStateChange?: () => void }} [options]
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    /** @type {Bowl[]} */
    this.bowls = [];
    this._nextId = 1;
    this._animId = null;
    this._running = false;
    this._dragging = null; // { bowlId, offsetX, offsetY }
    this._pointerDown = null; // { x, y, time, bowlId | null }

    this._resizeObserver = null;
    this._visibilityHandler = null;
    this._hashHandler = null;

    this._setupHiDPI();
    this._bindEvents();
    this._startLoop();
  }

  _setupHiDPI() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.logicalWidth = rect.width;
    this.logicalHeight = rect.height;
  }

  _bindEvents() {
    this.canvas.style.touchAction = 'none';
    this.canvas.style.userSelect = 'none';

    this.canvas.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this._onPointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this._onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this._onPointerUp(e));
    this.canvas.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

    this._visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this._stopLoop();
        suspendAudio();
      } else {
        resumeAudio();
        this._startLoop();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    this._resizeObserver = new ResizeObserver(() => {
      this._setupHiDPI();
    });
    this._resizeObserver.observe(this.canvas);
  }

  /** Get canvas-relative coordinates from a pointer event. */
  _getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  /** Find the bowl under a point, or null. */
  _hitTest(x, y) {
    for (let i = this.bowls.length - 1; i >= 0; i--) {
      const b = this.bowls[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) return b;
    }
    return null;
  }

  _onPointerDown(e) {
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    unlockAudioContext();

    const pos = this._getPos(e);
    const hit = this._hitTest(pos.x, pos.y);

    this._pointerDown = {
      x: pos.x,
      y: pos.y,
      time: performance.now(),
      bowlId: hit ? hit.id : null,
    };

    if (hit) {
      this._dragging = {
        bowlId: hit.id,
        offsetX: pos.x - hit.x,
        offsetY: pos.y - hit.y,
        moved: false,
      };
    }

    // Haptic feedback on touch
    if (navigator.vibrate && e.pointerType === 'touch') {
      navigator.vibrate(8);
    }
  }

  _onPointerMove(e) {
    if (!this._dragging) return;
    e.preventDefault();

    const pos = this._getPos(e);
    const bowl = this.bowls.find((b) => b.id === this._dragging.bowlId);
    if (!bowl) return;

    // Only start dragging after a threshold
    const dx = pos.x - this._pointerDown.x;
    const dy = pos.y - this._pointerDown.y;
    if (dx * dx + dy * dy > 25) {
      this._dragging.moved = true;
    }

    if (this._dragging.moved) {
      bowl.x = Math.max(BOWL_RADIUS, Math.min(this.logicalWidth - BOWL_RADIUS, pos.x - this._dragging.offsetX));
      bowl.y = Math.max(BOWL_RADIUS, Math.min(this.logicalHeight - BOWL_RADIUS, pos.y - this._dragging.offsetY));
    }
  }

  _onPointerUp(e) {
    const pos = this._getPos(e);

    if (this._dragging && !this._dragging.moved) {
      // It was a tap on an existing bowl — strike it
      const bowl = this.bowls.find((b) => b.id === this._dragging.bowlId);
      if (bowl) {
        this._strikeBowl(bowl);
      }
    } else if (!this._dragging && this._pointerDown) {
      // Tap on empty space — spawn a new bowl
      const elapsed = performance.now() - this._pointerDown.time;
      const dx = pos.x - this._pointerDown.x;
      const dy = pos.y - this._pointerDown.y;
      if (elapsed < 400 && dx * dx + dy * dy < 100) {
        this._spawnBowl(pos.x, pos.y);
      }
    }

    if (this._dragging?.moved) {
      this._notifyStateChange();
    }

    this._dragging = null;
    this._pointerDown = null;

    try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) { /* ok */ }
  }

  _onWheel(e) {
    e.preventDefault();
    const pos = this._getPos(e);
    const bowl = this._hitTest(pos.x, pos.y);
    if (!bowl) return;

    const delta = -Math.sign(e.deltaY) * 10;
    bowl.freq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, bowl.freq + delta));
    this._strikeBowl(bowl);
    this._notifyStateChange();
  }

  _spawnBowl(x, y) {
    const freq = Math.round(SPAWN_MIN_FREQ + Math.random() * (SPAWN_MAX_FREQ - SPAWN_MIN_FREQ));
    const profile = Math.random() > 0.5 ? 'quartz' : 'bronze';
    const bowl = {
      id: this._nextId++,
      x: Math.max(BOWL_RADIUS, Math.min(this.logicalWidth - BOWL_RADIUS, x)),
      y: Math.max(BOWL_RADIUS, Math.min(this.logicalHeight - BOWL_RADIUS, y)),
      freq,
      profile,
      ripple: 0,
      rippleAlpha: 0,
    };
    this.bowls.push(bowl);
    this._strikeBowl(bowl);
    this._notifyStateChange();
  }

  _strikeBowl(bowl) {
    if (!isAudioUnlocked()) return;
    strikeBowl(bowl.freq, bowl.profile, 0.8);
    bowl.ripple = BOWL_RADIUS;
    bowl.rippleAlpha = 0.7;
  }

  _notifyStateChange() {
    pushStateToHash(
      this.bowls.map((b) => ({ x: b.x, y: b.y, freq: b.freq, profile: b.profile })),
      this.logicalWidth,
      this.logicalHeight,
    );
    if (this.options.onStateChange) {
      this.options.onStateChange();
    }
  }

  /**
   * Check if two frequencies form a harmonic interval (Perfect 5th or Octave).
   */
  _checkHarmonic(f1, f2) {
    if (f1 === 0 || f2 === 0) return null;
    const ratio = Math.max(f1, f2) / Math.min(f1, f2);

    if (Math.abs(ratio - PERFECT_FIFTH) < RATIO_TOLERANCE) return 'fifth';
    if (Math.abs(ratio - OCTAVE) < RATIO_TOLERANCE) return 'octave';
    // Check higher octaves too
    if (Math.abs(ratio - 3.0) < RATIO_TOLERANCE) return 'octave';
    if (Math.abs(ratio - 4.0) < RATIO_TOLERANCE) return 'octave';

    return null;
  }

  _startLoop() {
    if (this._running) return;
    this._running = true;
    const frame = () => {
      if (!this._running) return;
      this._update();
      this._draw();
      this._animId = requestAnimationFrame(frame);
    };
    this._animId = requestAnimationFrame(frame);
  }

  _stopLoop() {
    this._running = false;
    if (this._animId !== null) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  }

  _update() {
    const dt = 1 / 60;
    for (const bowl of this.bowls) {
      if (bowl.rippleAlpha > 0) {
        bowl.ripple += 80 * dt;
        bowl.rippleAlpha -= 1.2 * dt;
        if (bowl.rippleAlpha < 0) bowl.rippleAlpha = 0;
      }
    }
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.logicalWidth;
    const h = this.logicalHeight;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = gridSize; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = gridSize; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw harmonic connection lines
    for (let i = 0; i < this.bowls.length; i++) {
      for (let j = i + 1; j < this.bowls.length; j++) {
        const a = this.bowls[i];
        const b = this.bowls[j];
        const interval = this._checkHarmonic(a.freq, b.freq);
        if (interval) {
          ctx.save();
          ctx.setLineDash(interval === 'octave' ? [8, 4] : [4, 8]);
          ctx.strokeStyle = interval === 'octave'
            ? 'rgba(15, 157, 88, 0.35)'
            : 'rgba(100, 180, 255, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Draw bowls
    for (const bowl of this.bowls) {
      const isBronze = bowl.profile === 'bronze';
      const baseColor = isBronze ? '#c9a84c' : '#88c8e8';
      const glowColor = isBronze ? 'rgba(201, 168, 76, 0.3)' : 'rgba(136, 200, 232, 0.3)';

      // Ripple effect
      if (bowl.rippleAlpha > 0) {
        ctx.beginPath();
        ctx.arc(bowl.x, bowl.y, bowl.ripple, 0, Math.PI * 2);
        ctx.strokeStyle = isBronze
          ? `rgba(201, 168, 76, ${bowl.rippleAlpha * 0.6})`
          : `rgba(136, 200, 232, ${bowl.rippleAlpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Outer glow
      ctx.beginPath();
      ctx.arc(bowl.x, bowl.y, BOWL_RADIUS + 4, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();

      // Bowl body
      ctx.beginPath();
      ctx.arc(bowl.x, bowl.y, BOWL_RADIUS, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        bowl.x - 6, bowl.y - 6, 2,
        bowl.x, bowl.y, BOWL_RADIUS,
      );
      grad.addColorStop(0, isBronze ? '#e8d48b' : '#b8e0f4');
      grad.addColorStop(0.6, baseColor);
      grad.addColorStop(1, isBronze ? '#7a6228' : '#4a8aaa');
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner ring
      ctx.beginPath();
      ctx.arc(bowl.x, bowl.y, BOWL_RADIUS * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = isBronze ? 'rgba(255,230,150,0.4)' : 'rgba(200,235,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Frequency label
      ctx.fillStyle = '#fff';
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${bowl.freq}`, bowl.x, bowl.y - 3);

      // Profile label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '500 7px Inter, system-ui, sans-serif';
      ctx.fillText(isBronze ? 'BZ' : 'QZ', bowl.x, bowl.y + 8);
    }

    // Instructions overlay when empty
    if (this.bowls.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '500 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Tap anywhere to place a singing bowl', w / 2, h / 2 - 10);
      ctx.font = '400 11px Inter, system-ui, sans-serif';
      ctx.fillText('Tap a bowl to strike · Drag to move · Scroll to tune', w / 2, h / 2 + 12);
    }
  }

  /**
   * Hydrate bowls from an array of state objects.
   * @param {Array<{x: number, y: number, freq: number, profile: string}>} states
   */
  hydrate(states) {
    this.bowls = states.map((s) => ({
      id: this._nextId++,
      x: s.x,
      y: s.y,
      freq: s.freq,
      profile: s.profile === 'quartz' ? 'quartz' : 'bronze',
      ripple: 0,
      rippleAlpha: 0,
    }));
  }

  /**
   * Get current bowl states for serialization.
   */
  getStates() {
    return this.bowls.map((b) => ({
      x: b.x,
      y: b.y,
      freq: b.freq,
      profile: b.profile,
    }));
  }

  /** Clear all bowls. */
  clear() {
    this.bowls = [];
    this._notifyStateChange();
  }

  /** Destroy the canvas engine and clean up. */
  destroy() {
    this._stopLoop();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  }
}
