/**
 * AudioContextManager — Singleton Web Audio context with dry/wet buses
 * and a synthetic 3.0s exponential-decay algorithmic reverb.
 * Zero dependencies. No external IR files.
 */

let _ctx = null;
let _dryGain = null;
let _wetGain = null;
let _convolver = null;
let _unlocked = false;

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
 * Initialize and unlock the audio context via a user gesture.
 * Safe to call multiple times; returns the singleton.
 */
export function unlockAudioContext() {
  if (_ctx && _unlocked) return _ctx;

  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Dry bus (direct signal)
    _dryGain = _ctx.createGain();
    _dryGain.gain.value = 0.75;
    _dryGain.connect(_ctx.destination);

    // Wet bus (reverb send)
    _wetGain = _ctx.createGain();
    _wetGain.gain.value = 0.35;

    // Convolver with synthetic IR
    _convolver = _ctx.createConvolver();
    _convolver.buffer = generateImpulseResponse(_ctx, 3.0, 4.5);
    _wetGain.connect(_convolver);
    _convolver.connect(_ctx.destination);
  }

  if (_ctx.state === 'suspended') {
    _ctx.resume();
  }

  _unlocked = true;
  return _ctx;
}

/** Get the shared AudioContext (must call unlockAudioContext first). */
export function getAudioContext() {
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
