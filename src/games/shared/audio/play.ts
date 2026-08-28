import { SOUND_BANK, type SoundName } from './sound-bank';
import { getSharedAudioGraph, resumeSharedAudioGraph, resetSharedAudioGraphForTests, setSharedMasterMuted } from './engine';
import {
  getSoundVolume as readSoundVolume,
  isMuted as readMuted,
  isSoundEnabled as readSoundEnabled,
  writeMutedPreference,
  writeSoundEnabledPreference,
  writeSoundVolume,
} from './preferences';
import { isAudioUnlocked, markAudioUnlocked } from './playback-state';

export type { SoundName } from './sound-bank';
export const SOUND_ENABLED = 'sound-enabled';
export const SOUND_VOLUME = 'sound-volume';

const lastPlayed = new Map<SoundName, number>();
const NOISY: ReadonlySet<SoundName> = new Set(['move', 'tick', 'error', 'step', 'blip']);
const COALESCE_MS = 40;
let inFlight = 0;
const MAX_VOICES = 8;

export function unlockAudio(): void {
  markAudioUnlocked();
  const graph = getSharedAudioGraph();
  if (graph?.context.state === 'suspended') void resumeSharedAudioGraph().catch(() => undefined);
}

export function isMuted(): boolean {
  return readMuted();
}

export function setMuted(value: boolean, persist = true): void {
  writeMutedPreference(value, persist);
  setSharedMasterMuted(value);
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('nocharge:mastermutechange', { detail: { muted: value } }));
    } catch {
      // CustomEvent is absent only in unusually small test/browser shims.
    }
  }
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

export function isSoundEnabled(): boolean {
  return readSoundEnabled();
}

export function setSoundEnabled(value: boolean): void {
  writeSoundEnabledPreference(value);
}

export function getSoundVolume(): number {
  return readSoundVolume();
}

export function setSoundVolume(value: number): void {
  writeSoundVolume(value);
}

function richerTone(
  context: AudioContext,
  destination: AudioNode,
  spec: (typeof SOUND_BANK)[SoundName],
  master: number,
  now: number,
): void {
  spec.frequencies.forEach((frequency, index) => {
    const start = now + index * 0.028;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = spec.waveform;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (spec.frequencies.length > 1) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.92), start + spec.duration);
    }

    const filter = context.createBiquadFilter();
    if (spec.filter) {
      filter.type = spec.filter.type;
      filter.frequency.value = spec.filter.frequency;
      filter.Q.value = spec.filter.Q ?? 1;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 2400;
    }

    const noise = context.createBufferSource();
    const noiseBuffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * 0.04)), context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let sample = 0; sample < noiseData.length; sample += 1) {
      noiseData[sample] = (Math.random() * 2 - 1) * 0.18;
    }
    noise.buffer = noiseBuffer;
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(master * 0.22, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(0.05, spec.duration));

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.connect(noiseGain);
    noiseGain.connect(destination);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(master, start + spec.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
    oscillator.start(start);
    oscillator.stop(start + spec.duration + 0.02);
    noise.start(start);
    noise.stop(start + 0.05);
  });
}

export async function play(name: SoundName, options: { volume?: number } = {}): Promise<number> {
  if (typeof window !== 'undefined' && Array.isArray((window as Window & { __nochargeSounds?: string[] }).__nochargeSounds)) {
    (window as Window & { __nochargeSounds?: string[] }).__nochargeSounds!.push(name);
  }
  if (isMuted() || !isSoundEnabled() || !isAudioUnlocked()) return 0;
  const spec = SOUND_BANK[name];
  if (!spec) return 0;

  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (NOISY.has(name)) {
    const previous = lastPlayed.get(name) ?? 0;
    if (nowMs - previous < COALESCE_MS) return 0;
  }
  lastPlayed.set(name, nowMs);
  if (inFlight >= MAX_VOICES && NOISY.has(name)) return 0;

  const graph = getSharedAudioGraph();
  if (!graph) return 0;
  inFlight += 1;
  try {
    await resumeSharedAudioGraph();
    const now = graph.context.currentTime;
    const master = (getSoundVolume() / 100) * (options.volume ?? 1) * 0.11;
    richerTone(graph.context, graph.effectsBus, spec, master, now);
    return spec.duration;
  } catch {
    return 0;
  } finally {
    inFlight = Math.max(0, inFlight - 1);
  }
}

export function resetAudioPlaybackForTests(): void {
  lastPlayed.clear();
  inFlight = 0;
  resetSharedAudioGraphForTests();
}
