import { describe, expect, it } from 'vitest';
import { AMBIENT_CATALOG, type AmbientName } from './catalog';
import { ProceduralSoundscape } from './ambient-voices';

class FakeParam {
  value = 0;
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
  cancelScheduledValues() {}
}

class FakeNode {
  gain = new FakeParam();
  frequency = new FakeParam();
  detune = new FakeParam();
  Q = new FakeParam();
  pan = new FakeParam();
  type = 'sine';
  buffer: unknown;
  loop = false;
  connect() { return this; }
  disconnect() {}
  start() {}
  stop() {}
}

class FakeContext {
  currentTime = 0;
  sampleRate = 44100;
  destination = new FakeNode();
  createGain() { return new FakeNode() as unknown as GainNode; }
  createOscillator() { return new FakeNode() as unknown as OscillatorNode; }
  createBiquadFilter() { return new FakeNode() as unknown as BiquadFilterNode; }
  createBufferSource() { return new FakeNode() as unknown as AudioBufferSourceNode; }
  createBuffer(_channels: number, length: number) {
    const channels = [new Float32Array(length), new Float32Array(length)];
    return { getChannelData: (channel: number) => channels[channel]!, } as unknown as AudioBuffer;
  }
}

describe('procedural soundscape voice graph', () => {
  it('can construct and tear down every soundscape with a minimal Web Audio implementation', () => {
    const context = new FakeContext() as unknown as AudioContext;
    for (const texture of AMBIENT_CATALOG) {
      const soundscape = new ProceduralSoundscape(context, texture.id as Exclude<AmbientName, 'none'>);
      soundscape.start();
      soundscape.fadeTo(1, 0.1);
      soundscape.stop(0);
    }
    expect(true).toBe(true);
  });
});
