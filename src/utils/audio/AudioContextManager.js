/**
 * AudioContextManager — Singleton Web Audio context with dry/wet buses
 * and a synthetic 3.0s exponential-decay algorithmic reverb.
 * Zero dependencies. No external IR files.
 *
 * CRITICAL (WebKit / iOS Safari): the AudioContext is NEVER created at module
 * load or page evaluation. It is created lazily, strictly inside an explicit
 * top-level user gesture (pointerdown / touchstart) via `getAudioContext()` /
 * `unlockAudioContext()`, and `.resume()` is awaited on every call to bypass
 * browser autoplay silence policies. All voices route through a single master
 * GainNode connected to `destination`.
 */

let _ctx = null;
let _masterGain = null;
let _dryGain = null;
let _wetGain = null;
let _convolver = null;
let _unlocked = false;
let _initPromise = null;

/**
 * Generate a synthetic impulse response with exponential decay.
 * @param {AudioContext} ctx
 * @param {number} duration - Seconds
 * @param {number} decay - Decay rate exponent
 * @returns {AudioBuffer}
 */
function generateImpulseResponse(ctx, duration = 3.0, decay = 4.5) {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Exponential decay envelope with early reflections
      const envelope = Math.exp(-decay * t);
      // Early reflection spikes in the first 80ms
      const earlyReflection = i < sampleRate * 0.08
        ? (Math.random() * 2 - 1) * 0.5 * Math.exp(-20 * t)
        : 0;
      // Diffuse tail
      const diffuse = (Math.random() * 2 - 1) * envelope * 0.3;
      data[i] = earlyReflection + diffuse;
    }
  }
  return buffer;
}

/**
 * Lazily build the audio graph (context + master + dry/wet buses + convolver).
 * Safe to call multiple times; returns a promise that resolves once created.
 * Only ever invoked from within a user-gesture callback.
 * @returns {Promise<AudioContext>}
 */
function ensureContext() {
  if (_ctx) return Promise.resolve(_ctx);
  if (!_initPromise) {
    _initPromise = (async () => {
      const Ctor = window.AudioContext || window['webkitAudioContext'];
      const ctx = new Ctor();
      _ctx = ctx;

      // Dedicated master GainNode -> destination. WebKit-safe single connection
      // point so autoplay/silence policies are applied to one node.
      _masterGain = ctx.createGain();
      _masterGain.gain.value = 1.0;
      _masterGain.connect(ctx.destination);

      // Dry bus (direct signal) -> master
      _dryGain = ctx.createGain();
      _dryGain.gain.value = 0.75;
      _dryGain.connect(_masterGain);

      // Wet bus (reverb send) -> convolver -> master
      _wetGain = ctx.createGain();
      _wetGain.gain.value = 0.35;
      _convolver = ctx.createConvolver();
      _convolver.buffer = generateImpulseResponse(ctx, 3.0, 4.5);
      _wetGain.connect(_convolver);
      _convolver.connect(_masterGain);
    })().catch((err) => {
      // Reset so a later gesture can retry.
      _initPromise = null;
      throw err;
    });
  }
  return _initPromise;
}

/**
 * Get (creating if needed) the shared AudioContext and resume it.
 * MUST be called inside an explicit user-gesture callback (pointerdown /
 * touchstart). Awaiting this guarantees a running context.
 * @returns {Promise<AudioContext>}
 */
export async function getAudioContext() {
  await ensureContext();
  const ctx = _ctx;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_) {
      /* resume can fail if we are no longer inside a valid gesture */
    }
  }
  _unlocked = true;
  return ctx;
}

/**
 * Gesture entry point — initializes (if needed) and resumes the context.
 * Fire-and-forget friendly; called on every initial pointerdown/touchstart.
 * @returns {Promise<AudioContext>}
 */
export function unlockAudioContext() {
  return getAudioContext();
}

/** Synchronously get the shared AudioContext if it has already been created. */
export function getCurrentContext() {
  return _ctx;
}

/** Get the dry (direct) gain bus node. */
export function getDryBus() {
  return _dryGain;
}

/** Get the wet (reverb send) gain bus node. */
export function getWetBus() {
  return _wetGain;
}

/** Check if audio is unlocked and ready. */
export function isAudioUnlocked() {
  return _unlocked && _ctx !== null && _ctx.state === 'running';
}

/**
 * Set the reverb wet/dry mix.
 * @param {number} wetAmount - 0.0 (dry) to 1.0 (fully wet)
 */
export function setReverbMix(wetAmount) {
  if (!_dryGain || !_wetGain) return;
  const clamped = Math.max(0, Math.min(1, wetAmount));
  _wetGain.gain.setTargetAtTime(clamped * 0.5, _ctx.currentTime, 0.05);
  _dryGain.gain.setTargetAtTime(1.0 - clamped * 0.25, _ctx.currentTime, 0.05);
}

/** Suspend audio when page is hidden. */
export function suspendAudio() {
  if (_ctx && _ctx.state === 'running') {
    _ctx.suspend();
  }
}

/** Resume audio when page is visible again. */
export function resumeAudio() {
  if (_ctx && _ctx.state === 'suspended') {
    _ctx.resume();
  }
}

/**
 * Test hook — resets the singleton so tests can assert deferred initialization
 * and run in isolation. No-op in production.
 */
export function __resetAudioForTests() {
  _ctx = null;
  _masterGain = null;
  _dryGain = null;
  _wetGain = null;
  _convolver = null;
  _unlocked = false;
  _initPromise = null;
}
