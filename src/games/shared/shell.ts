import { mountGame } from '../registry';
import { isMuted, toggleMuted, unlockAudio, isSoundEnabled, setSoundEnabled, getSoundVolume, setSoundVolume, getAmbient, startAmbient, stopAmbient } from './audio';
import {
  addVisibleRecoveryListeners,
  pauseReasonsAfterResumeRequest,
  resumeBlockedMessage,
  resumeControllerIfReady,
  type PauseEnvironment,
} from './pause-recovery';
import type { GameController, PauseReason } from './types';
import { getBrowserStorage, recordRecentlyPlayed } from './recently-played';

type PlatformModalEvent = CustomEvent<{ open?: boolean }>;

/**
 * Mounts one game inside the markup rendered by GameShell. Keeping this here
 * means each game module only manages its own board/canvas state while the
 * site owns pause, sound, fullscreen, and platform-modal lifecycle behavior.
 */
export function mountGameShell(viewport: HTMLElement): () => void {
  const root = viewport.querySelector<HTMLElement>('[data-game-root]');
  const gameId = root?.dataset.gameRoot;
  if (!root || !gameId) return () => {};

  const controller = mountGame(gameId, root);
  root.classList.add('is-game-mounted');
  const pauseButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="pause"]');
  const muteButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="mute"]');
  const soundButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="sound"]');
  const volumeInput = viewport.querySelector<HTMLInputElement>('[data-game-toolbar="volume"]');
  const ambientInput = viewport.querySelector<HTMLSelectElement>('[data-game-toolbar="ambient"]');
  const fullscreenButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="fullscreen"]');
  const restartButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="restart"]');
  const pauseOverlay = viewport.querySelector<HTMLElement>('[data-game-pause-overlay]');
  const overlayResume = viewport.querySelector<HTMLButtonElement>('[data-game-pause-resume]');
  const status = viewport.querySelector<HTMLElement>('[data-game-toolbar-status]');

  const pauseReasons = new Set<PauseReason>();
  let immersive = false;
  let scrollY = 0;
  let previousBodyStyle = '';
  let destroyed = false;

  const nativeFullscreenSupported =
    typeof document !== 'undefined' &&
    document.fullscreenEnabled === true &&
    typeof viewport.requestFullscreen === 'function';

  const announce = (message: string) => {
    if (status) status.textContent = message;
  };

  const updateMute = () => {
    const muted = isMuted();
    if (muteButton) {
      muteButton.textContent = muted ? 'Unmute sound' : 'Mute sound';
      muteButton.setAttribute('aria-label', muted ? 'Unmute game sound' : 'Mute game sound');
      muteButton.setAttribute('aria-pressed', String(muted));
    }
    if (soundButton) { const enabled=isSoundEnabled(); soundButton.textContent=enabled?'Sound on':'Sound off'; soundButton.setAttribute('aria-pressed',String(enabled)); }
    if (volumeInput) volumeInput.value=String(getSoundVolume());
    if (ambientInput) ambientInput.value=getAmbient();
  };

  const updatePaused = (announcement?: string) => {
    const paused = pauseReasons.size > 0 || controller.isPaused();
    viewport.classList.toggle('is-paused', paused);
    if (pauseButton) {
      pauseButton.textContent = paused ? 'Resume game' : 'Pause game';
      pauseButton.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
      pauseButton.setAttribute('aria-pressed', String(paused));
    }
    if (pauseOverlay) pauseOverlay.hidden = !paused;
    if (paused) announce('Game paused. Your current game is waiting.');
    else if (announcement) announce(announcement);
  };

  const updateFullscreen = () => {
    const activeNative = document.fullscreenElement === viewport;
    const active = activeNative || immersive;
    viewport.classList.toggle('is-immersive', immersive);
    viewport.classList.toggle('is-fullscreen-active', active);

    if (!fullscreenButton) return;
    if (activeNative) {
      fullscreenButton.textContent = 'Exit full screen';
      fullscreenButton.setAttribute('aria-label', 'Exit full screen');
    } else if (immersive) {
      fullscreenButton.textContent = 'Exit immersive mode';
      fullscreenButton.setAttribute('aria-label', 'Exit immersive mode');
    } else if (nativeFullscreenSupported) {
      fullscreenButton.textContent = 'Enter full screen';
      fullscreenButton.setAttribute('aria-label', 'Enter full screen');
    } else {
      fullscreenButton.textContent = 'Enter immersive mode';
      fullscreenButton.setAttribute('aria-label', 'Enter immersive mode');
    }
    fullscreenButton.setAttribute('aria-pressed', String(active));
  };

  const addPauseReason = (reason: PauseReason) => {
    if (pauseReasons.has(reason)) return;
    const wasPaused = pauseReasons.size > 0;
    pauseReasons.add(reason);
    if (!wasPaused) controller.pause(reason);
    updatePaused();
  };

  const removePauseReason = (reason: PauseReason, message = 'Game resumed.') => {
    if (!pauseReasons.delete(reason)) return;
    if (pauseReasons.size === 0) controller.resume();
    updatePaused(pauseReasons.size === 0 ? message : undefined);
  };

  const getPauseEnvironment = (): PauseEnvironment => ({
    documentVisible: document.visibilityState === 'visible',
    consentModalOpen: document.querySelector('[data-consent-modal]:not([hidden])') !== null,
  });

  const resumeFromSharedControl = () => {
    const wasPaused = pauseReasons.size > 0 || controller.isPaused();
    const environment = getPauseEnvironment();
    const remaining = pauseReasonsAfterResumeRequest(pauseReasons, environment);

    // Apply only transitions that were checked against current browser and
    // modal state. Active automatic blockers remain in the set.
    for (const reason of [...pauseReasons]) {
      if (!remaining.has(reason)) pauseReasons.delete(reason);
    }

    if (resumeControllerIfReady(controller, wasPaused, pauseReasons)) {
      updatePaused('Game resumed.');
      window.setTimeout(() => pauseButton?.focus({ preventScroll: true }), 0);
      return;
    }

    updatePaused();
    if (pauseReasons.size > 0) announce(resumeBlockedMessage(pauseReasons, environment));
  };

  const exitImmersive = (returnFocus = true) => {
    if (!immersive) return;
    immersive = false;
    document.body.style.cssText = previousBodyStyle;
    window.scrollTo(0, scrollY);
    updateFullscreen();
    announce('Immersive mode exited.');
    if (returnFocus) window.setTimeout(() => fullscreenButton?.focus({ preventScroll: true }), 0);
  };

  const enterImmersive = () => {
    if (immersive) return;
    scrollY = window.scrollY;
    previousBodyStyle = document.body.style.cssText;
    // Keeping the page fixed prevents touch scrolling behind the fixed layer.
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    immersive = true;
    updateFullscreen();
    announce('Immersive mode entered. This is not browser full screen.');
  };

  const requestFullscreen = async () => {
    if (immersive) {
      exitImmersive();
      return;
    }

    if (document.fullscreenElement === viewport) {
      try {
        await document.exitFullscreen();
      } catch {
        announce('Full screen could not be exited. Use your browser controls if needed.');
      }
      return;
    }

    if (!nativeFullscreenSupported) {
      enterImmersive();
      return;
    }

    try {
      await viewport.requestFullscreen();
    } catch {
      // A rejection can occur because of browser policy or an interrupted user
      // gesture. Do not imply that native fullscreen started.
      announce('Full screen is unavailable in this browser right now.');
      updateFullscreen();
    }
  };

  const recoverHiddenPauseWhenVisible = () => {
    if (document.visibilityState !== 'visible') return;
    removePauseReason('hidden', 'Game resumed after returning to this tab.');
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') addPauseReason('hidden');
    else recoverHiddenPauseWhenVisible();
  };

  const onPlatformModal = (event: Event) => {
    const detail = (event as PlatformModalEvent).detail;
    if (detail?.open) addPauseReason('consent');
    else removePauseReason('consent', 'Game resumed after the dialog closed.');
  };

  const onFullscreenChange = () => {
    const activeNative = document.fullscreenElement === viewport;
    updateFullscreen();
    if (activeNative) {
      announce('Full screen entered. Pause, sound, and exit controls remain available.');
    } else if (!immersive) {
      announce('Full screen exited.');
      window.setTimeout(() => fullscreenButton?.focus({ preventScroll: true }), 0);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && immersive) {
      event.preventDefault();
      exitImmersive();
    }
  };

  const onPageHide = () => {
    exitImmersive(false);
    if (document.fullscreenElement === viewport) void document.exitFullscreen().catch(() => {});
  };

  // Game modules emit this only after a valid action in the mounted game.
  // Shared toolbar, page, consent, and advertisement interactions never reach it.
  const onMeaningfulInteraction = () => recordRecentlyPlayed(getBrowserStorage(), gameId);
  root.addEventListener('nocharge:meaningful-game-interaction', onMeaningfulInteraction);

  pauseButton?.addEventListener('click', () => {
    if (pauseReasons.size > 0 || controller.isPaused()) resumeFromSharedControl();
    else addPauseReason('player');
  });
  overlayResume?.addEventListener('click', resumeFromSharedControl);
  muteButton?.addEventListener('click', () => {
    unlockAudio(); const muted = toggleMuted();
    if (muted) stopAmbient(); else if (getAmbient() !== 'none') startAmbient();
    updateMute(); announce(muted ? 'Game sound muted.' : 'Game sound unmuted.');
  });
  soundButton?.addEventListener('click', () => { unlockAudio(); setSoundEnabled(!isSoundEnabled()); updateMute(); announce(isSoundEnabled()?'Sound enabled.':'Sound disabled.'); if(!isSoundEnabled()) stopAmbient(); else if(getAmbient()!=='none') startAmbient(); });
  volumeInput?.addEventListener('input', () => setSoundVolume(Number(volumeInput.value)));
  ambientInput?.addEventListener('change', () => { unlockAudio(); const value=ambientInput.value as any; if(value==='none') stopAmbient(); else startAmbient(value); updateMute(); });
  fullscreenButton?.addEventListener('click', () => void requestFullscreen());
  restartButton?.addEventListener('click', () => {
    if (!controller.restart) return;
    unlockAudio();
    controller.restart();
    announce('New game started.');
  });

  const removeVisibleRecoveryListeners = addVisibleRecoveryListeners(
    window,
    recoverHiddenPauseWhenVisible as EventListener,
  );
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('nocharge:modalchange', onPlatformModal as EventListener);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('pagehide', onPageHide);

  restartButton?.toggleAttribute('hidden', !controller.restart);
  updateMute();
  updatePaused();
  updateFullscreen();
  if (document.visibilityState === 'hidden') addPauseReason('hidden');

  return () => {
    if (destroyed) return;
    destroyed = true;
    exitImmersive(false);
    removeVisibleRecoveryListeners();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('nocharge:modalchange', onPlatformModal as EventListener);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('pagehide', onPageHide);
    root.removeEventListener('nocharge:meaningful-game-interaction', onMeaningfulInteraction);
    controller.destroy();
  };
}

/** Mount all server-rendered game viewports on a game page. */
export function mountRenderedGameShells(scope: ParentNode = document): () => void {
  const cleanups = [...scope.querySelectorAll<HTMLElement>('[data-game-viewport]')].map((viewport) =>
    mountGameShell(viewport),
  );
  return () => cleanups.forEach((cleanup) => cleanup());
}

export type { GameController };
