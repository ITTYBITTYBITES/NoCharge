import { describe, expect, it } from 'vitest';
import { fillColoredNoise } from './noise';

function meanSquare(samples: Float32Array): number {
  return samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length;
}

function bandEnergy(samples: Float32Array, frequency: number, sampleRate = 44100): number {
  let real = 0;
  let imaginary = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const phase = (2 * Math.PI * frequency * index) / sampleRate;
    real += samples[index]! * Math.cos(phase);
    imaginary += samples[index]! * Math.sin(phase);
  }
  return (real * real + imaginary * imaginary) / samples.length ** 2;
}

describe('colored procedural noise', () => {
  it('generates independent stereo seeds for the fallback path', () => {
    const left = new Float32Array(2048);
    const right = new Float32Array(2048);
    fillColoredNoise(left, 'white', 11);
    fillColoredNoise(right, 'white', 29);
    expect(Array.from(left)).not.toEqual(Array.from(right));
    expect(meanSquare(left)).toBeGreaterThan(0);
    expect(meanSquare(right)).toBeGreaterThan(0);
  });

  it('uses a pinking filter whose low-band energy exceeds its high-band energy', () => {
    const samples = new Float32Array(32768);
    fillColoredNoise(samples, 'pink', 12345);
    expect(bandEnergy(samples, 180)).toBeGreaterThan(bandEnergy(samples, 7200));
  });

  it('keeps brown noise finite and bounded rather than accumulating DC forever', () => {
    const samples = new Float32Array(32768);
    fillColoredNoise(samples, 'brown', 54321);
    expect(samples.every(Number.isFinite)).toBe(true);
    expect(meanSquare(samples.slice(-4096))).toBeLessThan(1);
  });
});
