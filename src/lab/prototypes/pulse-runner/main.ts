/**
 * Pulse Runner — render layer and host integration.
 *
 * This is the reference implementation for how a Lab prototype connects to the
 * shared infrastructure: the fixed-timestep loop, the DPR-aware canvas, the HUD,
 * the ad lifecycle, and the shared `GameController` contract that lets the
 * regular game shell pause it.
 *
 * The single most important rule here: **the update function only reads state
 * and advances the engine.** Everything that can pause — the loop, the audio,
 * the input gate — is owned by the shell and the ad lifecycle, not by the game.
 */

import { createCanvasStage, fitAspect } from '../../loop/canvas-stage';
import { createLoop } from '../../loop/raf-loop';
import { createLabHud } from '../../hud/lab-hud';
import { createAdLifecycle } from '../../ads/lifecycle';
import { createWebAudioGate, createInputGate } from '../../ads/gates';
import { nullRewardedProvider } from '../../ads/providers';
import { createPulseRunnerEngine, PULSE_RUNNER_CONSTANTS } from './engine';
import type { GameController, PauseReason } from '../../../games/shared/types';

/** The playfield is letterboxed to this ratio so difficulty is device-independent. */
const STAGE_ASPECT = 9 / 16;

export function mountPulseRunner(root: HTMLElement): GameController {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-pulse-canvas]');
  const hudRoot = root.querySelector<HTMLElement>('[data-lab-hud]');
  const scoreOutput = root.querySelector<HTMLElement>('[data-pulse-score]');
  const overlay = root.querySelector<HTMLElement>('[data-pulse-overlay]');
  const continueButton = root.querySelector<HTMLButtonElement>('[data-pulse-continue]');
  const restartButton = root.querySelector<HTMLButtonElement>('[data-pulse-restart]');
  if (!canvas) throw new Error('Pulse Runner is missing its canvas.');

  const context = canvas.getContext('2d');
  const engine = createPulseRunnerEngine(Math.floor(Math.random() * 0xffffffff));

  let paused = false;
  let box = { width: 0, height: 0, offsetX: 0, offsetY: 0 };

  /* ---------------------------------------------------------------- input -- */

  const held = { left: false, right: false };
  const syncDirection = () => {
    engine.setDirection(held.left === held.right ? 0 : held.left ? -1 : 1);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' || event.key === 'a') {
      held.left = true;
      syncDirection();
    }
    if (event.key === 'ArrowRight' || event.key === 'd') {
      held.right = true;
      syncDirection();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' || event.key === 'a') held.left = false;
    if (event.key === 'ArrowRight' || event.key === 'd') held.right = false;
    syncDirection();
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  root.addEventListener('pointerdown', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-pulse-dir]');
    if (!target) return;
    const dir = target.dataset.pulseDir;
    if (dir === 'left') held.left = true;
    if (dir === 'right') held.right = true;
    syncDirection();
  });
  const releaseTouch = () => {
    held.left = false;
    held.right = false;
    syncDirection();
  };
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    root.addEventListener(type, releaseTouch);
  }

  /* --------------------------------------------------------------- render -- */

  const draw = () => {
    if (!context) return;
    const { width, height } = box;
    context.clearRect(0, 0, width, height);

    // Playfield.
    context.fillStyle = '#0a0a0c';
    context.fillRect(0, 0, width, height);

    const state = engine.state();

    // Hazards.
    context.fillStyle = '#ff2d6f';
    for (const hazard of state.hazards) {
      context.beginPath();
      context.arc(
        hazard.x * width,
        hazard.y * height,
        hazard.radius * Math.min(width, height),
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    // Player.
    context.fillStyle = '#ffb020';
    context.beginPath();
    context.arc(
      state.playerX * width,
      PULSE_RUNNER_CONSTANTS.PLAYER_Y * height,
      state.playerRadius * Math.min(width, height),
      0,
      Math.PI * 2,
    );
    context.fill();

    if (scoreOutput) scoreOutput.textContent = String(state.score);
    if (overlay) overlay.hidden = !state.over;
  };

  /* ----------------------------------------------------------------- loop -- */

  const loop = createLoop({
    update: (step) => engine.update(step),
    render: () => draw(),
  });

  const stage = createCanvasStage(canvas, {
    onResize: (size) => {
      // Letterbox to a fixed aspect so a 375px phone and a 2560px monitor get
      // the same difficulty, and the seam is invisible because the bars are
      // painted with the stage background.
      box = fitAspect(size, STAGE_ASPECT);
      draw();
    },
  });

  /* ----------------------------------------------------------- ad + shell -- */

  const lifecycle = createAdLifecycle({
    loop,
    audio: createWebAudioGate(),
    input: createInputGate(),
  });

  const hud = hudRoot
    ? createLabHud({
        root: hudRoot,
        loop,
        exitHref: '/',
        isMuted: () => false,
        onToggleMute: () => {},
      })
    : null;

  /**
   * Rewarded continue.
   *
   * The offer is only ever shown when a provider actually has a creative —
   * `nullRewardedProvider` resolves false, so with no network configured the
   * button is hidden rather than dangling. Promising a reward and then failing
   * to deliver it is the fastest way to make a player stop trusting the HUD.
   */
  const refreshContinueOffer = async () => {
    if (!continueButton) return;
    const canContinue = engine.canContinue();
    if (!canContinue) {
      continueButton.hidden = true;
      return;
    }
    const ready = await nullRewardedProvider.load('pulse-runner-continue');
    continueButton.hidden = !ready;
  };

  const onContinue = async () => {
    // User-initiated: this is the only path to a rewarded ad.
    const outcome = await lifecycle.playRewarded(nullRewardedProvider, 'pulse-runner-continue');
    if (outcome.granted) {
      engine.grantContinue();
      if (overlay) overlay.hidden = true;
      if (continueButton) continueButton.hidden = true;
    }
  };

  continueButton?.addEventListener('click', () => void onContinue());
  restartButton?.addEventListener('click', () => {
    engine.restart();
    if (overlay) overlay.hidden = true;
    if (continueButton) continueButton.hidden = true;
    loop.start();
  });

  // Poll cheaply for the game-over transition; the engine is the source of
  // truth and this avoids every prototype having to implement its own events.
  const stateTimer = window.setInterval(() => {
    if (engine.state().over) {
      if (continueButton && continueButton.hidden) void refreshContinueOffer();
    } else if (continueButton && !continueButton.hidden) {
      continueButton.hidden = true;
    }
  }, 400);

  loop.start();

  /* ----------------------------------------------------------- controller -- */

  return {
    pause(reason?: PauseReason) {
      if (paused) return;
      paused = true;
      loop.stop();
      // An ad pause is managed by the ad lifecycle's own gates; the shell must
      // not also stop the loop or the two would fight over who restarts it.
      if (reason === 'ad') return;
      void reason;
    },
    resume() {
      if (!paused) return;
      paused = false;
      loop.start();
    },
    isPaused: () => paused,
    restart() {
      engine.restart();
      if (overlay) overlay.hidden = true;
      if (continueButton) continueButton.hidden = true;
      if (!paused) loop.start();
    },
    destroy() {
      window.clearInterval(stateTimer);
      loop.destroy();
      stage.destroy();
      hud?.destroy();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}
