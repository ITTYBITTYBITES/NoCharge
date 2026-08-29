import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// The module under test reads `window.AudioContext` lazily (inside a gesture),
// so we must NOT set up the fake until after we assert that nothing was created
// at import time.
import {
  getAudioContext,
  getCurrentContext,
  isAudioUnlocked,
  unlockAudioContext,
  getDryBus,
  getWetBus,
  __resetAudioForTests,
} from './AudioContextManager.js';

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

// Shared singleton fake so `new FakeAudioContext()` and the instance we inspect
// are the same object.
let singleton: FakeAudioContextState | null = null;

interface FakeAudioContextState {
  sampleRate: number;
  currentTime: number;
  state: string;
  destination: FakeNode;
  createdGains: number;
  createdConvolvers: number;
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
    createdGains: 0,
    createdConvolvers: 0,
    resume() {
      this.state = 'running';
      return Promise.resolve();
    },
    createGain() {
      this.createdGains += 1;
      return new FakeNode();
    },
    createConvolver() {
      this.createdConvolvers += 1;
      return new FakeNode();
    },
    createOscillator() {
      return new FakeNode();
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

describe('AudioContextManager deferred initialization', () => {
  let fake: FakeAudioContextState;

  beforeEach(() => {
    __resetAudioForTests();
    fake = makeFake();
    (globalThis as Record<string, unknown>).window = {
      AudioContext: FakeAudioContext,
      webkitAudioContext: FakeAudioContext,
    };
  });

  afterEach(() => {
    __resetAudioForTests();
    delete (globalThis as Record<string, unknown>).window;
  });

  it('does not create an AudioContext at module load or on simple access', () => {
    // getCurrentContext / isAudioUnlocked must not instantiate the context.
    expect(getCurrentContext()).toBeNull();
    expect(isAudioUnlocked()).toBe(false);
    expect(fake.createdGains).toBe(0);
  });

  it('instantiates and resumes the context inside getAudioContext()', async () => {
    expect(getCurrentContext()).toBeNull();
    const ctx = await getAudioContext();
    expect(ctx).toBe(fake);
    expect(fake.state).toBe('running');
    // Master + dry + wet gain nodes built.
    expect(fake.createdGains).toBeGreaterThanOrEqual(3);
    expect(fake.createdConvolvers).toBe(1);
    expect(isAudioUnlocked()).toBe(true);
  });

  it('unlockAudioContext() is a gesture entry point that resumes the graph', async () => {
    const ctx = await unlockAudioContext();
    expect(ctx).toBe(fake);
    expect(fake.state).toBe('running');
    // Dry/wet buses are available for voices.
    expect(getDryBus()).toBeTruthy();
    expect(getWetBus()).toBeTruthy();
  });
});
