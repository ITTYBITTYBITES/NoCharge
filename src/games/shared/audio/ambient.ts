import { loadPref } from '../storage';
import { getSoundVolume, isSoundEnabled, isMuted } from './play';

export type AmbientName = 'none' | 'white-noise' | 'rainfall' | 'forest' | 'fireplace' | 'ocean' | 'night' | 'cafe' | 'library' | 'lofi' | 'drone';

let audioContext: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let filter2: BiquadFilterNode | null = null;
let convolver: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;
let active: AmbientName = 'none';
let lofiTimers: number[] = [];
let oscNodes: OscillatorNode[] = [];

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
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  const dropCount = Math.floor(seconds * 18);
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
  let prev = 0;
  for (let i = 0; i < length; i++) {
    const cur = data[i];
    const smoothed = prev * 0.82 + cur * 0.18;
    data[i] = smoothed;
    prev = smoothed;
  }
  return buffer;
}

function createForestBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.992 + white * 0.015;
    data[i] = last * 2.0;
  }
  // Add chirps
  const chirpCount = Math.floor(seconds * 3);
  for (let c = 0; c < chirpCount; c++) {
    const pos = Math.floor(Math.random() * (length - 1000));
    const amp = 0.18 + Math.random() * 0.22;
    const freq = 2200 + Math.random() * 1800;
    for (let j = 0; j < 800; j++) {
      const t = j / ctx.sampleRate;
      const env = Math.exp(-t * 18) * amp;
      const wave = Math.sin(2 * Math.PI * freq * t) * env;
      if (pos + j < length) data[pos + j] += wave;
    }
  }
  return buffer;
}

function createFireplaceBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
  const crackleCount = Math.floor(seconds * 12);
  for (let c = 0; c < crackleCount; c++) {
    const pos = Math.floor(Math.random() * (length - 500));
    const amp = 0.3 + Math.random() * 0.4;
    for (let j = 0; j < 400; j++) {
      const t = j / ctx.sampleRate;
      const env = Math.exp(-t * 45) * amp;
      const wave = (Math.random() * 2 - 1) * env;
      if (pos + j < length) data[pos + j] += wave;
    }
  }
  return buffer;
}

function createOceanBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.97 + white * 0.03;
    // Slow swell 0.05Hz
    const swell = Math.sin((2 * Math.PI * 0.05 * i) / ctx.sampleRate) * 0.5 + 0.5;
    data[i] = last * (0.5 + swell * 0.5);
  }
  return buffer;
}

function createNightBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Near silence base
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
  // Crickets: 3.5kHz + 4.2kHz blips every 0.4s
  const interval = Math.floor(ctx.sampleRate * 0.4);
  for (let pos = 0; pos < length; pos += interval) {
    if (Math.random() > 0.3) {
      const amp = 0.15 + Math.random() * 0.15;
      for (let j = 0; j < 800; j++) {
        const t = j / ctx.sampleRate;
        const env = Math.exp(-t * 12) * amp;
        const wave = Math.sin(2 * Math.PI * 3500 * t) * env;
        if (pos + j < length) data[pos + j] += wave;
      }
      for (let j = 0; j < 600; j++) {
        const t = j / ctx.sampleRate;
        const env = Math.exp(-t * 15) * amp * 0.8;
        const wave = Math.sin(2 * Math.PI * 4200 * t) * env;
        if (pos + j + 200 < length) data[pos + j + 200] += wave;
      }
    }
  }
  return buffer;
}

function createCafeBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.992 + white * 0.015;
    const mod = Math.sin((2 * Math.PI * 0.7 * i) / ctx.sampleRate) * 0.15 + Math.sin((2 * Math.PI * 1.3 * i) / ctx.sampleRate) * 0.1;
    data[i] = last * 2.2 + mod * 0.08;
  }
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

function createLibraryBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.993 + white * 0.012;
    data[i] = last * 1.8;
  }
  const pageCount = Math.floor(seconds * 0.18);
  for (let p = 0; p < pageCount; p++) {
    const pos = Math.floor(Math.random() * (length - 4000));
    const amp = 0.1 + Math.random() * 0.12;
    for (let j = 0; j < 2500; j++) {
      const t = j / ctx.sampleRate;
      const env = Math.exp(-t * 8) * amp;
      const wave = (Math.random() * 2 - 1) * env * 0.5;
      if (pos + j < length) data[pos + j] += wave;
    }
  }
  return buffer;
}

function createReverbImpulse(ctx: AudioContext, seconds = 1.2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5) * 0.6;
    }
  }
  return buf;
}

export function stopAmbient(): void {
  try { source?.stop(); } catch { /* */ }
  source?.disconnect();
  gain?.disconnect();
  filter?.disconnect();
  filter2?.disconnect();
  convolver?.disconnect();
  reverbGain?.disconnect();
  for (const osc of oscNodes) {
    try { osc.stop(); } catch { /* */ }
    osc.disconnect();
  }
  oscNodes = [];
  for (const t of lofiTimers) clearTimeout(t);
  lofiTimers = [];
  source = null;
  gain = null;
  filter = null;
  filter2 = null;
  convolver = null;
  reverbGain = null;
  active = 'none';
}

export function getAmbient(): AmbientName {
  const v = loadPref<string>('ambient-sound', 'none');
  const allowed: AmbientName[] = ['none','white-noise','rainfall','forest','fireplace','ocean','night','cafe','library','lofi','drone'];
  return (allowed as string[]).includes(v) ? (v as AmbientName) : 'none';
}

export function getActiveAmbient(): AmbientName {
  return active;
}

function currentVolume(): number {
  return Math.max(0, Math.min(100, getSoundVolume())) / 100;
}

function baseGainFor(name: AmbientName): number {
  switch (name) {
    case 'white-noise': return 0.022;
    case 'rainfall': return 0.032;
    case 'forest': return 0.030;
    case 'fireplace': return 0.028;
    case 'ocean': return 0.026;
    case 'night': return 0.020;
    case 'cafe': return 0.028;
    case 'library': return 0.022;
    case 'lofi': return 0.025;
    case 'drone': return 0.028;
    default: return 0.025;
  }
}

export function startAmbient(name: AmbientName = getAmbient()): AmbientName {
  stopAmbient();
  if (name === 'none' || isMuted() || !isSoundEnabled()) return 'none';
  if (typeof window === 'undefined') return 'none';
  const ctx = ensureContext();
  if (!ctx) return 'none';
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

  // Musical types use oscillators, not buffer source
  if (name === 'lofi' || name === 'drone') {
    return startMusicalAmbient(name, ctx);
  }

  const secondsMap: Record<AmbientName, number> = {
    'none': 0,
    'white-noise': 3,
    'rainfall': 5,
    'forest': 5,
    'fireplace': 8,
    'ocean': 8,
    'night': 6,
    'cafe': 6,
    'library': 6,
    'lofi': 0,
    'drone': 0,
  };
  const seconds = secondsMap[name] || 4;

  let buffer: AudioBuffer;
  switch (name) {
    case 'white-noise': buffer = createWhiteNoiseBuffer(ctx, seconds); break;
    case 'rainfall': buffer = createRainBuffer(ctx, seconds); break;
    case 'forest': buffer = createForestBuffer(ctx, seconds); break;
    case 'fireplace': buffer = createFireplaceBuffer(ctx, seconds); break;
    case 'ocean': buffer = createOceanBuffer(ctx, seconds); break;
    case 'night': buffer = createNightBuffer(ctx, seconds); break;
    case 'cafe': buffer = createCafeBuffer(ctx, seconds); break;
    case 'library': buffer = createLibraryBuffer(ctx, seconds); break;
    default: buffer = createWhiteNoiseBuffer(ctx, seconds); break;
  }

  source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  gain = ctx.createGain();
  gain.gain.value = currentVolume() * baseGainFor(name);

  // Filtering per type
  if (name === 'white-noise') {
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1800; filter.Q.value = 0.7;
    source.connect(filter); filter.connect(gain);
  } else if (name === 'rainfall') {
    filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1700; filter.Q.value = 0.9;
    filter2 = ctx.createBiquadFilter(); filter2.type = 'highpass'; filter2.frequency.value = 380;
    source.connect(filter); filter.connect(filter2); filter2.connect(gain);
  } else if (name === 'forest') {
    filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 800;
    filter2 = ctx.createBiquadFilter(); filter2.type = 'bandpass'; filter2.frequency.value = 2400; filter2.Q.value = 1.2;
    source.connect(filter); filter.connect(filter2); filter2.connect(gain);
  } else if (name === 'fireplace') {
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600;
    source.connect(filter); filter.connect(gain);
  } else if (name === 'ocean') {
    filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 0.7;
    filter2 = ctx.createBiquadFilter(); filter2.type = 'lowpass'; filter2.frequency.value = 900;
    source.connect(filter); filter.connect(filter2); filter2.connect(gain);
  } else if (name === 'night') {
    filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 2000;
    source.connect(filter); filter.connect(gain);
  } else if (name === 'cafe') {
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 950; filter.Q.value = 0.8;
    filter2 = ctx.createBiquadFilter(); filter2.type = 'peaking'; filter2.frequency.value = 320; filter2.gain.value = 2.5; filter2.Q.value = 1.1;
    source.connect(filter); filter.connect(filter2); filter2.connect(gain);
  } else if (name === 'library') {
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 700;
    source.connect(filter); filter.connect(gain);
  }

  gain.connect(ctx.destination);
  try { source.start(); } catch { /* */ }
  active = name;
  return name;
}

function startMusicalAmbient(name: 'lofi' | 'drone', ctx: AudioContext): AmbientName {
  gain = ctx.createGain();
  gain.gain.value = currentVolume() * baseGainFor(name);

  // Reverb
  convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx, 1.2);
  reverbGain = ctx.createGain();
  reverbGain.gain.value = name === 'lofi' ? 0.18 : 0.25;

  gain.connect(ctx.destination);
  convolver.connect(reverbGain);
  reverbGain.connect(ctx.destination);

  if (name === 'drone') {
    const osc1 = ctx.createOscillator(); osc1.frequency.value = 65.41; osc1.type = 'sine'; osc1.detune.value = -4;
    const osc2 = ctx.createOscillator(); osc2.frequency.value = 98.00; osc2.type = 'sine'; osc2.detune.value = 4;
    const oscGain = ctx.createGain(); oscGain.gain.value = 0;
    oscGain.gain.linearRampToValueAtTime(currentVolume()*0.028, ctx.currentTime+2);
    // Slow swell 0.01->0.028 over 8s loop via interval
    const swell = () => {
      if (active !== 'drone') return;
      try {
        oscGain.gain.linearRampToValueAtTime(currentVolume()*0.01, ctx.currentTime+4);
        oscGain.gain.linearRampToValueAtTime(currentVolume()*0.028, ctx.currentTime+8);
      } catch { /* */ }
      const t = window.setTimeout(swell, 8000);
      lofiTimers.push(t);
    };
    osc1.connect(oscGain); osc2.connect(oscGain);
    oscGain.connect(gain); oscGain.connect(convolver);
    osc1.start(); osc2.start();
    oscNodes.push(osc1, osc2);
    swell();
  } else {
    // lofi - generative pentatonic melody
    const notes = [261.63, 293.66, 329.63, 392.0, 440.0]; // C4,D4,E4,G4,A4
    const schedule = () => {
      if (active !== 'lofi') return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = notes[Math.floor(Math.random()*notes.length)];
      osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(currentVolume()*0.025, now+0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, now+1.2);
      const filt = ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=1100;
      osc.connect(filt); filt.connect(g);
      g.connect(gain!); g.connect(convolver!);
      osc.start(now); osc.stop(now+1.25);
      oscNodes.push(osc);
      // Cleanup old osc nodes after they stop to avoid memory leak
      const cleanupTimer = window.setTimeout(() => {
        oscNodes = oscNodes.filter(o=>o!==osc);
      }, 2000);
      lofiTimers.push(cleanupTimer);
      const nextDelay = 1500 + Math.random()*1300;
      const timer = window.setTimeout(schedule, nextDelay);
      lofiTimers.push(timer);
    };
    schedule();
  }

  active = name;
  return name;
}

export function refreshAmbient(): AmbientName {
  return startAmbient(getAmbient());
}

export function duckAmbient(ducked = true): void {
  if (!gain) return;
  const vol = currentVolume();
  if (ducked) {
    try { gain.gain.linearRampToValueAtTime(0.008, (audioContext?.currentTime ?? 0)+0.12); } catch { gain.gain.value = 0.008; }
  } else {
    try { gain.gain.linearRampToValueAtTime(vol*baseGainFor(active), (audioContext?.currentTime ?? 0)+0.2); } catch { gain.gain.value = vol*baseGainFor(active); }
  }
}

export function updateAmbientVolume(): void {
  if (!gain) return;
  const vol = currentVolume();
  try { gain.gain.linearRampToValueAtTime(vol*baseGainFor(active), (audioContext?.currentTime ?? 0)+0.08); } catch { gain.gain.value = vol*baseGainFor(active); }
}
