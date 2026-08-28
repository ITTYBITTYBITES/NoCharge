import { describe, expect, it } from 'vitest';
import {
  AMBIENT_CATALOG,
  AMBIENT_NAMES,
  isAmbientName,
  normalizeAmbientName,
} from './catalog';

describe('procedural ambient catalogue', () => {
  it('publishes eleven current soundscapes and no retired drone/cafe entries', () => {
    expect(AMBIENT_CATALOG).toHaveLength(11);
    expect(AMBIENT_NAMES).toHaveLength(12);
    expect(AMBIENT_NAMES).toContain('room-murmur');
    expect(AMBIENT_NAMES).toContain('pink-noise');
    expect(AMBIENT_NAMES).toContain('brown-noise');
    expect(AMBIENT_NAMES).not.toContain('cafe');
    expect(AMBIENT_NAMES).not.toContain('drone');
  });

  it('keeps old saved selections valid without keeping them in the UI catalogue', () => {
    expect(normalizeAmbientName('cafe')).toBe('room-murmur');
    expect(normalizeAmbientName('drone')).toBe('none');
    expect(normalizeAmbientName('not-a-soundscape')).toBe('none');
    expect(isAmbientName('room-murmur')).toBe(true);
    expect(isAmbientName('cafe')).toBe(false);
  });
});
