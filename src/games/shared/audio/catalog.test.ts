import { describe, expect, it } from 'vitest';
import {
  AMBIENT_CATALOG,
  AMBIENT_NAMES,
  isAmbientName,
  normalizeAmbientName,
} from './catalog';

describe('procedural ambient catalogue', () => {
  it('publishes ten current calm soundscapes and no retired entries', () => {
    expect(AMBIENT_CATALOG).toHaveLength(10);
    expect(AMBIENT_NAMES).toHaveLength(11);
    expect(AMBIENT_NAMES).toContain('meadow-morning');
    expect(AMBIENT_NAMES).toContain('floating-pads');
    expect(AMBIENT_NAMES).toContain('singing-bowls');
    expect(AMBIENT_NAMES).toContain('music-box-drift');
    expect(AMBIENT_NAMES).not.toContain('lofi');
    expect(AMBIENT_NAMES).not.toContain('white-noise');
    expect(AMBIENT_NAMES).not.toContain('cafe');
    expect(AMBIENT_NAMES).not.toContain('drone');
  });

  it('keeps old saved selections valid without keeping them in the UI catalogue', () => {
    expect(normalizeAmbientName('lofi')).toBe('kalimba-lullaby');
    expect(normalizeAmbientName('rainfall')).toBe('mountain-stream');
    expect(normalizeAmbientName('forest')).toBe('pine-forest');
    expect(normalizeAmbientName('ocean')).toBe('ocean-shore');
    expect(normalizeAmbientName('night')).toBe('summer-night');
    expect(normalizeAmbientName('white-noise')).toBe('floating-pads');
    expect(normalizeAmbientName('cafe')).toBe('floating-pads');
    expect(normalizeAmbientName('drone')).toBe('floating-pads');
    expect(normalizeAmbientName('not-a-soundscape')).toBe('none');
    expect(isAmbientName('meadow-morning')).toBe(true);
    expect(isAmbientName('lofi')).toBe(false);
  });
});
