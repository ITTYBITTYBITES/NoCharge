import type { PauseReason } from './types';

export type PauseEnvironment = {
  documentVisible: boolean;
  consentModalOpen: boolean;
};

/**
 * Resolve only pause reasons that a visible Resume control can safely clear.
 * Active browser and consent blockers remain independent.
 */
export function pauseReasonsAfterResumeRequest(
  reasons: ReadonlySet<PauseReason>,
  environment: PauseEnvironment,
): Set<PauseReason> {
  const remaining = new Set(reasons);
  remaining.delete('player');
  if (environment.documentVisible) remaining.delete('hidden');
  if (!environment.consentModalOpen) remaining.delete('consent');
  return remaining;
}

export function resumeBlockedMessage(
  reasons: ReadonlySet<PauseReason>,
  environment: PauseEnvironment,
): string {
  if (reasons.has('consent') && environment.consentModalOpen) {
    return 'Close Privacy choices before resuming the game.';
  }
  if (reasons.has('hidden') && !environment.documentVisible) {
    return 'Return to this tab before resuming the game.';
  }
  return 'The game is still paused by the browser.';
}

/** Call a controller at most once for a transition from paused to unblocked. */
export function resumeControllerIfReady(
  controller: { resume(): void },
  wasPaused: boolean,
  remainingReasons: ReadonlySet<PauseReason>,
): boolean {
  if (!wasPaused || remainingReasons.size > 0) return false;
  controller.resume();
  return true;
}

/** Install browser recovery fallbacks and return their complete cleanup. */
export function addVisibleRecoveryListeners(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  listener: EventListener,
): () => void {
  target.addEventListener('focus', listener);
  target.addEventListener('pageshow', listener);
  return () => {
    target.removeEventListener('focus', listener);
    target.removeEventListener('pageshow', listener);
  };
}
