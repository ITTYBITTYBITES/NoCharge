import { loadPref, savePref } from '../storage';
import { SOUND_BANK, type SoundName } from './sound-bank';
export type { SoundName } from './sound-bank';
export const SOUND_ENABLED = 'sound-enabled';
export const SOUND_VOLUME = 'sound-volume';
const MUTED = 'game-muted';
let context: AudioContext | null = null;
let unlocked = false;

const NOISY: ReadonlySet<SoundName> = new Set(['move', 'tick', 'error', 'step', 'blip']);
const lastPlayed = new Map<SoundName, number>();
const COALESCE_MS = 40;
let inFlight = 0;
const MAX_VOICES = 8;

function getContext() {
  if (typeof window === 'undefined') return null;
  const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return (context ??= C ? new C() : null);
}

export function unlockAudio() {
  unlocked = true;
  const c = getContext();
  if (c?.state === 'suspended') void c.resume();
}

export function isMuted() {
  return loadPref(MUTED, false);
}
export function setMuted(value: boolean, persist = true) {
  if (persist) savePref(MUTED, value);
}
export function toggleMuted() {
  const next = !isMuted();
  setMuted(next);
  return next;
}
export function isSoundEnabled() {
  return loadPref(SOUND_ENABLED, true);
}
export function setSoundEnabled(value: boolean) {
  savePref(SOUND_ENABLED, value);
}
export function getSoundVolume() {
  const n = loadPref(SOUND_VOLUME, 60);
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 60;
}
export function setSoundVolume(value: number) {
  savePref(SOUND_VOLUME, Math.max(0, Math.min(100, Math.round(value))));
}

function richerTone(c: AudioContext, spec: (typeof SOUND_BANK)[SoundName], master: number, now: number) {
  spec.frequencies.forEach((frequency, i) => {
    const start = now + i * 0.028;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = spec.waveform;
    osc.frequency.setValueAtTime(frequency, start);
    if (spec.frequencies.length > 1) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.92), start + spec.duration);
    }
    const filter = c.createBiquadFilter();
    if (spec.filter) {
      filter.type = spec.filter.type;
      filter.frequency.value = spec.filter.frequency;
      filter.Q.value = spec.filter.Q ?? 1;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 2400;
    }
    const noise = c.createBufferSource();
    const noiseBuf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * 0.04)), c.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let n = 0; n < data.length; n++) data[n] = (Math.random() * 2 - 1) * 0.18;
    noise.buffer = noiseBuf;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(master * 0.22, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(0.05, spec.duration));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    noise.connect(noiseGain);
    noiseGain.connect(c.destination);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(master, start + spec.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
    osc.start(start);
    osc.stop(start + spec.duration + 0.02);
    noise.start(start);
    noise.stop(start + 0.05);
  });
}

export function play(name: SoundName, options: { volume?: number } = {}): Promise<number> {
  if (typeof window !== 'undefined' && Array.isArray((window as Window & { __nochargeSounds?: string[] }).__nochargeSounds)) {
    (window as Window & { __nochargeSounds?: string[] }).__nochargeSounds!.push(name);
  }
  if (isMuted() || !isSoundEnabled() || !unlocked) return Promise.resolve(0);
  const spec = SOUND_BANK[name];
  if (!spec) return Promise.resolve(0);

  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (NOISY.has(name)) {
    const last = lastPlayed.get(name) ?? 0;
    if (nowMs - last < COALESCE_MS) return Promise.resolve(0);
  }
  lastPlayed.set(name, nowMs);
  if (inFlight >= MAX_VOICES && NOISY.has(name)) return Promise.resolve(0);

  const c = getContext();
  if (!c) return Promise.resolve(0);
  inFlight += 1;
  const start = async () => {
    if (c.state === 'suspended') await c.resume().catch(() => {});
    const now = c.currentTime;
    const master = (getSoundVolume() / 100) * (options.volume ?? 1) * 0.11;
    richerTone(c, spec, master, now);
    return spec.duration;
  };
  return start()
    .catch(() => 0)
    .finally(() => {
      inFlight = Math.max(0, inFlight - 1);
    });
}

export function resetAudioPlaybackForTests() {
  lastPlayed.clear();
  inFlight = 0;
}
