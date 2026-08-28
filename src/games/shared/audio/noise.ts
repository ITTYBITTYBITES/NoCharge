import { DisposableBag, safeExponentialRamp, safeLinearRamp, safeSetParam, smoothRamp, type AudioTimer } from './utils';

export type NoiseColor = 'white' | 'pink' | 'brown';

const WORKLET_PROCESSOR = 'nocharge-stereo-noise';
// Public static site code keeps the worklet same-origin and lets Astro copy it
// without treating it as an external dependency or an audio asset.
const WORKLET_URL = '/audio/nocharge-ambient-worklet.js';
const FALLBACK_OVERLAP_SECONDS = 0.55;

let attemptedWorkletContext: AudioContext | null = null;
let workletPromise: Promise<boolean> | null = null;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x6d2b79f5;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

interface PinkState {
  values: number[];
}

function createPinkState(): PinkState {
  return { values: [0, 0, 0, 0, 0, 0, 0] };
}

function pinkSample(state: PinkState, white: number): number {
  const p = state.values;
  p[0] = 0.99886 * p[0] + white * 0.0555179;
  p[1] = 0.99332 * p[1] + white * 0.0750759;
  p[2] = 0.96900 * p[2] + white * 0.1538520;
  p[3] = 0.86650 * p[3] + white * 0.3104856;
  p[4] = 0.55000 * p[4] + white * 0.5329522;
  p[5] = -0.7616 * p[5] - white * 0.0168980;
  const pink = p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + white * 0.5362;
  p[6] = white * 0.115926;
  return pink * 0.11;
}

/**
 * Fill one channel with a fresh colored-noise stream. It is exported so the
 * fallback and spectrum tests share exactly the same documented algorithm.
 */
export function fillColoredNoise(target: Float32Array, color: NoiseColor, seed = 0x13579bdf): void {
  const random = seededRandom(seed);
  const pink = createPinkState();
  let brown = 0;
  let previousBrown = 0;

  for (let index = 0; index < target.length; index += 1) {
    const white = random() * 2 - 1;
    if (color === 'white') {
      target[index] = white * 0.32;
    } else if (color === 'pink') {
      target[index] = pinkSample(pink, white);
    } else {
      // The leaky integration and tiny DC bleed keep brown noise bounded. A
      // high-pass node is added by the brown-noise soundscape as a second guard.
      brown = brown * 0.995 + white * 0.045;
      brown -= brown * 0.00008;
      target[index] = (brown - previousBrown * 0.0003) * 0.72;
      previousBrown = brown;
    }
  }
}

function canUseAudioWorklet(context: AudioContext): boolean {
  try {
    if (!context.audioWorklet || typeof context.audioWorklet.addModule !== 'function') return false;
    return typeof AudioWorkletNode !== 'undefined';
  } catch {
    return false;
  }
}

function loadNoiseWorklet(context: AudioContext): Promise<boolean> {
  if (!canUseAudioWorklet(context)) return Promise.resolve(false);
  if (attemptedWorkletContext === context && workletPromise) return workletPromise;

  attemptedWorkletContext = context;
  // A failed module load is a normal capability fallback, not an unhandled
  // promise. The caller keeps its fresh overlapping segment generator alive.
  try {
    workletPromise = context.audioWorklet.addModule(WORKLET_URL)
      .then(() => true)
      .catch(() => false);
  } catch {
    workletPromise = Promise.resolve(false);
  }
  return workletPromise;
}

interface FallbackSegment {
  source: AudioBufferSourceNode;
  gain: GainNode;
  cleanupTimer: AudioTimer | null;
  end: number;
}

/**
 * A capability fallback: every segment is newly generated, stereo, and
 * overlapped with the next one. No segment is looped and no fixed buffer is
 * reused, so a browser without AudioWorklet still gets an evolving stream.
 */
class OverlappingSegmentPlayer {
  private readonly segments = new Set<FallbackSegment>();
  private readonly timers = new Set<AudioTimer>();
  private running = false;
  private nextTimer: AudioTimer | null = null;

  constructor(
    private readonly context: AudioContext,
    private readonly output: AudioNode,
    private readonly color: NoiseColor,
    private readonly segmentSeconds: number,
    private readonly seed: number,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.scheduleSegment(0);
  }

  private scheduleTimer(callback: () => void, delay: number): AudioTimer | null {
    if (typeof window === 'undefined' || !this.running) return null;
    let timer: AudioTimer;
    timer = window.setTimeout(() => {
      this.timers.delete(timer);
      try { callback(); } catch { /* fallback timing must never escape */ }
    }, Math.max(0, delay));
    this.timers.add(timer);
    return timer;
  }

  private scheduleSegment(delay: number): void {
    this.nextTimer = this.scheduleTimer(() => {
      if (!this.running) return;
      this.createSegment();
    }, delay);
  }

  private createSegment(): void {
    // Keep the capability fallback light on the main thread. It still changes
    // seed and duration for every segment, but never allocates a large wave in
    // response to a soundscape's longer event envelope.
    const duration = Math.max(2.6, Math.min(5.8, this.segmentSeconds) * (0.76 + Math.random() * 0.58));
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(2, length, this.context.sampleRate);
    // Two unrelated seeds ensure the fallback is stereo rather than a copied
    // mono channel. The segment seed changes for every new segment.
    fillColoredNoise(buffer.getChannelData(0), this.color, (this.seed ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
    fillColoredNoise(buffer.getChannelData(1), this.color, (this.seed ^ Math.floor(Math.random() * 0xffffffff) ^ 0x9e3779b9) >>> 0);

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = false;
    source.connect(gain);
    gain.connect(this.output);

    const start = this.context.currentTime + 0.018;
    const end = start + duration;
    safeSetParam(gain.gain, 0.0001, start);
    safeLinearRamp(gain.gain, 1, start + Math.min(0.35, duration * 0.14));
    safeLinearRamp(gain.gain, 1, end - FALLBACK_OVERLAP_SECONDS);
    safeExponentialRamp(gain.gain, 0.0001, end);

    const segment: FallbackSegment = { source, gain, cleanupTimer: null, end };
    this.segments.add(segment);
    try {
      source.start(start);
      source.stop(end + 0.04);
    } catch {
      this.cleanupSegment(segment);
      return;
    }

    segment.cleanupTimer = this.scheduleTimer(() => this.cleanupSegment(segment), Math.ceil((duration + 0.18) * 1000));
    const nextDelay = Math.max(900, (duration - FALLBACK_OVERLAP_SECONDS) * 1000 * (0.92 + Math.random() * 0.14));
    this.scheduleSegment(nextDelay);
  }

  private cleanupSegment(segment: FallbackSegment): void {
    this.segments.delete(segment);
    if (segment.cleanupTimer !== null) {
      this.timers.delete(segment.cleanupTimer);
      if (typeof window !== 'undefined') window.clearTimeout(segment.cleanupTimer);
      segment.cleanupTimer = null;
    }
    try { segment.source.disconnect(); } catch { /* */ }
    try { segment.gain.disconnect(); } catch { /* */ }
  }

  stop(fadeSeconds = 0.35): void {
    if (!this.running && this.segments.size === 0) return;
    this.running = false;
    if (this.nextTimer !== null && typeof window !== 'undefined') window.clearTimeout(this.nextTimer);
    if (this.nextTimer !== null) this.timers.delete(this.nextTimer);
    this.nextTimer = null;
    for (const timer of this.timers) {
      if (typeof window !== 'undefined') window.clearTimeout(timer);
    }
    this.timers.clear();

    const now = this.context.currentTime;
    const end = now + Math.max(0, fadeSeconds);
    for (const segment of this.segments) {
      smoothRamp(segment.gain.gain, 0.0001, now, Math.max(0, fadeSeconds));
      try { segment.source.stop(end + 0.04); } catch { /* already ended */ }
    }
    if (fadeSeconds <= 0) {
      for (const segment of [...this.segments]) this.cleanupSegment(segment);
    } else if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        for (const segment of [...this.segments]) this.cleanupSegment(segment);
      }, Math.ceil((fadeSeconds + 0.12) * 1000));
    }
  }

  dispose(): void {
    this.stop(0);
    for (const segment of [...this.segments]) this.cleanupSegment(segment);
  }
}

export interface ProceduralNoiseVoiceOptions {
  color: NoiseColor;
  seed?: number;
  segmentSeconds?: number;
}

/** A stereo worklet-first noise voice with an idempotent lifecycle. */
export class ProceduralNoiseVoice {
  readonly output: GainNode;
  readonly ready: Promise<boolean>;

  private readonly bag = new DisposableBag();
  private readonly fallbackGain: GainNode;
  private readonly workletGain: GainNode;
  private readonly fallback: OverlappingSegmentPlayer;
  private workletNode: AudioWorkletNode | null = null;
  private disposed = false;

  constructor(private readonly context: AudioContext, private readonly options: ProceduralNoiseVoiceOptions) {
    this.output = this.bag.addNode(context.createGain());
    this.fallbackGain = this.bag.addNode(context.createGain());
    this.workletGain = this.bag.addNode(context.createGain());
    safeSetParam(this.fallbackGain.gain, 1);
    safeSetParam(this.workletGain.gain, 0.0001);
    this.fallbackGain.connect(this.output);
    this.workletGain.connect(this.output);

    this.fallback = new OverlappingSegmentPlayer(
      context,
      this.fallbackGain,
      options.color,
      options.segmentSeconds ?? 4.4,
      options.seed ?? Math.floor(Math.random() * 0xffffffff),
    );
    this.fallback.start();

    this.ready = loadNoiseWorklet(context)
      .then((loaded) => {
        if (loaded && !this.disposed) this.installWorklet();
        return loaded;
      })
      .catch(() => false);
  }

  private installWorklet(): void {
    if (this.disposed || typeof AudioWorkletNode === 'undefined') return;
    try {
      const node = new AudioWorkletNode(this.context, WORKLET_PROCESSOR, {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        processorOptions: {
          color: this.options.color,
          seed: this.options.seed ?? Math.floor(Math.random() * 0xffffffff),
        },
      });
      this.workletNode = this.bag.addNode(node);
      node.connect(this.workletGain);
      const now = this.context.currentTime;
      safeSetParam(this.workletGain.gain, 0.0001, now);
      safeLinearRamp(this.workletGain.gain, 1, now + 0.45);
      safeLinearRamp(this.fallbackGain.gain, 0.0001, now + 0.45);
      this.bag.setTimer(() => this.fallback.stop(0), 650);
    } catch {
      // Keep the already-running overlapping fallback when a browser exposes
      // AudioWorklet but rejects this particular node configuration.
    }
  }

  stop(fadeSeconds = 0.35): void {
    if (this.disposed) return;
    const now = this.context.currentTime;
    smoothRamp(this.fallbackGain.gain, 0.0001, now, Math.max(0, fadeSeconds));
    smoothRamp(this.workletGain.gain, 0.0001, now, Math.max(0, fadeSeconds));
    this.fallback.stop(fadeSeconds);
    if (fadeSeconds <= 0) this.dispose();
    else this.bag.setTimer(() => this.dispose(), Math.ceil((fadeSeconds + 0.14) * 1000));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.fallback.dispose();
    try { this.workletNode?.port.close(); } catch { /* */ }
    this.bag.dispose();
    this.workletNode = null;
  }
}

export function createProceduralNoiseVoice(context: AudioContext, options: ProceduralNoiseVoiceOptions): ProceduralNoiseVoice {
  return new ProceduralNoiseVoice(context, options);
}
