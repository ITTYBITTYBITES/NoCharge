/**
 * Fixed-timestep render loop — the single piece of runtime infrastructure the
 * current Quiet Arcade does not have.
 *
 * Every game in `src/games/` is DOM-based and turn-based or untimed: there is
 * no `requestAnimationFrame` loop anywhere in the repository today. High-
 * intensity prototypes need one, and they need it to be pausable by the same
 * shared shell that already pauses DOM games (page hidden, consent modal, now
 * ad playback).
 *
 * Contract:
 *  - `update()` runs on a fixed step so physics is frame-rate independent.
 *  - `render()` runs once per animation frame with an interpolation alpha.
 *  - `stop()` cancels the pending frame. Nothing schedules work after it
 *    returns, which is what the ad lifecycle depends on.
 */

export interface LoopCallbacks {
  /** Advance simulation by exactly `step` seconds. */
  update(step: number): void;
  /** Draw. `alpha` is the 0–1 remainder between the last two updates. */
  render(alpha: number): void;
}

export interface LoopOptions {
  /** Fixed simulation step in seconds. Default 1/60. */
  step?: number;
  /** Clamp for a single frame's elapsed time. Default 0.25s. */
  maxFrame?: number;
  /** Injectable scheduler for tests. */
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
  now?: () => number;
}

export interface Loop {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  /** Smoothed frames-per-second, for the HUD counter. */
  fps(): number;
  destroy(): void;
}

const DEFAULT_STEP = 1 / 60;
const DEFAULT_MAX_FRAME = 0.25;
const FPS_SMOOTHING = 0.1;

export function createLoop(callbacks: LoopCallbacks, options: LoopOptions = {}): Loop {
  const step = options.step ?? DEFAULT_STEP;
  const maxFrame = options.maxFrame ?? DEFAULT_MAX_FRAME;
  const requestFrame =
    options.requestFrame ?? ((cb: FrameRequestCallback) => requestAnimationFrame(cb));
  const cancelFrame = options.cancelFrame ?? ((handle: number) => cancelAnimationFrame(handle));
  const now = options.now ?? (() => performance.now());

  let handle: number | null = null;
  let last = 0;
  let accumulator = 0;
  let smoothedFps = 0;

  const frame = (timestamp: number) => {
    handle = null;
    if (destroyed) return;

    const elapsedMs = Math.max(0, timestamp - last);
    last = timestamp;
    const elapsed = Math.min(elapsedMs / 1000, maxFrame);

    // A real frame rate estimate has to come from wall-clock time, not from the
    // clamped simulation delta, or the HUD lies during a long stall.
    if (elapsedMs > 0) {
      const instant = 1000 / elapsedMs;
      smoothedFps = smoothedFps === 0 ? instant : smoothedFps + (instant - smoothedFps) * FPS_SMOOTHING;
    }

    accumulator += elapsed;
    while (accumulator >= step) {
      callbacks.update(step);
      accumulator -= step;
    }
    callbacks.render(accumulator / step);

    schedule();
  };

  const schedule = () => {
    if (destroyed || handle !== null) return;
    handle = requestFrame(frame);
  };

  let destroyed = false;

  return {
    start() {
      if (destroyed || handle !== null) return;
      // Reset the clock so the gap between stop() and start() is not simulated
      // as one enormous frame. Without this, resuming from an ad replays a
      // quarter second of simulation instantly and the player dies on resume.
      last = now();
      accumulator = 0;
      schedule();
    },
    stop() {
      if (handle !== null) {
        cancelFrame(handle);
        handle = null;
      }
      // Drop the accumulated remainder. Resuming mid-step would otherwise
      // double-simulate the frames that elapsed during the pause.
      accumulator = 0;
    },
    isRunning() {
      return handle !== null;
    },
    fps() {
      return Math.round(smoothedFps);
    },
    destroy() {
      destroyed = true;
      if (handle !== null) {
        cancelFrame(handle);
        handle = null;
      }
      smoothedFps = 0;
    },
  };
}
