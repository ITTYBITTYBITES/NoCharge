import { describe, expect, test } from 'vitest';

import { INITIAL_PLAYER_COLOR, selectColorDirectly, type ColorId } from './color-selection';

describe('Color Flip direct color selection', () => {
  test.each([
    ['green', 'green'],
    ['blue', 'blue'],
    ['amber', 'amber'],
    ['rose', 'rose'],
  ] satisfies Array<[ColorId, ColorId]>)('selecting %s sets %s', (requested, expected) => {
    expect(selectColorDirectly('rose', requested)).toBe(expected);
  });

  test('selecting the active color leaves it active', () => {
    expect(selectColorDirectly('green', 'green')).toBe('green');
  });

  test.each([
    ['green', 'amber'],
    ['blue', 'amber'],
    ['rose', 'amber'],
  ] satisfies Array<[ColorId, ColorId]>)('selecting Amber does not depend on previous color %s', (previous, requested) => {
    expect(selectColorDirectly(previous, requested)).toBe('amber');
  });

  test('blocked input cannot change the selected color', () => {
    expect(selectColorDirectly('rose', 'blue', false)).toBe('rose');
  });

  test('a restarted visual run defaults to Green', () => {
    expect(INITIAL_PLAYER_COLOR).toBe('green');
  });
});
