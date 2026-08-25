export type ShellMenuState = 'closed' | 'open';

export function nextMenuState(current: ShellMenuState, action: 'toggle' | 'open' | 'close'): ShellMenuState {
  if (action === 'open') return 'open';
  if (action === 'close') return 'closed';
  return current === 'open' ? 'closed' : 'open';
}

export function shouldIgnoreGameplayWhileMenuOpen(menu: ShellMenuState): boolean {
  return menu === 'open';
}

export function focusModeLabel(nativeSupported: boolean, active: boolean, immersive: boolean): {
  text: string;
  aria: string;
} {
  if (active && !immersive) return { text: 'Exit full screen', aria: 'Exit full screen' };
  if (immersive) return { text: 'Exit focus mode', aria: 'Exit focus mode' };
  if (nativeSupported) return { text: 'Enter full screen', aria: 'Enter full screen' };
  return { text: 'Focus mode', aria: 'Expand game into focus mode' };
}
