import { play, unlockAudio } from '../shared/audio';
import { loadScore, saveScore, loadPref, savePref } from '../shared/storage';
import type { GameController, PauseReason } from '../shared/types';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import { pick } from '../shared/utils';
import {
  createGame,
  pickRoundColor,
  step,
  undo as engineUndo,
  isAdjacent,
  colorHex,
  colorShortcut,
  type ColorId,
  type RotationMode,
  type TapToStepState,
  GRID_SIZE,
} from './engine';
import { currentLocale } from '../../i18n/client';
import { t, type MessageKey, type MessageParams } from '../../i18n/messages';
import './styles.css';

/** Translation key for each color's name. Ids are stable; names are localized. */
const COLOR_KEYS: Record<ColorId, MessageKey> = {
  green: 'flip.color.green',
  blue: 'flip.color.blue',
  amber: 'flip.color.amber',
  rose: 'flip.color.rose',
};

const GAME_ID = 'color-flip';
const TURN_BASED_GAME_ID = 'color-flip-turn-based';
const ROTATION_PREF_KEY = 'color-flip-rotation';

const COLORS = [
  { id: 'green' as ColorId, hex: '#0f9d58', shortcut: 'G' },
  { id: 'blue' as ColorId, hex: '#3b82f6', shortcut: 'B' },
  { id: 'amber' as ColorId, hex: '#f59e0b', shortcut: 'A' },
  { id: 'rose' as ColorId, hex: '#f43f5e', shortcut: 'R' },
] as const;

export function mountColorFlip(root: HTMLElement): GameController {
  const locale = currentLocale();
  const L = (key: MessageKey, params?: MessageParams) => t(locale, key, params);
  const colorName = (id: ColorId) => L(COLOR_KEYS[id]);

  root.innerHTML = `
    <div class="cf">
      <div class="cf__hud">
        <div class="cf__stats">
          <span>${L('game.score')} <strong data-cf="score">0</strong></span>
          <span>${L('game.best')} <strong data-cf="best">0</strong></span>
        </div>
        <div class="cf__color">
          <span class="cf__swatch" data-cf="swatch"></span>
          <span data-cf="color-label">${colorName('green')}</span>
        </div>
        <div class="cf__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-cf="rotation-btn">${L('flip.rotation.never')}</button>
          <button type="button" class="btn btn--ghost btn--sm" data-cf="undo-btn" disabled>${L('game.undo')}</button>
          <button type="button" class="btn btn--ghost btn--sm" data-cf="mode">${L('flip.turnMode')}</button>
        </div>
      </div>
      <p class="cf__hint" id="cf-instructions" data-cf="hint">${L('flip.hintVisual')}</p>
      <div class="cf__visual" data-cf="visual">
        <div class="cf__round-picker" data-cf="round-picker" role="group" aria-label="${L('flip.ui.pickAria')}">
          <p class="cf__round-picker-label">${L('flip.ui.pickLabel')} <span class="cf__round-picker-name" data-cf="picker-name">${colorName('green')}</span></p>
          <div class="cf__round-choices">
            <button type="button" class="cf__round-choice cf__round-choice--green" data-cf-pick="green" aria-label="${L('flip.ui.pick', { color: colorName('green') })}" aria-keyshortcuts="G">
              <span class="cf__round-swatch" aria-hidden="true"></span>
              <span>${L('flip.ui.choice', { shortcut: 'G', color: colorName('green') })}</span>
            </button>
            <button type="button" class="cf__round-choice cf__round-choice--blue" data-cf-pick="blue" aria-label="${L('flip.ui.pick', { color: colorName('blue') })}" aria-keyshortcuts="B">
              <span class="cf__round-swatch" aria-hidden="true"></span>
              <span>${L('flip.ui.choice', { shortcut: 'B', color: colorName('blue') })}</span>
            </button>
            <button type="button" class="cf__round-choice cf__round-choice--amber" data-cf-pick="amber" aria-label="${L('flip.ui.pick', { color: colorName('amber') })}" aria-keyshortcuts="A">
              <span class="cf__round-swatch" aria-hidden="true"></span>
              <span>${L('flip.ui.choice', { shortcut: 'A', color: colorName('amber') })}</span>
            </button>
            <button type="button" class="cf__round-choice cf__round-choice--rose" data-cf-pick="rose" aria-label="${L('flip.ui.pick', { color: colorName('rose') })}" aria-keyshortcuts="R">
              <span class="cf__round-swatch" aria-hidden="true"></span>
              <span>${L('flip.ui.choice', { shortcut: 'R', color: colorName('rose') })}</span>
            </button>
          </div>
        </div>
        <div class="cf__stage" data-cf="stage">
          <div class="cf__grid" data-cf="grid" role="group" aria-label="${L('flip.ui.grid')}"></div>
          <div class="cf__overlay" data-cf="overlay">
            <h2 data-cf="overlay-heading">${L('flip.ready')}</h2>
            <p data-cf="result" aria-live="polite"></p>
            <button type="button" class="btn" data-cf="again">${L('flip.start')}</button>
          </div>
        </div>
      </div>
      <section class="cf__accessible" data-cf="accessible" aria-labelledby="cf-accessible-title" hidden>
        <h2 id="cf-accessible-title">${L('flip.ui.turnTitle')}</h2>
        <p>${L('flip.ui.turnBody')}</p>
        <div class="cf__accessible-state">
          <p>${L('flip.ui.currentColorLabel')} <strong data-cf="accessible-current">${colorName('green')}</strong></p>
          <p>${L('flip.ui.nextTileLabel')} <strong data-cf="accessible-next">${colorName('green')}, G</strong></p>
          <p class="sr-only" data-cf="accessible-announcement" role="status" aria-live="polite" aria-atomic="true"></p>
        </div>
        <div class="cf__accessible-actions">
          <button type="button" class="btn btn--ghost" data-cf="accessible-cycle">${L('flip.ui.cycle')}</button>
          <button type="button" class="btn" data-cf="accessible-step">${L('flip.ui.step')}</button>
        </div>
        <div class="cf__accessible-result" data-cf="accessible-result" hidden>
          <p data-cf="accessible-result-text"></p>
          <button type="button" class="btn" data-cf="accessible-again">${L('flip.playAgain')}</button>
        </div>
      </section>
    </div>
  `;

  const scoreEl = root.querySelector<HTMLElement>('[data-cf="score"]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-cf="best"]')!;
  const swatch = root.querySelector<HTMLElement>('[data-cf="swatch"]')!;
  const colorLabel = root.querySelector<HTMLElement>('[data-cf="color-label"]')!;
  const hint = root.querySelector<HTMLElement>('[data-cf="hint"]')!;
  const visual = root.querySelector<HTMLElement>('[data-cf="visual"]')!;
  const stage = root.querySelector<HTMLElement>('[data-cf="stage"]')!;
  const roundPicker = root.querySelector<HTMLElement>('[data-cf="round-picker"]')!;
  const pickerName = root.querySelector<HTMLElement>('[data-cf="picker-name"]')!;
  const pickButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-cf-pick]')];
  const gridEl = root.querySelector<HTMLElement>('[data-cf="grid"]')!;
  const overlay = root.querySelector<HTMLElement>('[data-cf="overlay"]')!;
  const overlayHeading = root.querySelector<HTMLElement>('[data-cf="overlay-heading"]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-cf="result"]')!;
  const rotationBtn = root.querySelector<HTMLButtonElement>('[data-cf="rotation-btn"]')!;
  const undoBtn = root.querySelector<HTMLButtonElement>('[data-cf="undo-btn"]')!;
  const modeBtn = root.querySelector<HTMLButtonElement>('[data-cf="mode"]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-cf="again"]')!;
  const accessible = root.querySelector<HTMLElement>('[data-cf="accessible"]')!;
  const accessibleCurrent = root.querySelector<HTMLElement>('[data-cf="accessible-current"]')!;
  const accessibleNext = root.querySelector<HTMLElement>('[data-cf="accessible-next"]')!;
  const accessibleAnnouncement = root.querySelector<HTMLElement>('[data-cf="accessible-announcement"]')!;
  const accessibleCycleBtn = root.querySelector<HTMLButtonElement>('[data-cf="accessible-cycle"]')!;
  const accessibleStepBtn = root.querySelector<HTMLButtonElement>('[data-cf="accessible-step"]')!;
  const accessibleResult = root.querySelector<HTMLElement>('[data-cf="accessible-result"]')!;
  const accessibleResultText = root.querySelector<HTMLElement>('[data-cf="accessible-result-text"]')!;
  const accessibleAgainBtn = root.querySelector<HTMLButtonElement>('[data-cf="accessible-again"]')!;

  let best = loadScore(GAME_ID);
  bestEl.textContent = String(best);

  let score = 0;
  let turnBased = false;
  let turnBasedAlive = false;
  let turnBasedTarget: ColorId = 'green';
  let playerColor: ColorId = 'green';
  let paused = false;
  let state: TapToStepState;
  let rotation: RotationMode = loadPref(ROTATION_PREF_KEY, 'never') as RotationMode;
  let rng: () => number;

  function seedRng() {
    let s = Math.floor(Math.random() * 0x7fffffff) >>> 0 || 1;
    rng = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
  }

  function setPlayerColor(id: ColorId) {
    playerColor = id;
    swatch.style.background = colorHex(id);
    colorLabel.textContent = colorName(id);
    accessibleCurrent.textContent = colorName(id);
  }

  function setScore(n: number) {
    score = n;
    scoreEl.textContent = String(score);
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-pop');
  }

  function setTurnBasedTarget(id: ColorId) {
    turnBasedTarget = id;
    accessibleNext.textContent = `${colorName(id)}, ${colorShortcut(id)}`;
  }

  function updateRotationBtn() {
    const labels: Record<RotationMode, MessageKey> = {
      'never': 'flip.rotation.never',
      'every-10': 'flip.rotation.every10',
      'every-5': 'flip.rotation.every5',
    };
    rotationBtn.textContent = L(labels[rotation]);
  }

  function updatePausedControls() {
    modeBtn.disabled = paused;
    rotationBtn.disabled = paused;
    undoBtn.disabled = paused || turnBased || !state?.history;
    pickButtons.forEach((btn) => { btn.disabled = paused || turnBased || state?.phase !== 'picking'; });
    accessibleCycleBtn.disabled = paused || !turnBasedAlive;
    accessibleStepBtn.disabled = paused || !turnBasedAlive;
  }

  function announceTurnBased(message: string) {
    accessibleAnnouncement.textContent = message;
  }

  function nextTurnBasedTarget() {
    const choices = COLORS.filter((color) => color.id !== turnBasedTarget);
    return pick(choices).id;
  }

  function startTurnBased() {
    turnBasedAlive = true;
    best = loadScore(TURN_BASED_GAME_ID);
    bestEl.textContent = String(best);
    setScore(0);
    setPlayerColor('green');
    setTurnBasedTarget(pick(COLORS).id);
    updatePausedControls();
    accessibleResult.hidden = true;
    announceTurnBased(
      L('flip.newRun', { player: colorName(playerColor), next: colorName(turnBasedTarget) }),
    );
    if (!paused) accessibleCycleBtn.focus();
  }

  function enterTurnBased() {
    turnBased = true;
    visual.hidden = true;
    stage.hidden = true;
    accessible.hidden = false;
    modeBtn.textContent = L('flip.visualMode');
    hint.textContent = L('flip.hintTurn');
    startTurnBased();
  }

  function exitTurnBased() {
    turnBased = false;
    turnBasedAlive = false;
    accessible.hidden = true;
    visual.hidden = false;
    stage.hidden = false;
    modeBtn.textContent = L('flip.turnMode');
    hint.textContent = L('flip.hintVisual');
    best = loadScore(GAME_ID);
    bestEl.textContent = String(best);
    resetVisual(false);
  }

  function cycleTurnBasedColor() {
    if (paused || !turnBasedAlive) return;
    signalMeaningfulGameInteraction(root);
    unlockAudio();
    const index = COLORS.findIndex((c) => c.id === playerColor);
    setPlayerColor(COLORS[(index + 1) % COLORS.length]!.id);
    announceTurnBased(L('flip.cycled', { player: colorName(playerColor), next: colorName(turnBasedTarget) }));
    void play('step');
  }

  function stepTurnBased() {
    if (paused || !turnBasedAlive) return;
    signalMeaningfulGameInteraction(root);
    unlockAudio();
    if (playerColor !== turnBasedTarget) {
      turnBasedAlive = false;
      best = saveScore(TURN_BASED_GAME_ID, score);
      bestEl.textContent = String(best);
      updatePausedControls();
      accessibleResultText.textContent = L('flip.wrongShort', { score, best });
      accessibleResult.hidden = false;
      announceTurnBased(
        L('flip.wrongLong', { player: colorName(playerColor), next: colorName(turnBasedTarget), score, best }),
      );
      accessibleAgainBtn.focus();
      void play('win');
      return;
    }

    setScore(score + 1);
    best = saveScore(TURN_BASED_GAME_ID, score);
    bestEl.textContent = String(best);
    setTurnBasedTarget(nextTurnBasedTarget());
    announceTurnBased(L('flip.correct', { score, next: colorName(turnBasedTarget) }));
    void play('place');
  }

  // --- Visual mode: tap-to-step ---

  function renderGrid() {
    gridEl.innerHTML = '';
    const center = Math.floor(GRID_SIZE / 2);

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cf__tile';
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);

        if (row === center && col === center) {
          // Player cell
          cell.classList.add('cf__tile--player');
          cell.style.setProperty('--tile-color', colorHex(state.playerColor));
          cell.setAttribute(
            'aria-label',
            L('flip.aria.player', { color: colorName(state.playerColor), shortcut: colorShortcut(state.playerColor) }),
          );
          cell.innerHTML = `<span class="cf__tile-symbol">${colorShortcut(state.playerColor)}</span>`;
          cell.disabled = true;
        } else {
          const tile = state.grid[row]?.[col];
          if (tile) {
            cell.style.setProperty('--tile-color', colorHex(tile.color));
            cell.classList.add('cf__tile--active');
            const adj = isAdjacent(col, row, center, center);
            if (adj && state.phase === 'playing') {
              cell.classList.add('cf__tile--adjacent');
              cell.setAttribute(
                'aria-label',
                L(tile.color === state.playerColor ? 'flip.aria.stepMatch' : 'flip.aria.stepWrong', {
                  color: colorName(tile.color),
                  shortcut: colorShortcut(tile.color),
                }),
              );
            } else {
              cell.disabled = true;
              cell.setAttribute(
                'aria-label',
                L(adj ? 'flip.aria.tile' : 'flip.aria.tileFar', {
                  color: colorName(tile.color),
                  shortcut: colorShortcut(tile.color),
                }),
              );
            }
            cell.innerHTML = `<span class="cf__tile-letter">${colorShortcut(tile.color)}</span>`;

            if (adj && state.phase === 'playing') {
              cell.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                handleTileTap(col, row);
              });
            }
          } else {
            cell.classList.add('cf__tile--empty');
            cell.disabled = true;
            cell.setAttribute('aria-label', L('flip.aria.empty'));
          }
        }

        gridEl.appendChild(cell);
      }
    }
  }

  function handleTileTap(col: number, row: number) {
    if (paused || turnBased || state.phase !== 'playing') return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);

    const result = step(state, col, row, rng);
    if (!result) return;

    state = result;
    setScore(state.score);
    setPlayerColor(state.playerColor);
    best = Math.max(best, state.score);
    bestEl.textContent = String(best);
    saveScore(GAME_ID, best);

    if (state.alive) {
      void play('place');
      renderGrid();
      updatePausedControls();
    } else {
      void play('win');
      renderGrid();
      endVisualGame();
    }
  }

  function handleArrowStep(dx: number, dy: number) {
    if (paused || turnBased || state.phase !== 'playing') return;
    const center = Math.floor(GRID_SIZE / 2);
    const targetX = center + dx;
    const targetY = center + dy;
    if (targetX < 0 || targetX >= GRID_SIZE || targetY < 0 || targetY >= GRID_SIZE) return;
    handleTileTap(targetX, targetY);
  }

  function handlePick(color: ColorId) {
    if (paused || turnBased || state.phase !== 'picking') return;
    unlockAudio();
    signalMeaningfulGameInteraction(root);
    state = pickRoundColor(state, color);
    setPlayerColor(color);
    roundPicker.hidden = true;
    void play('step');
    renderGrid();
    updatePausedControls();
  }

  function endVisualGame() {
    overlayHeading.textContent = L('flip.roundOver');
    resultEl.textContent = L('flip.score', { score: state.score, best });
    againBtn.textContent = L('flip.playAgain');
    overlay.classList.add('is-open');
    overlay.hidden = false;
    againBtn.focus();
  }

  function resetVisual(start = true) {
    seedRng();
    state = createGame(rotation, best);
    setScore(0);
    setPlayerColor('green');
    roundPicker.hidden = !start || false;
    overlay.classList.remove('is-open');
    overlay.hidden = true;

    if (start) {
      roundPicker.hidden = false;
      pickerName.textContent = colorName('green');
      renderGrid();
      updatePausedControls();
      if (!paused) pickButtons[0]?.focus({ preventScroll: true });
    } else {
      overlayHeading.textContent = L('flip.ready');
      resultEl.textContent = L('flip.pickToBegin');
      againBtn.textContent = L('flip.start');
      overlay.classList.add('is-open');
      overlay.hidden = false;
      roundPicker.hidden = true;
      renderGrid();
      updatePausedControls();
    }
  }

  // Event bindings
  pickButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      handlePick(btn.dataset.cfPick as ColorId);
    });
  });

  rotationBtn.addEventListener('click', () => {
    if (paused) return;
    const modes: RotationMode[] = ['never', 'every-10', 'every-5'];
    const idx = modes.indexOf(rotation);
    rotation = modes[(idx + 1) % modes.length]!;
    savePref(ROTATION_PREF_KEY, rotation);
    updateRotationBtn();
    // Apply to current game if in picking phase
    if (state.phase === 'picking') {
      state = { ...state, rotation };
    }
  });

  undoBtn.addEventListener('click', () => {
    if (paused || turnBased) return;
    const result = engineUndo(state);
    if (result) {
      state = result;
      setScore(state.score);
      setPlayerColor(state.playerColor);
      renderGrid();
      updatePausedControls();
    }
  });

  modeBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    if (turnBased) exitTurnBased();
    else enterTurnBased();
  });

  againBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    resetVisual(true);
  });

  accessibleCycleBtn.addEventListener('click', cycleTurnBasedColor);
  accessibleStepBtn.addEventListener('click', stepTurnBased);
  accessibleAgainBtn.addEventListener('click', () => {
    if (paused) return;
    startTurnBased();
  });

  // Keyboard
  const onKey = (event: KeyboardEvent) => {
    if (event.isComposing) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const target = event.target;
    if (target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable)) return;

    if (turnBased) return; // turn-based has its own button controls

    // Color shortcuts for picking phase
    if (state?.phase === 'picking') {
      const requestedColor = COLORS.find((c) => c.shortcut.toLowerCase() === event.key.toLowerCase())?.id;
      if (requestedColor) {
        event.preventDefault();
        handlePick(requestedColor);
        return;
      }
    }

    // Arrow keys for stepping
    if (state?.phase === 'playing') {
      switch (event.key) {
        case 'ArrowUp': event.preventDefault(); handleArrowStep(0, -1); break;
        case 'ArrowDown': event.preventDefault(); handleArrowStep(0, 1); break;
        case 'ArrowLeft': event.preventDefault(); handleArrowStep(-1, 0); break;
        case 'ArrowRight': event.preventDefault(); handleArrowStep(1, 0); break;
      }
    }

    if (event.key === 'u' || event.key === 'U') {
      event.preventDefault();
      undoBtn.click();
    }
  };

  window.addEventListener('keydown', onKey);

  updateRotationBtn();
  resetVisual(false);

  return {
    destroy() {
      window.removeEventListener('keydown', onKey);
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      if (paused) return;
      paused = true;
      updatePausedControls();
    },
    resume() {
      if (!paused) return;
      paused = false;
      updatePausedControls();
    },
    isPaused() {
      return paused;
    },
    restart() {
      if (turnBased) startTurnBased();
      else resetVisual(false);
    },
  };
}
