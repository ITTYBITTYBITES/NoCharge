/**
 * Lab HUD — the minimal chrome that stays on screen during full-screen play.
 *
 * Three affordances, and no more:
 *
 *  - **Return to calm** — the way out. Always first in the DOM order and always
 *    visible; a player who has had enough must never have to hunt for it.
 *  - **FPS** — a diagnostic, not decoration. For demo builds it is the whole
 *    point: a prototype that drops frames is information.
 *  - **Mute** — the calm site's commitment is that one control silences
 *    everything. Lab prototypes inherit that promise.
 *
 * Behaviour:
 *  - The HUD auto-fades after `idleMs` and returns on any input, so it never
 *    covers the action. Reduced-motion users get an opacity change instead of a
 *    slide.
 *  - Auto-fade never hides the HUD while it contains focus. Hiding a focused
 *    control is a WCAG 2.4.7 failure, not a style choice.
 *  - Escape is bound here rather than in the game so every prototype exits the
 *    same way, even ones that use the arrow keys.
 */

import type { Loop } from '../loop/raf-loop';

export interface LabHudOptions {
  root: HTMLElement;
  /** Sampled for the FPS readout. */
  loop: Loop;
  /** Calm destination. Defaults to `/`. */
  exitHref?: string;
  /** Called instead of navigating, when the host wants to intercept. */
  onExit?: (event: Event) => void;
  onToggleMute?: (muted: boolean) => void;
  isMuted?: () => boolean;
  /** Idle delay before fading, in ms. Default 2600. */
  idleMs?: number;
}

export interface LabHud {
  /** Force the HUD visible and restart the idle timer. */
  wake(): void;
  /** Stop timers and release listeners. */
  destroy(): void;
}

const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'focusin'] as const;

export function createLabHud(options: LabHudOptions): LabHud {
  const { root, loop } = options;
  const idleMs = options.idleMs ?? 2600;

  const exitLink = root.querySelector<HTMLAnchorElement>('[data-lab-hud="exit"]');
  const muteButton = root.querySelector<HTMLButtonElement>('[data-lab-hud="mute"]');
  const fpsOutput = root.querySelector<HTMLElement>('[data-lab-hud="fps"]');
  const statusOutput = root.querySelector<HTMLElement>('[data-lab-hud="status"]');

  if (exitLink && options.exitHref) exitLink.href = options.exitHref;

  let idleTimer: number | null = null;
  let fpsTimer: number | null = null;
  let destroyed = false;

  const announce = (message: string) => {
    if (statusOutput) statusOutput.textContent = message;
  };

  const tickFps = () => {
    if (destroyed || !fpsOutput) return;
    // Two updates a second. Writing the DOM every frame would itself cost
    // frames, and nobody can read a number changing 60 times a second.
    fpsOutput.textContent = String(loop.fps());
  };

  const show = () => {
    root.classList.remove('is-hud-idle');
    if (idleTimer !== null) window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      // Never hide a focused control.
      if (root.contains(document.activeElement)) return;
      root.classList.add('is-hud-idle');
    }, idleMs);
  };

  const onActivity = () => show();

  const onMuteClick = () => {
    const next = !(options.isMuted?.() ?? false);
    options.onToggleMute?.(next);
    if (muteButton) {
      muteButton.setAttribute('aria-pressed', String(next));
      muteButton.textContent = next ? 'Unmute' : 'Mute';
      muteButton.setAttribute('aria-label', next ? 'Unmute game sound' : 'Mute game sound');
    }
    announce(next ? 'Sound muted.' : 'Sound unmuted.');
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (options.onExit) {
      event.preventDefault();
      options.onExit(event);
    }
    // Without `onExit` the anchor's own href handles it: Escape moves focus to
    // the exit link and the default action follows it.
    exitLink?.focus({ preventScroll: true });
  };

  for (const type of ACTIVITY_EVENTS) {
    window.addEventListener(type, onActivity, { passive: true });
  }
  muteButton?.addEventListener('click', onMuteClick);
  document.addEventListener('keydown', onKeyDown);
  fpsTimer = window.setInterval(tickFps, 500);

  if (muteButton && options.isMuted) {
    const muted = options.isMuted();
    muteButton.setAttribute('aria-pressed', String(muted));
    muteButton.textContent = muted ? 'Unmute' : 'Mute';
  }

  show();

  return {
    wake: show,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const type of ACTIVITY_EVENTS) {
        window.removeEventListener(type, onActivity);
      }
      muteButton?.removeEventListener('click', onMuteClick);
      document.removeEventListener('keydown', onKeyDown);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      if (fpsTimer !== null) window.clearInterval(fpsTimer);
    },
  };
}
