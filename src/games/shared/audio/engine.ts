import { isMuted } from './preferences';

export interface SharedAudioGraph {
  context: AudioContext;
  masterGain: GainNode;
  effectsBus: GainNode;
  ambientBus: GainNode;
  limiter: DynamicsCompressorNode | AudioNode;
}

let graph: SharedAudioGraph | null = null;

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const browserWindow = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  return browserWindow.AudioContext ?? browserWindow.webkitAudioContext ?? null;
}

function setCompressorParam(param: AudioParam | undefined, value: number): void {
  if (!param) return;
  try {
    param.value = value;
  } catch {
    // A browser may expose a partial AudioContext in a test or embedded view.
  }
}

function createGraph(context: AudioContext): SharedAudioGraph {
  const masterGain = context.createGain();
  const effectsBus = context.createGain();
  const ambientBus = context.createGain();

  // DynamicsCompressor is the final safety net for the many independent event
  // voices. It is optional only for minimal Web Audio shims; real browsers use
  // it for both game effects and ambient soundscapes.
  let limiter: DynamicsCompressorNode | AudioNode = context.destination;
  if (typeof context.createDynamicsCompressor === 'function') {
    try {
      const compressor = context.createDynamicsCompressor();
      setCompressorParam(compressor.threshold, -8);
      setCompressorParam(compressor.knee, 18);
      setCompressorParam(compressor.ratio, 12);
      setCompressorParam(compressor.attack, 0.003);
      setCompressorParam(compressor.release, 0.25);
      limiter = compressor;
    } catch {
      limiter = context.destination;
    }
  }

  effectsBus.connect(masterGain);
  ambientBus.connect(masterGain);
  masterGain.connect(limiter);
  if (limiter !== context.destination) limiter.connect(context.destination);

  const graphState: SharedAudioGraph = { context, masterGain, effectsBus, ambientBus, limiter };
  setMasterGain(graphState, isMuted() ? 0 : 1, 0);
  return graphState;
}

export function getSharedAudioGraph(): SharedAudioGraph | null {
  if (typeof window === 'undefined') return null;
  if (graph && graph.context.state !== 'closed') return graph;

  const Constructor = getAudioContextConstructor();
  if (!Constructor) return null;
  try {
    graph = createGraph(new Constructor());
    return graph;
  } catch {
    graph = null;
    return null;
  }
}

export async function resumeSharedAudioGraph(): Promise<void> {
  const current = getSharedAudioGraph();
  if (!current || current.context.state !== 'suspended') return;
  await current.context.resume().catch(() => undefined);
}

export function setMasterGain(state: SharedAudioGraph | null, value: number, duration = 0.08): void {
  if (!state) return;
  const target = Math.max(0, Math.min(1, value));
  const now = state.context.currentTime;
  try {
    state.masterGain.gain.cancelScheduledValues(now);
    state.masterGain.gain.setValueAtTime(state.masterGain.gain.value, now);
    if (duration <= 0) state.masterGain.gain.setValueAtTime(target, now);
    else state.masterGain.gain.linearRampToValueAtTime(target, now + duration);
  } catch {
    try { state.masterGain.gain.value = target; } catch { /* partial test shim */ }
  }
}

export function setSharedMasterMuted(value: boolean): void {
  setMasterGain(graph, value ? 0 : 1, 0.08);
}

/** Disconnect the shared graph in tests without affecting local preferences. */
export function resetSharedAudioGraphForTests(): void {
  if (!graph) return;
  try { graph.effectsBus.disconnect(); } catch { /* */ }
  try { graph.ambientBus.disconnect(); } catch { /* */ }
  try { graph.masterGain.disconnect(); } catch { /* */ }
  try { graph.limiter.disconnect(); } catch { /* */ }
  graph = null;
}
