/**
 * BowlSynthesizer — Additive synthesis voice for singing bowls.
 * Bronze and Quartz profiles with organic pitch drift, plus a sustained
 * rim-singing (friction drone) mode with dynamic gain and a BiquadFilter.
 * Zero dependencies.
 */

import { getCurrentContext, getDryBus, getWetBus } from './AudioContextManager.js';

/**
 * @typedef {'bronze' | 'quartz'} BowlProfile
 */

/** @type {Record<BowlProfile, { ratios: number[], types: OscillatorType[], decayRange: [number, number] }>} */
const PROFILES = {
  bronze: {
    ratios: [1.0, 2.76, 5.18, 8.22],
    types: ['sine', 'triangle', 'sine', 'sine'],
    decayRange: [1.2, 5.0],
  },
  quartz: {
    ratios: [1.0, 2.0, 3.01, 4.12],
    types: ['sine', 'sine', 'sine', 'sine'],
    decayRange: [2.0, 7.0],
  },
};

/**
 * Compute the decay duration based on frequency position within the bowl range.
 * Lower frequencies get longer decays (more resonant body).
 * @param {number} frequency
 * @param {[number, number]} decayRange
 * @returns {number}
 */
function computeDecay(frequency, decayRange) {
  const minFreq = 100;
  const maxFreq = 880;
  const normalized = 1 - ((frequency - minFreq) / (maxFreq - minFreq));
  const clamped = Math.max(0, Math.min(1, normalized));
  return decayRange[0] + clamped * (decayRange[1] - decayRange[0]);
}

/**
 * Strike a singing bowl voice at the given frequency.
 * @param {number} frequency - Fundamental frequency in Hz (100–880)
 * @param {BowlProfile} profile - 'bronze' or 'quartz'
 * @param {number} [velocity=1.0] - Strike intensity 0–1
 * @returns {{ stop: () => void }} Handle to stop early
 */
export function strikeBowl(frequency, profile = 'bronze', velocity = 1.0) {
  const ctx = getCurrentContext();
  if (!ctx) return { stop() {} };

  const config = PROFILES[profile] || PROFILES.bronze;
  const now = ctx.currentTime;
  const decay = computeDecay(frequency, config.decayRange);
  const clampedVelocity = Math.max(0.1, Math.min(1, velocity));

  // Master gain envelope for the voice
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(clampedVelocity * 0.4, now + 0.008);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + decay);

  // Connect to dry and wet buses
  masterGain.connect(getDryBus());
  masterGain.connect(getWetBus());

  const oscillators = [];
  const gains = [];

  // Amplitude distribution: fundamental is loudest, harmonics diminish
  const amplitudeCurve = [1.0, 0.45, 0.2, 0.1];

  for (let i = 0; i < config.ratios.length; i++) {
    const osc = ctx.createOscillator();
    const partialGain = ctx.createGain();

    osc.type = config.types[i];
    const partialFreq = frequency * config.ratios[i];
    osc.frequency.setValueAtTime(partialFreq, now);

    // Organic pitch drift: ±3 cents via slow LFO on detune
    const driftAmount = 3; // cents
    const driftRate = 0.3 + Math.random() * 0.4; // Slow, organic rate
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(driftRate, now);
    lfoGain.gain.setValueAtTime(driftAmount, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    lfo.start(now);
    lfo.stop(now + decay + 0.1);

    // Per-partial amplitude envelope (slightly different decay per partial)
    const partialDecay = decay * (0.6 + 0.4 * (1 / (i + 1)));
    partialGain.gain.setValueAtTime(amplitudeCurve[i], now);
    partialGain.gain.exponentialRampToValueAtTime(0.001, now + partialDecay);

    osc.connect(partialGain);
    partialGain.connect(masterGain);
    osc.start(now);
    osc.stop(now + decay + 0.1);

    oscillators.push(osc, lfo);
    gains.push(partialGain);
  }

  // Initial strike transient: short noise burst
  const transientDuration = 0.04;
  const transientLength = Math.floor(ctx.sampleRate * transientDuration);
  const transientBuffer = ctx.createBuffer(1, transientLength, ctx.sampleRate);
  const transientData = transientBuffer.getChannelData(0);
  for (let i = 0; i < transientLength; i++) {
    transientData[i] = (Math.random() * 2 - 1) * Math.exp(-40 * (i / transientLength));
  }
  const transientSource = ctx.createBufferSource();
  transientSource.buffer = transientBuffer;
  const transientGain = ctx.createGain();
  transientGain.gain.setValueAtTime(clampedVelocity * 0.15, now);
  transientGain.gain.exponentialRampToValueAtTime(0.001, now + transientDuration);

  // Bandpass around the fundamental for the strike
  const strikeFilter = ctx.createBiquadFilter();
  strikeFilter.type = 'bandpass';
  strikeFilter.frequency.setValueAtTime(frequency * 2, now);
  strikeFilter.Q.setValueAtTime(2, now);

  transientSource.connect(strikeFilter);
  strikeFilter.connect(transientGain);
  transientGain.connect(masterGain);
  transientSource.start(now);

  let stopped = false;

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      const stopTime = ctx.currentTime + 0.05;
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.001, stopTime);
      for (const osc of oscillators) {
        try { osc.stop(stopTime + 0.05); } catch (_) { /* already stopped */ }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Continuous rim singing (friction drone)
// ---------------------------------------------------------------------------

/** Active rim voices keyed by bowl id. */
const _rimVoices = new Map();

/**
 * Start a sustained rim-singing drone for a bowl. Continuous oscillators run
 * through a shared BiquadFilterNode into a dynamic GainNode. Begins silent;
 * feed `updateRim` with pointer rotational velocity to shape it.
 * @param {number|string} key - Bowl identifier
 * @param {number} frequency - Fundamental frequency in Hz
 * @param {BowlProfile} [profile='bronze']
 */
export function startRim(key, frequency, profile = 'bronze') {
  const ctx = getCurrentContext();
  if (!ctx) return;
  stopRim(key);

  const config = PROFILES[profile] || PROFILES.bronze;
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.0;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = Math.max(100, Math.min(20000, frequency * 2));
  filter.Q.value = 4;

  filter.connect(masterGain);
  masterGain.connect(getDryBus());
  masterGain.connect(getWetBus());

  const now = ctx.currentTime;
  const oscillators = [];
  for (let i = 0; i < config.ratios.length; i++) {
    const osc = ctx.createOscillator();
    osc.type = config.types[i];
    osc.frequency.value = frequency * config.ratios[i];
    osc.connect(filter);
    osc.start(now);
    oscillators.push(osc);
  }

  _rimVoices.set(key, {
    ctx,
    masterGain,
    filter,
    oscillators,
    config,
    baseFreq: frequency,
    active: true,
  });

  // Shape from silence.
  updateRim(key, 0.001, frequency);
}

/**
 * Update an active rim drone's loudness + cutoff from pointer rotational
 * velocity. Faster rotation => louder + richer resonance.
 * @param {number|string} key - Bowl identifier
 * @param {number} intensity - 0–1 rotational velocity mapping
 * @param {number} [frequency] - Optionally retune the drone's base frequency
 */
export function updateRim(key, intensity, frequency) {
  const voice = _rimVoices.get(key);
  if (!voice || !voice.active) return;
  const ctx = voice.ctx;
  const now = ctx.currentTime;

  if (typeof frequency === 'number' && frequency !== voice.baseFreq) {
    voice.baseFreq = frequency;
    for (let i = 0; i < voice.oscillators.length; i++) {
      voice.oscillators[i].frequency.setTargetAtTime(
        frequency * voice.config.ratios[i],
        now,
        0.03,
      );
    }
  }

  const clamped = Math.max(0, Math.min(1, intensity));
  const gain = 0.05 + clamped * 0.45;
  const cutoff = 300 + clamped * 2400;
  voice.masterGain.gain.setTargetAtTime(gain, now, 0.03);
  voice.filter.frequency.setTargetAtTime(cutoff, now, 0.03);
}

/**
 * Fade an active rim drone out smoothly with a 0.5s exponential ramp and stop it.
 * @param {number|string} key - Bowl identifier
 */
export function stopRim(key) {
  const voice = _rimVoices.get(key);
  if (!voice) return;
  _rimVoices.delete(key);
  voice.active = false;
  const ctx = voice.ctx;
  const now = ctx.currentTime;
  try {
    voice.masterGain.gain.cancelScheduledValues(now);
    voice.masterGain.gain.setValueAtTime(Math.max(voice.masterGain.gain.value, 0.0001), now);
    voice.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  } catch (_) {
    /* ignore param scheduling errors */
  }
  const stopTime = now + 0.55;
  for (const osc of voice.oscillators) {
    try { osc.stop(stopTime); } catch (_) { /* already stopped */ }
  }
}

/** Stop all active rim drones (used on clear / destroy). */
export function stopAllRims() {
  for (const key of Array.from(_rimVoices.keys())) {
    stopRim(key);
  }
}
