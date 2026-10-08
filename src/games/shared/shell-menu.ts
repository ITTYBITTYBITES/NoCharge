export type ShellMenuState = 'closed' | 'open';

export function nextMenuState(current: ShellMenuState, action: 'toggle' | 'open' | 'close'): ShellMenuState {
  if (action === 'open') return 'open';
  if (action === 'close') return 'closed';
  return current === 'open' ? 'closed' : 'open';
}

export function shouldIgnoreGameplayWhileMenuOpen(menu: ShellMenuState): boolean {
  return menu === 'open';
}

export interface FocusModeLabels {
  exitFullScreen: string;
  exitFocusMode: string;
  enterFullScreen: string;
  focusMode: string;
}

/** English defaults. The shell passes labels for the active locale. */
export const ENGLISH_FOCUS_MODE_LABELS: FocusModeLabels = {
  exitFullScreen: 'Exit full screen',
  exitFocusMode: 'Exit focus mode',
  enterFullScreen: 'Enter full screen',
  focusMode: 'Focus mode',
};

export function focusModeLabel(
  nativeSupported: boolean,
  active: boolean,
  immersive: boolean,
  labels: FocusModeLabels = ENGLISH_FOCUS_MODE_LABELS,
): {
  text: string;
  aria: string;
} {
  if (active && !immersive) return { text: labels.exitFullScreen, aria: labels.exitFullScreen };
  if (immersive) return { text: labels.exitFocusMode, aria: labels.exitFocusMode };
  if (nativeSupported) return { text: labels.enterFullScreen, aria: labels.enterFullScreen };
  return { text: labels.focusMode, aria: labels.focusMode };
}
