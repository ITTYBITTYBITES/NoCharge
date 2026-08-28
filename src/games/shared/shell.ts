import { emptyGameController, mountGame } from '../registry';
import { isMuted, toggleMuted, unlockAudio, isSoundEnabled, setSoundEnabled, getSoundVolume, setSoundVolume, getAmbient, setAmbient, isAmbientName, startAmbient, stopAmbient, updateAmbientVolume } from './audio';
import {
  addVisibleRecoveryListeners,
  pauseReasonsAfterResumeRequest,
  resumeBlockedMessage,
  resumeControllerIfReady,
  type PauseEnvironment,
} from './pause-recovery';
import type { GameController, PauseReason } from './types';
import { getBrowserStorage, recordRecentlyPlayed } from './recently-played';
import { focusModeLabel, nextMenuState, type ShellMenuState } from './shell-menu';

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

  let controller = emptyGameController();
  const listenerController = new AbortController();
  const listenerOptions = { signal: listenerController.signal };
  const pendingTimers = new Set<number>();
  const defer = (callback: () => void, delay = 0) => {
    const id = window.setTimeout(() => { pendingTimers.delete(id); callback(); }, delay);
    pendingTimers.add(id);
  };
  root.setAttribute('aria-busy', 'true');
  const pauseButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="pause"]');
  const muteButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="mute"]');
  const soundButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="sound"]');
  const volumeInput = viewport.querySelector<HTMLInputElement>('[data-game-toolbar="volume"]');
  const ambientInput = viewport.querySelector<HTMLSelectElement>('[data-game-toolbar="ambient"]');
  const fullscreenButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="fullscreen"]');
  const focusInMenu = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="focus-in-menu"]');
  const restartButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="restart"]');
  const restartInMenuButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="restart-in-menu"]');
  const playButton = viewport.closest('.game-shell')?.querySelector<HTMLButtonElement>('[data-game-play-btn]');
  const settingsButton = viewport.querySelector<HTMLButtonElement>('[data-game-toolbar="settings"]');
  const settingsPanel = viewport.querySelector<HTMLElement>('[data-game-settings-panel]');
  const settingsCatch = viewport.querySelector<HTMLElement>('[data-game-settings-catch]');
  const pauseOverlay = viewport.querySelector<HTMLElement>('[data-game-pause-overlay]');
  const overlayResume = viewport.querySelector<HTMLButtonElement>('[data-game-pause-resume]');
  const status = viewport.querySelector<HTMLElement>('[data-game-toolbar-status]');

  const pauseReasons = new Set<PauseReason>();
  let immersive = false;
  let scrollY = 0;
  let previousBodyStyle = '';
  let destroyed = false;
  let menu: ShellMenuState = 'closed';
  let lastEnterTrigger: HTMLElement | null = null;

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
    if (soundButton) {
      const enabled = isSoundEnabled();
      soundButton.textContent = enabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(enabled));
    }
    if (volumeInput) volumeInput.value = String(getSoundVolume());
    if (ambientInput) ambientInput.value = getAmbient();
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

  const applyFocusLabels = () => {
    const activeNative = document.fullscreenElement === viewport;
    const labels = focusModeLabel(nativeFullscreenSupported, activeNative, immersive);
    if (fullscreenButton) {
      const active = activeNative || immersive;
      // Desktop retains a direct focus shortcut. On compact toolbars and while
      // settings are open, the menu is the one entry point; give the hidden
      // shortcut a distinct name so role queries never see duplicate actions.
      const directEntryVisible = !active && menu === 'closed' && !window.matchMedia('(max-width: 34rem)').matches;
      fullscreenButton.textContent = active || directEntryVisible ? labels.text : 'Leave expanded game';
      fullscreenButton.setAttribute('aria-label', active || directEntryVisible ? labels.aria : 'Leave expanded game');
      fullscreenButton.setAttribute('aria-pressed', String(active));
    }
    if (focusInMenu) {
      focusInMenu.textContent = labels.text;
      focusInMenu.setAttribute('aria-label', labels.aria);
    }
  };

  const updateFullscreen = () => {
    const activeNative = document.fullscreenElement === viewport;
    const active = activeNative || immersive;
    viewport.classList.toggle('is-immersive', immersive);
    viewport.classList.toggle('is-fullscreen-active', active);
    applyFocusLabels();
  };

  const setMenu = (action: 'toggle' | 'open' | 'close') => {
    menu = nextMenuState(menu, action);
    const open = menu === 'open';
    if (settingsPanel) settingsPanel.hidden = !open;
    if (settingsCatch) settingsCatch.hidden = !open;
    settingsButton?.setAttribute('aria-expanded', String(open));
    viewport.classList.toggle('is-settings-open', open);
    applyFocusLabels();
    if (open) {
      settingsPanel?.querySelector<HTMLElement>('button, input, select')?.focus({ preventScroll: true });
    } else {
      settingsButton?.focus({ preventScroll: true });
    }
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

    for (const reason of [...pauseReasons]) {
      if (!remaining.has(reason)) pauseReasons.delete(reason);
    }

    if (resumeControllerIfReady(controller, wasPaused, pauseReasons)) {
      updatePaused('Game resumed.');
      defer(() => pauseButton?.focus({ preventScroll: true }));
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
    announce('Focus mode exited.');
    if (returnFocus) {
      const target = lastEnterTrigger || playButton || fullscreenButton;
      defer(() => target?.focus({ preventScroll: true }));
    }
  };

  const enterImmersive = (trigger: HTMLElement | null = null) => {
    if (immersive) return;
    if (trigger) lastEnterTrigger = trigger;
    scrollY = window.scrollY;
    previousBodyStyle = document.body.style.cssText;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    immersive = true;
    updateFullscreen();
    announce('Focus mode entered. The playable board is expanded.');
  };

  const requestFullscreen = async (trigger: HTMLElement | null = null) => {
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

    if (trigger) lastEnterTrigger = trigger;

    if (!nativeFullscreenSupported) {
      enterImmersive(trigger);
      return;
    }

    try {
      const request = viewport.requestFullscreen as (options?: { navigationUI?: string }) => Promise<void>;
      await request.call(viewport, { navigationUI: 'hide' });
    } catch {
      enterImmersive(trigger);
    }
  };

  const recoverHiddenPauseWhenVisible = () => {
    if (document.visibilityState !== 'visible') return;
    removePauseReason('hidden', 'Game resumed after returning to this tab.');
    // Restore ambient if the user had it enabled and sound is not muted.
    if (getAmbient() !== 'none') {
      try { startAmbient(); } catch { /* */ }
    }
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      addPauseReason('hidden');
      // Stop ambient immediately when multitasking / tab hidden - prevents static continuing in background.
      try { stopAmbient(); } catch { /* */ }
    } else recoverHiddenPauseWhenVisible();
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
      const target = lastEnterTrigger || fullscreenButton || playButton;
      defer(() => target?.focus({ preventScroll: true }));
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && menu === 'open') {
      event.preventDefault();
      setMenu('close');
      return;
    }
    // If a solitaire fan is open, let its own Escape handler close it without exiting Game Mode.
    if (event.key === 'Escape') {
      const openFan = document.querySelector('[data-fc="fan"]:not([hidden]), [data-kl="fan"]:not([hidden])');
      if (openFan) return;
    }
    if (event.key === 'Escape' && document.fullscreenElement === viewport) {
      event.preventDefault();
      void document.exitFullscreen().catch(() => {});
      return;
    }
    if (event.key === 'Escape' && immersive) {
      event.preventDefault();
      exitImmersive();
    }
  };

  const onPageHide = () => {
    exitImmersive(false);
    try { stopAmbient(); } catch { /* */ }
    if (document.fullscreenElement === viewport) void document.exitFullscreen().catch(() => {});
  };

  const onMeaningfulInteraction = () => recordRecentlyPlayed(getBrowserStorage(), gameId);
  root.addEventListener('nocharge:meaningful-game-interaction', onMeaningfulInteraction, listenerOptions);

  pauseButton?.addEventListener('click', () => {
    if (pauseReasons.size > 0 || controller.isPaused()) resumeFromSharedControl();
    else addPauseReason('player');
  }, listenerOptions);
  overlayResume?.addEventListener('click', resumeFromSharedControl, listenerOptions);
  muteButton?.addEventListener('click', () => {
    unlockAudio();
    const muted = toggleMuted();
    if (muted) stopAmbient();
    else if (getAmbient() !== 'none') startAmbient();
    updateMute();
    announce(muted ? 'Game sound muted.' : 'Game sound unmuted.');
  }, listenerOptions);
  soundButton?.addEventListener('click', () => {
    unlockAudio();
    setSoundEnabled(!isSoundEnabled());
    updateMute();
    announce(isSoundEnabled() ? 'Sound enabled.' : 'Sound disabled.');
  }, listenerOptions);
  volumeInput?.addEventListener('input', () => {
    setSoundVolume(Number(volumeInput.value));
    try { updateAmbientVolume(); } catch { /* */ }
  }, listenerOptions);
  ambientInput?.addEventListener('change', () => {
    unlockAudio();
    const value = ambientInput.value;
    if (!isAmbientName(value)) return;
    setAmbient(value);
    if (value === 'none') stopAmbient();
    else startAmbient(value);
    updateMute();
  }, listenerOptions);
  playButton?.addEventListener('click', () => {
    unlockAudio();
    void requestFullscreen(playButton);
  }, listenerOptions);
  fullscreenButton?.addEventListener('click', () => void requestFullscreen(fullscreenButton), listenerOptions);
  focusInMenu?.addEventListener('click', () => {
    setMenu('close');
    void requestFullscreen(focusInMenu);
  }, listenerOptions);
  const restartGame = () => {
    if (!controller.restart) return;
    unlockAudio();
    controller.restart();
    // Keep settings open when restart came from the panel so the remaining
    // shared controls stay reachable and focus never moves into hidden UI.
    announce('New game started.');
  };
  restartButton?.addEventListener('click', restartGame, listenerOptions);
  restartInMenuButton?.addEventListener('click', restartGame, listenerOptions);
  settingsButton?.addEventListener('click', () => setMenu('toggle'), listenerOptions);
  settingsCatch?.addEventListener('click', () => setMenu('close'), listenerOptions);

  const removeVisibleRecoveryListeners = addVisibleRecoveryListeners(
    window,
    recoverHiddenPauseWhenVisible as EventListener,
  );
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('nocharge:modalchange', onPlatformModal as EventListener);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('pagehide', onPageHide);
  const onViewportResize = () => applyFocusLabels();
  window.addEventListener('orientationchange', onViewportResize);
  window.addEventListener('resize', onViewportResize);

  restartButton?.setAttribute('hidden', '');
  restartInMenuButton?.setAttribute('hidden', '');
  updateMute();
  updatePaused();
  updateFullscreen();
  if (document.visibilityState === 'hidden') addPauseReason('hidden');

  void mountGame(gameId, root)
    .then((mountedController) => {
      if (destroyed) {
        mountedController.destroy();
        return;
      }
      controller = mountedController;
      root.classList.add('is-game-mounted');
      root.removeAttribute('aria-busy');
      restartButton?.toggleAttribute('hidden', !controller.restart);
      restartInMenuButton?.toggleAttribute('hidden', !controller.restart);
      if (pauseReasons.size > 0) controller.pause([...pauseReasons][0]);
      updatePaused();
    })
    .catch((error) => {
      console.error(`Unable to finish mounting game "${gameId}".`, error);
      root.removeAttribute('aria-busy');
      root.textContent = 'This game could not start. Reload the page and try again.';
    });

  return () => {
    if (destroyed) return;
    destroyed = true;
    exitImmersive(false);
    listenerController.abort();
    pendingTimers.forEach((id) => window.clearTimeout(id));
    pendingTimers.clear();
    removeVisibleRecoveryListeners();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('nocharge:modalchange', onPlatformModal as EventListener);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('orientationchange', onViewportResize);
    window.removeEventListener('resize', onViewportResize);
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
