export type AudioTimer = number;

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
export const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);
export const randomInt = (min: number, max: number): number => Math.floor(randomBetween(min, max + 1));

/** An exponential interval makes events cluster naturally without a metronome. */
export function randomExponential(mean: number, minimum = 0, maximum = Number.POSITIVE_INFINITY): number {
  const sample = -Math.log(Math.max(0.0001, 1 - Math.random())) * mean;
  return clamp(sample, minimum, maximum);
}

export function safeSetParam(param: AudioParam | undefined, value: number, time?: number): void {
  if (!param) return;
  try {
    if (time === undefined) param.value = value;
    else param.setValueAtTime(value, time);
  } catch {
    try { param.value = value; } catch { /* partial Web Audio implementation */ }
  }
}

export function safeLinearRamp(param: AudioParam | undefined, value: number, time: number): void {
  if (!param) return;
  try {
    param.linearRampToValueAtTime(value, time);
  } catch {
    try { param.value = value; } catch { /* partial Web Audio implementation */ }
  }
}

export function safeExponentialRamp(param: AudioParam | undefined, value: number, time: number): void {
  if (!param) return;
  try {
    param.exponentialRampToValueAtTime(Math.max(0.0001, value), time);
  } catch {
    try { param.value = value; } catch { /* partial Web Audio implementation */ }
  }
}

/** Cancel a previous fade before scheduling a new one, avoiding automation-order clicks. */
export function smoothRamp(param: AudioParam | undefined, value: number, now: number, duration: number): void {
  if (!param) return;
  const target = Math.max(0.0001, value);
  try {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    if (duration <= 0) param.setValueAtTime(target, now);
    else param.linearRampToValueAtTime(target, now + duration);
  } catch {
    try { param.value = target; } catch { /* partial Web Audio implementation */ }
  }
}

export function safeCancelAndSet(param: AudioParam | undefined, value: number, time: number): void {
  if (!param) return;
  try {
    param.cancelScheduledValues(time);
    param.setValueAtTime(Math.max(0.0001, value), time);
  } catch {
    try { param.value = value; } catch { /* partial Web Audio implementation */ }
  }
}

export function rampGain(gain: GainNode, start: number, peak: number, end: number, attack: number, release: number): void {
  safeSetParam(gain.gain, 0.0001, start);
  safeLinearRamp(gain.gain, Math.max(0.0001, peak), start + Math.max(0.002, attack));
  safeLinearRamp(gain.gain, 0.0001, Math.max(start + attack + 0.002, end - Math.max(0.004, release)));
  safeExponentialRamp(gain.gain, 0.0001, end);
}

export function createStereoPanner(context: AudioContext, initialPan = 0): AudioNode {
  if (typeof context.createStereoPanner === 'function') {
    try {
      const panner = context.createStereoPanner();
      safeSetParam(panner.pan, clamp(initialPan, -1, 1));
      return panner;
    } catch {
      // Fall through to a unity gain node for old or minimal implementations.
    }
  }
  return context.createGain();
}

export function setPan(node: AudioNode, pan: number, time?: number): void {
  const panner = node as AudioNode & { pan?: AudioParam };
  if (panner.pan) safeSetParam(panner.pan, clamp(pan, -1, 1), time);
}

export function configureFilter(
  filter: BiquadFilterNode,
  type: BiquadFilterType,
  frequency: number,
  Q = 0.7,
  gain = 0,
): void {
  try { filter.type = type; } catch { /* */ }
  safeSetParam(filter.frequency, Math.max(20, frequency));
  safeSetParam(filter.Q, Math.max(0.0001, Q));
  safeSetParam(filter.gain, gain);
}

export function configureEnvelope(
  gain: GainNode,
  start: number,
  duration: number,
  peak: number,
  attack = duration * 0.12,
  release = duration * 0.5,
): void {
  const end = start + Math.max(0.01, duration);
  rampGain(gain, start, peak, end, Math.min(attack, duration * 0.45), Math.min(release, duration * 0.8));
}

/**
 * Owns every timer and node created by one soundscape instance. Cleanup is
 * idempotent so a visibility change, selection change, and page teardown can
 * safely race without leaving an AudioNode or callback behind.
 */
export class DisposableBag {
  private readonly nodes = new Set<AudioNode>();
  private readonly timers = new Set<AudioTimer>();
  private readonly cleanups = new Set<() => void>();
  private disposed = false;

  addNode<T extends AudioNode>(node: T): T {
    if (this.disposed) {
      try { node.disconnect(); } catch { /* */ }
      return node;
    }
    this.nodes.add(node);
    return node;
  }

  addCleanup(cleanup: () => void): void {
    if (this.disposed) {
      try { cleanup(); } catch { /* */ }
      return;
    }
    this.cleanups.add(cleanup);
  }

  removeNode(node: AudioNode): void {
    this.nodes.delete(node);
  }

  setTimer(callback: () => void, delayMs: number): AudioTimer | null {
    if (this.disposed || typeof window === 'undefined') return null;
    let timer: AudioTimer;
    timer = window.setTimeout(() => {
      this.timers.delete(timer);
      if (this.disposed) return;
      try { callback(); } catch { /* no timer error escapes the audio layer */ }
    }, Math.max(0, delayMs));
    this.timers.add(timer);
    return timer;
  }

  clearTimer(timer: AudioTimer | null): void {
    if (timer === null) return;
    this.timers.delete(timer);
    if (typeof window !== 'undefined') window.clearTimeout(timer);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const timer of this.timers) {
      if (typeof window !== 'undefined') window.clearTimeout(timer);
    }
    this.timers.clear();
    for (const cleanup of this.cleanups) {
      try { cleanup(); } catch { /* */ }
    }
    this.cleanups.clear();
    for (const node of this.nodes) {
      try { node.disconnect(); } catch { /* */ }
    }
    this.nodes.clear();
  }

  get isDisposed(): boolean {
    return this.disposed;
  }
}
