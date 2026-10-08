import { t, type MessageKey } from '../../i18n/messages';
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

/** Message key explaining why Resume cannot clear the pause yet. */
export function resumeBlockedKey(
  reasons: ReadonlySet<PauseReason>,
  environment: PauseEnvironment,
): MessageKey {
  if (reasons.has('consent') && environment.consentModalOpen) {
    return 'game.resumeBlockedConsent';
  }
  if (reasons.has('hidden') && !environment.documentVisible) {
    return 'game.resumeBlockedHidden';
  }
  // An ad is the one pause a Resume control must never clear. The visitor did
  // not create it and cannot end it from the game's own chrome; only the ad's
  // dismissal may lift it.
  if (reasons.has('ad')) {
    return 'game.resumeBlockedAd';
  }
  return 'game.resumeBlockedBrowser';
}

/** English text for `resumeBlockedKey`; the shell uses the key and the active locale. */
export function resumeBlockedMessage(
  reasons: ReadonlySet<PauseReason>,
  environment: PauseEnvironment,
): string {
  return t('en', resumeBlockedKey(reasons, environment));
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
