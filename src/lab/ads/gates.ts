/**
 * Ad-time gates: the three things that must stop while a full-screen video ad
 * plays, and the only three things allowed to restart afterwards.
 *
 * 1. The render loop  — `requestAnimationFrame`
 * 2. Audio            — Web Audio `AudioContext`
 * 3. Input            — keyboard, pointer, touch, wheel
 *
 * Each gate is idempotent and reference-counted where it matters, because an ad
 * may be interrupted by the tab going hidden, by the consent dialog, or by a
 * second request that is already in flight.
 */

import { getSharedAudioGraph, setMasterGain } from '../../games/shared/audio/engine';
import { suspendAmbientForVisibility, resumeAmbientAfterVisibility } from '../../games/shared/audio/ambient';
import type { SharedAudioGraph } from '../../games/shared/audio/engine';

/* ------------------------------------------------------------------ audio -- */

export interface AudioGate {
  /** Silence everything for the duration of the ad. Idempotent, nestable. */
  suppress(): void;
  /** Return to the exact state captured by `suppress()`. Idempotent. */
  restore(): void;
  isSuppressed(): boolean;
}

type CapturedAudio = {
  gain: number;
  contextState: AudioContextState;
  ambientWasRunning: boolean;
};

/**
 * Ducks and suspends the shared Web Audio graph.
 *
 * Two steps are required and neither is sufficient alone:
 *  - Ramping the master gain to zero only silences it. The context keeps
 *    running, oscillators keep burning CPU, and a video ad competing for the
 *    same audio device can still produce a click on the way out.
 *  - Suspending the context without the ramp cuts audio abruptly, which is
 *    audible as a pop on every transition.
 *
 * So: ramp first, then suspend once the ramp has had time to land.
 */
export function createWebAudioGate(
  getGraph: () => SharedAudioGraph | null = getSharedAudioGraph,
): AudioGate {
  let captured: CapturedAudio | null = null;
  let depth = 0;
  let suspendTimer: number | null = null;

  return {
    suppress() {
      depth += 1;
      if (depth > 1) return;

      const graph = getGraph();
      const ambientWasRunning = suspendAmbientForVisibility();

      if (!graph) {
        captured = { gain: 1, contextState: 'closed', ambientWasRunning };
        return;
      }

      captured = {
        gain: graph.masterGain.gain.value,
        contextState: graph.context.state,
        ambientWasRunning,
      };

      // Short ramp: long enough to avoid a click, short enough that a player
      // never hears game audio under the first frame of the ad.
      setMasterGain(graph, 0, 0.02);

      if (graph.context.state === 'running') {
        suspendTimer = window.setTimeout(() => {
          suspendTimer = null;
          void graph.context.suspend().catch(() => undefined);
        }, 40);
      }
    },

    restore() {
      if (depth === 0) return;
      depth -= 1;
      if (depth > 0) return;

      if (suspendTimer !== null) {
        window.clearTimeout(suspendTimer);
        suspendTimer = null;
      }

      const snapshot = captured;
      captured = null;
      const graph = getGraph();

      // Only restart a context that was running before the ad. Resuming a
      // suspended-by-policy context here would be an autoplay violation and the
      // browser would simply refuse.
      if (graph && snapshot?.contextState === 'running' && graph.context.state === 'suspended') {
        void graph.context.resume().catch(() => undefined);
      }
      if (graph && snapshot) {
        setMasterGain(graph, snapshot.gain, 0.05);
      }
      if (snapshot?.ambientWasRunning) {
        try {
          resumeAmbientAfterVisibility();
        } catch {
          /* A soundscape that cannot restart is not worth failing the resume. */
        }
      }
    },

    isSuppressed() {
      return depth > 0;
    },
  };
}

/** Gate used in unit tests and when no audio graph exists. */
export function createMemoryAudioGate(): AudioGate & { calls: string[] } {
  const calls: string[] = [];
  let depth = 0;
  return {
    calls,
    suppress() {
      depth += 1;
      calls.push('suppress');
    },
    restore() {
      if (depth === 0) return;
      depth -= 1;
      calls.push('restore');
    },
    isSuppressed() {
      return depth > 0;
    },
  };
}

/* ------------------------------------------------------------------ input -- */

/** Events that must not reach the canvas while an ad owns the screen. */
const GATED_EVENTS = [
  'keydown',
  'keyup',
  'keypress',
  'pointerdown',
  'pointerup',
  'pointermove',
  'touchstart',
  'touchmove',
  'touchend',
  'wheel',
  'contextmenu',
] as const;

export interface InputGate {
  suspend(): void;
  resume(): void;
  isSuspended(): boolean;
}

/**
 * Swallows input in the capture phase.
 *
 * Capture matters: game listeners are attached to the canvas or document, and a
 * bubble-phase blocker would fire after the game had already handled the event.
 * `stopImmediatePropagation()` in capture means the game never sees it.
 *
 * Focus is never moved. Stealing focus from the ad's own close button would
 * make the ad non-dismissible, which is a policy problem, not just a UX one.
 */
export function createInputGate(target: EventTarget = window): InputGate {
  let suspended = false;

  const swallow = (event: Event) => {
    if (!suspended) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  return {
    suspend() {
      if (suspended) return;
      suspended = true;
      for (const type of GATED_EVENTS) {
        target.addEventListener(type, swallow, { capture: true, passive: false });
      }
    },
    resume() {
      if (!suspended) return;
      suspended = false;
      for (const type of GATED_EVENTS) {
        target.removeEventListener(type, swallow, { capture: true });
      }
    },
    isSuspended() {
      return suspended;
    },
  };
}
