import { loadPref } from '../storage';
import { getSoundVolume, isSoundEnabled, isMuted } from './play';

export type AmbientName = 'none' | 'rainfall' | 'cafe' | 'white-noise';

let audioContext: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let filter2: BiquadFilterNode | null = null;
let active: AmbientName = 'none';

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext && audioContext.state !== 'closed') return audioContext;
  const C = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  audioContext = new C();
  return audioContext;
}

function createWhiteNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function createBrownNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.985 + white * 0.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function createRainBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Base filtered noise for rain wash
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.4;
  }
  // Add random droplet impulses: short high-frequency bursts with exponential decay
  const dropCount = Math.floor(seconds * 18); // ~18 drops per second
  for (let d = 0; d < dropCount; d++) {
    const pos = Math.floor(Math.random() * (length - 2000));
    const amp = 0.25 + Math.random() * 0.35;
    const freq = 1200 + Math.random() * 2800;
    for (let j = 0; j < 1200; j++) {
      const t = j / ctx.sampleRate;
      const env = Math.exp(-t * 28) * amp;
      const wave = Math.sin(2 * Math.PI * freq * t) * env;
      if (pos + j < length) data[pos + j] += wave;
    }
  }
  // Gentle low-pass smoothing for wash
  let prev = 0;
  for (let i = 0; i < length; i++) {
    const cur = data[i];
    const smoothed = prev * 0.82 + cur * 0.18;
    data[i] = smoothed;
    prev = smoothed;
  }
  return buffer;
}

function createCafeBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown-ish base for room hum + distant chatter wash
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.992 + white * 0.015;
    // Add slow modulation to simulate distant voices
    const mod = Math.sin((2 * Math.PI * 0.7 * i) / ctx.sampleRate) * 0.15 + Math.sin((2 * Math.PI * 1.3 * i) / ctx.sampleRate) * 0.1;
    data[i] = last * 2.2 + mod * 0.08;
  }
  // Add occasional soft clinks / chair moves: very sparse low impulses
  const clinkCount = Math.floor(seconds * 0.6);
  for (let c = 0; c < clinkCount; c++) {
    const pos = Math.floor(Math.random() * (length - 3000));
    const amp = 0.12 + Math.random() * 0.18;
    const freq = 600 + Math.random() * 900;
    for (let j = 0; j < 1800; j++) {
      const t = j / ctx.sampleRate;
      const env = Math.exp(-t * 12) * amp;
      const wave = Math.sin(2 * Math.PI * freq * t) * env * (Math.random() * 0.3 + 0.7);
      if (pos + j < length) data[pos + j] += wave;
    }
  }
  return buffer;
}

export function stopAmbient(): void {
  try { source?.stop(); } catch { /* already stopped */ }
  source?.disconnect();
  gain?.disconnect();
  filter?.disconnect();
  filter2?.disconnect();
  source = null;
  gain = null;
  filter = null;
  filter2 = null;
  active = 'none';
}

export function getAmbient(): AmbientName {
  const v = loadPref<string>('ambient-sound', 'none');
  return (['none', 'rainfall', 'cafe', 'white-noise'] as const).includes(v as AmbientName) ? (v as AmbientName) : 'none';
}

export function getActiveAmbient(): AmbientName {
  return active;
}

function currentVolume(): number {
  return Math.max(0, Math.min(100, getSoundVolume())) / 100;
}

export function startAmbient(name: AmbientName = getAmbient()): AmbientName {
  stopAmbient();
  if (name === 'none' || isMuted() || !isSoundEnabled()) return 'none';
  if (typeof window === 'undefined') return 'none';
  const ctx = ensureContext();
  if (!ctx) return 'none';
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }

  const seconds = name === 'cafe' ? 6 : name === 'rainfall' ? 5 : 3;
  let buffer: AudioBuffer;
  if (name === 'white-noise') buffer = createWhiteNoiseBuffer(ctx, seconds);
  else if (name === 'rainfall') buffer = createRainBuffer(ctx, seconds);
  else if (name === 'cafe') buffer = createCafeBuffer(ctx, seconds);
  else buffer = createWhiteNoiseBuffer(ctx, seconds);

  source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  gain = ctx.createGain();
  // Keep ambient quiet: 0.035 * volume, white-noise slightly softer
  const base = name === 'white-noise' ? 0.022 : name === 'rainfall' ? 0.032 : 0.028;
  gain.gain.value = currentVolume() * base;

  // Distinct filtering per type
  if (name === 'white-noise') {
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    filter.Q.value = 0.7;
    source.connect(filter);
    filter.connect(gain);
  } else if (name === 'rainfall') {
    filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1700;
    filter.Q.value = 0.9;
    filter2 = ctx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.value = 380;
    source.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
  } else {
    // cafe
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 950;
    filter.Q.value = 0.8;
    filter2 = ctx.createBiquadFilter();
    filter2.type = 'peaking';
    filter2.frequency.value = 320;
    filter2.gain.value = 2.5;
    filter2.Q.value = 1.1;
    source.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
  }

  gain.connect(ctx.destination);
  try { source.start(); } catch { /* */ }
  active = name;
  return name;
}

export function refreshAmbient(): AmbientName {
  return startAmbient(getAmbient());
}

export function duckAmbient(ducked = true): void {
  if (!gain) return;
  const vol = currentVolume();
  if (ducked) gain.gain.value = 0.008;
  else {
    const base = active === 'white-noise' ? 0.022 : active === 'rainfall' ? 0.032 : 0.028;
    gain.gain.value = vol * base;
  }
}

export function updateAmbientVolume(): void {
  if (!gain) return;
  const vol = currentVolume();
  const base = active === 'white-noise' ? 0.022 : active === 'rainfall' ? 0.032 : 0.028;
  try { gain.gain.linearRampToValueAtTime(vol * base, (audioContext?.currentTime ?? 0) + 0.08); } catch { gain.gain.value = vol * base; }
}
