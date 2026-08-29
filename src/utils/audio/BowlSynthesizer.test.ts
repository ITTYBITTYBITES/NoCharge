import { beforeEach, describe, expect, it } from 'vitest';
import { unlockAudioContext, __resetAudioForTests } from './AudioContextManager.js';
import { startRim, updateRim, stopRim, strikeBowl, stopAllRims } from './BowlSynthesizer.js';

class FakeParam {
  value = 0;
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
  cancelScheduledValues() {}
  setTargetAtTime() {}
}

class FakeNode {
  type = 'sine';
  frequency = new FakeParam();
  gain = new FakeParam();
  Q = new FakeParam();
  detune = new FakeParam();
  buffer: unknown = null;
  connect() {
    return this;
  }
  disconnect() {}
  start() {}
  stop() {}
}

let singleton: FakeAudioContextState | null = null;

interface FakeAudioContextState {
  sampleRate: number;
  currentTime: number;
  state: string;
  destination: FakeNode;
  startedOscillators: number;
  stoppedOscillators: number;
  resume(): Promise<void>;
  createGain(): FakeNode;
  createConvolver(): FakeNode;
  createOscillator(): FakeNode;
  createBiquadFilter(): FakeNode;
  createBuffer(): { getChannelData(): Float32Array };
  createBufferSource(): FakeNode;
}

function makeFake(): FakeAudioContextState {
  singleton = {
    sampleRate: 44100,
    currentTime: 0,
    state: 'suspended',
    destination: new FakeNode(),
    startedOscillators: 0,
    stoppedOscillators: 0,
    resume() {
      this.state = 'running';
      return Promise.resolve();
    },
    createGain() {
      return new FakeNode();
    },
    createConvolver() {
      return new FakeNode();
    },
    createOscillator() {
      const node = new FakeNode();
      node.start = () => {
        this.startedOscillators += 1;
      };
      node.stop = () => {
        this.stoppedOscillators += 1;
      };
      return node;
    },
    createBiquadFilter() {
      return new FakeNode();
    },
    createBuffer() {
      return { getChannelData: () => new Float32Array(8) };
    },
    createBufferSource() {
      return new FakeNode();
    },
  };
  return singleton;
}

function FakeAudioContext() {
  return singleton ?? makeFake();
}

describe('BowlSynthesizer rim drone', () => {
  let fake: FakeAudioContextState;

  beforeEach(async () => {
    __resetAudioForTests();
    stopAllRims();
    fake = makeFake();
    (globalThis as Record<string, unknown>).window = { AudioContext: FakeAudioContext };
    await unlockAudioContext();
    fake.startedOscillators = 0;
    fake.stoppedOscillators = 0;
  });

  it('startRim launches sustained oscillators and stopRim stops them with a fade', () => {
    startRim('bowl-a', 440, 'bronze');
    // Bronze has 4 partial ratios => 4 oscillators for the rim voice.
    expect(fake.startedOscillators).toBe(4);

    updateRim('bowl-a', 0.6);
    updateRim('bowl-a', 1.0, 528);

    stopRim('bowl-a');
    expect(fake.stoppedOscillators).toBe(4);
  });

  it('stopRim is idempotent and unknown keys are ignored', () => {
    stopRim('does-not-exist');
    startRim('x', 220, 'quartz');
    // Quartz has 4 partial ratios.
    expect(fake.startedOscillators).toBe(4);
    stopRim('x');
    stopRim('x');
    expect(fake.stoppedOscillators).toBe(4);
  });

  it('strikeBowl still works and does not throw', () => {
    const handle = strikeBowl(440, 'bronze', 0.8);
    handle.stop();
    expect(handle).toBeTruthy();
  });
});
