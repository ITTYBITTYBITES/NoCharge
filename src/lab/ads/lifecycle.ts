/**
 * Ad lifecycle orchestrator.
 *
 * This is the single place where "an ad is on screen" is a known state. The
 * guarantee it makes: for the entire time a full-screen ad is playing, the game
 * is not simulating, not drawing, not making sound, and not receiving input —
 * and when the ad ends, exactly the state that was running before is restored,
 * nothing more.
 *
 * Design rules encoded here:
 *
 *  - `finally`, not `then`. An ad SDK that throws, rejects, or never settles
 *    must not leave the game permanently frozen with input swallowed.
 *  - The loop only restarts if it was running. Starting a loop that was already
 *    paused by the player, by a hidden tab, or by the consent dialog would
 *    silently override a pause the user asked for.
 *  - Rewarded ads are always user-initiated. Nothing in this module may trigger
 *    an ad on its own; `playRewarded` is only reachable from a player tap.
 *  - A denied or failed ad is never an error the player has to dismiss. The
 *    caller receives a reason and the UI simply continues.
 */

import type { Loop } from '../loop/raf-loop';
import type { AudioGate, InputGate } from './gates';
import type { RewardedProvider, RewardOutcome } from './providers';

export interface AdLifecycleDeps {
  loop: Loop;
  audio: AudioGate;
  input: InputGate;
  /** Called once when the ad-safe state is entered, before the ad is shown. */
  onBeforeAd?: (placement: string) => void;
  /** Called once after the gates are released, whatever the outcome. */
  onAfterAd?: (placement: string, outcome: RewardOutcome | null) => void;
}

export interface AdLifecycle {
  /** True while an ad owns the screen. */
  isShowingAd(): boolean;
  /**
   * Run a rewarded ad to completion behind the gates.
   *
   * Resolves rather than rejects for every expected denial. Only a throw from
   * the provider itself propagates, and the gates are still released.
   */
  playRewarded(provider: RewardedProvider, placement: string): Promise<RewardOutcome>;
  /** Manually hold the gates (used by interstitial surfaces and tests). */
  hold(): void;
  release(): void;
}

export function createAdLifecycle(deps: AdLifecycleDeps): AdLifecycle {
  const { loop, audio, input } = deps;
  let active = false;
  /** Whether the loop owed a restart when the ad is over. */
  let restartLoop = false;

  const hold = () => {
    if (active) return;
    active = true;
    // Remember before stopping: `loop.stop()` clears the running flag, so the
    // decision to resume has to be made here or it is lost.
    restartLoop = loop.isRunning();
    // Order is deliberate: stop accepting input first, then silence, then stop
    // drawing. Reversed order would let one last frame render a player death
    // from a keypress that arrived during the ad transition.
    input.suspend();
    audio.suppress();
    loop.stop();
  };

  const release = () => {
    if (!active) return;
    active = false;
    const shouldRestart = restartLoop;
    restartLoop = false;
    // Reverse order — and only restart the loop if it was actually running.
    // Starting a loop that the player, a hidden tab, or the consent dialog had
    // already paused would silently override a pause the user asked for.
    if (shouldRestart) loop.start();
    audio.restore();
    input.resume();
  };

  return {
    isShowingAd() {
      return active;
    },
    hold,
    release,
    async playRewarded(provider, placement) {
      if (active) {
        return { granted: false, placement, reason: 'unavailable' as const };
      }

      hold();
      deps.onBeforeAd?.(placement);

      let outcome: RewardOutcome | null = null;
      try {
        outcome = await provider.show(placement);
      } catch {
        outcome = { granted: false, placement, reason: 'error' as const };
      } finally {
        // `release()` already handles the "was it running?" question, so this
        // is safe whether or not the provider settled normally.
        release();
        deps.onAfterAd?.(placement, outcome);
      }

      return outcome ?? { granted: false, placement, reason: 'error' as const };
    },
  };
}
