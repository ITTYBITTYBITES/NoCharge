import { describe, expect, it } from 'vitest';
import { focusModeLabel, nextMenuState, shouldIgnoreGameplayWhileMenuOpen } from './shell-menu';

describe('shared shell menu state', () => {
  it('toggles, opens, and closes', () => {
    expect(nextMenuState('closed', 'toggle')).toBe('open');
    expect(nextMenuState('open', 'toggle')).toBe('closed');
    expect(nextMenuState('closed', 'open')).toBe('open');
    expect(nextMenuState('open', 'close')).toBe('closed');
  });

  it('blocks gameplay input while the menu is open', () => {
    expect(shouldIgnoreGameplayWhileMenuOpen('open')).toBe(true);
    expect(shouldIgnoreGameplayWhileMenuOpen('closed')).toBe(false);
  });

  it('labels native fullscreen versus focus mode', () => {
    expect(focusModeLabel(true, false, false).text).toBe('Enter full screen');
    expect(focusModeLabel(false, false, false).text).toBe('Focus mode');
    expect(focusModeLabel(false, false, true).text).toBe('Exit focus mode');
    expect(focusModeLabel(true, true, false).text).toBe('Exit full screen');
  });
});
