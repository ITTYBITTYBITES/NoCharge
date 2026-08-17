import { describe, expect, test, vi } from 'vitest';

import {
  addVisibleRecoveryListeners,
  pauseReasonsAfterResumeRequest,
  resumeBlockedMessage,
  resumeControllerIfReady,
  type PauseEnvironment,
} from './pause-recovery';
import type { PauseReason } from './types';

const visible: PauseEnvironment = { documentVisible: true, consentModalOpen: false };
const reasons = (...values: PauseReason[]) => new Set(values);

describe('shared game pause recovery', () => {
  test('a Resume request clears a manual pause', () => {
    expect(pauseReasonsAfterResumeRequest(reasons('player'), visible)).toEqual(reasons());
  });

  test('a visible document recovers a stale hidden reason', () => {
    expect(pauseReasonsAfterResumeRequest(reasons('hidden'), visible)).toEqual(reasons());
  });

  test('a Resume request cannot clear hidden while the document is hidden', () => {
    const environment = { ...visible, documentVisible: false };
    const remaining = pauseReasonsAfterResumeRequest(reasons('hidden'), environment);
    expect(remaining).toEqual(reasons('hidden'));
    expect(resumeBlockedMessage(remaining, environment)).toBe('Return to this tab before resuming the game.');
  });

  test('a Resume request cannot bypass an open consent modal', () => {
    const environment = { ...visible, consentModalOpen: true };
    const remaining = pauseReasonsAfterResumeRequest(reasons('consent'), environment);
    expect(remaining).toEqual(reasons('consent'));
    expect(resumeBlockedMessage(remaining, environment)).toBe('Close Privacy choices before resuming the game.');
  });

  test('manual and hidden reasons resolve independently', () => {
    const whileHidden = pauseReasonsAfterResumeRequest(reasons('player', 'hidden'), {
      ...visible,
      documentVisible: false,
    });
    expect(whileHidden).toEqual(reasons('hidden'));
    expect(pauseReasonsAfterResumeRequest(whileHidden, visible)).toEqual(reasons());
  });

  test('consent and hidden reasons remain when both conditions are active', () => {
    expect(
      pauseReasonsAfterResumeRequest(reasons('consent', 'hidden'), {
        documentVisible: false,
        consentModalOpen: true,
      }),
    ).toEqual(reasons('consent', 'hidden'));
  });

  test('the controller resumes exactly once across repeated Resume requests', () => {
    let paused = true;
    const controller = {
      resume: vi.fn(() => {
        paused = false;
      }),
    };

    const firstRemaining = pauseReasonsAfterResumeRequest(reasons('player'), visible);
    expect(resumeControllerIfReady(controller, paused, firstRemaining)).toBe(true);
    const repeatedRemaining = pauseReasonsAfterResumeRequest(firstRemaining, visible);
    expect(resumeControllerIfReady(controller, paused, repeatedRemaining)).toBe(false);
    expect(controller.resume).toHaveBeenCalledTimes(1);
  });

  test('focus and pageshow recovery listeners are removed by cleanup', () => {
    const target = new EventTarget();
    const listener = vi.fn();
    const cleanup = addVisibleRecoveryListeners(target, listener);

    target.dispatchEvent(new Event('focus'));
    target.dispatchEvent(new Event('pageshow'));
    expect(listener).toHaveBeenCalledTimes(2);

    cleanup();
    target.dispatchEvent(new Event('focus'));
    target.dispatchEvent(new Event('pageshow'));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
