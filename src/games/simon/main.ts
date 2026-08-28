import { play } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import { loadPref, savePref } from '../shared/storage';
import type { GameController, PauseReason } from '../shared/types';
import { beginInput, expectedPadLabel, extendSequence, newGame, padById, PADS, pressPad, SIMON_PADS, SIMON_TARGET, type SimonState } from './engine';
import './styles.css';

const GAME_ID = 'simon';
const BEST_LENGTH_KEY = `nocharge:${GAME_ID}:best-length`;
const CALM_PREF = 'simon-calm';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function loadBest(): number {
  const value = Number(getBrowserStorage()?.getItem(BEST_LENGTH_KEY));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function saveBest(value: number): void {
  try {
    getBrowserStorage()?.setItem(BEST_LENGTH_KEY, String(value));
  } catch {
    /* storage unavailable */
  }
}

export function mountSimon(root: HTMLElement): GameController {
  const calmPref = loadPref<boolean>(CALM_PREF, false);
  let calm = calmPref;

  root.innerHTML = `
    <div class="sn" style="--sn-accent:#f472b6">
      <div class="sn-hud">
        <div class="sn-hud__row">
          <label class="sn-calm">
            <input type="checkbox" data-sn-calm ${calm ? 'checked' : ''} />
            Calm pattern (no flashing — icons and labels instead)
          </label>
          <p class="sn-hud__metrics" data-sn-metrics></p>
        </div>
        <p class="sn-hud__status" role="status" aria-live="polite" data-sn-status></p>
      </div>
      <div class="sn-stage" data-sn-stage>
        <div class="sn-pads" role="group" aria-label="Pattern pads" data-sn-pads>
          ${PADS.map((pad) => `<button type="button" class="sn-pad" data-sn-pad="${pad.id}" aria-label="${pad.label}" style="--pad-color:${pad.color}"><span class="sn-pad__icon" aria-hidden="true">${pad.icon}</span></button>`).join('')}
        </div>
        <div class="sn-center">
          <p class="sn-center__round" data-sn-round>Round 0</p>
          <button type="button" class="btn" data-sn-start>Start pattern</button>
          <p class="sn-center__hint" data-sn-hint></p>
        </div>
        <div class="sn-result" data-sn-result hidden>
          <div class="sn-result__card">
            <p class="sn-result__kicker">Sequence ended</p>
            <h2 class="sn-result__title" data-sn-result-title></h2>
            <p class="sn-result__detail" data-sn-result-detail></p>
            <button type="button" class="btn" data-sn-again>Try again</button>
          </div>
        </div>
      </div>
      <p class="sn-note">Watch the pattern, then repeat it from the start. The round is the number of pads you must recall; reaching ${SIMON_TARGET} completes the run. Calm pattern replaces flashing with a static highlight and spoken pad names — colour is never the only cue.</p>
    </div>
  `;

  const statusEl = root.querySelector<HTMLElement>('[data-sn-status]')!;
  const metricsEl = root.querySelector<HTMLElement>('[data-sn-metrics]')!;
  const roundEl = root.querySelector<HTMLElement>('[data-sn-round]')!;
  const hintEl = root.querySelector<HTMLElement>('[data-sn-hint]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-sn-start]')!;
  const calmInput = root.querySelector<HTMLInputElement>('[data-sn-calm]')!;
  const padsEl = root.querySelector<HTMLElement>('[data-sn-pads]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-sn-result]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-sn-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-sn-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-sn-again]')!;

  let paused = false;
  let state: SimonState = newGame(calm);
  let bestLength = loadBest();
  let showingIndex = 0;
  let showTimer: number | null = null;
  let pausedDuringShow = false;

  const padButtons = () => [...padsEl.querySelectorAll<HTMLButtonElement>('[data-sn-pad]')];

  const metrics = () => `Best remembered: ${bestLength > 0 ? bestLength : '—'}`;

  const clearShowTimer = () => {
    if (showTimer !== null) window.clearTimeout(showTimer);
    showTimer = null;
  };

  const stopShow = () => {
    clearShowTimer();
    for (const button of padButtons()) button.classList.remove('is-active');
    showingIndex = 0;
  };

  const showNext = () => {
    if (paused) {
      pausedDuringShow = true;
      return;
    }
    if (showingIndex >= state.sequence.length) {
      stopShow();
      state = beginInput(state);
      statusEl.textContent = `Your turn. Repeat the pattern${state.calm ? ' — pads are announced by name' : ''}.`;
      hintEl.textContent = '';
      padsEl.focus?.();
      renderRound();
      return;
    }
    const pad = padById(state.sequence[showingIndex]!);
    const button = padButtons()[pad.id]!;
    button.classList.add('is-active');
    void play(state.calm ? 'blip' : 'tick');
    statusEl.textContent = `Watch: ${pad.label}.`;
    showTimer = window.setTimeout(() => {
      button.classList.remove('is-active');
      showingIndex += 1;
      showTimer = window.setTimeout(showNext, state.calm ? 520 : 420);
    }, state.calm ? 560 : 380);
  };

  const renderRound = () => {
    roundEl.textContent = `Round ${state.sequence.length}`;
    metricsEl.textContent = metrics();
    if (state.status === 'lost' || state.status === 'won') {
      resultTitle.textContent = state.status === 'won' ? `All ${SIMON_TARGET} pads remembered.` : `Pattern broke at round ${state.sequence.length}.`;
      resultDetail.textContent = `${metrics()} · ${state.status === 'won' ? 'the full calm sequence' : 'start again anytime'}`;
      resultEl.hidden = false;
      againBtn.focus();
    } else {
      resultEl.hidden = true;
    }
  };

  const startPattern = () => {
    stopShow();
    state = newGame(calm);
    state = extendSequence(state);
    statusEl.textContent = 'Watch the pattern.';
    hintEl.textContent = '';
    renderRound();
    showingIndex = 0;
    showTimer = window.setTimeout(showNext, 500);
    signalMeaningfulGameInteraction(root);
  };

  const handlePad = (pad: number) => {
    if (paused || state.status !== 'input') return;
    const button = padButtons()[pad]!;
    button.classList.add('is-pressed');
    window.setTimeout(() => button.classList.remove('is-pressed'), 140);
    void play('pop');
    const before = state;
    state = pressPad(state, pad);
    if (state.status === 'lost') {
      if (before.sequence.length > bestLength) {
        bestLength = before.sequence.length - 1;
        saveBest(bestLength);
      }
      void play('lose');
      statusEl.textContent = `That was ${padById(pad).label}; expected ${expectedPadLabel(before)}.`;
      renderRound();
      return;
    }
    if (state.status === 'idle') {
      if (state.sequence.length > bestLength) {
        bestLength = state.sequence.length;
        saveBest(bestLength);
      }
      statusEl.textContent = `Round ${state.sequence.length} remembered.`;
      startBtn.focus();
      renderRound();
      state = extendSequence(state);
      void play('win');
      showingIndex = 0;
      statusEl.textContent = 'Watch the next pattern.';
      showTimer = window.setTimeout(showNext, 700);
      return;
    }
    if (state.status === 'won') {
      if (state.sequence.length > bestLength) {
        bestLength = state.sequence.length;
        saveBest(bestLength);
      }
      void play('win');
      statusEl.textContent = `All ${SIMON_TARGET} pads remembered.`;
      renderRound();
      return;
    }
    statusEl.textContent = `${state.inputIndex} of ${state.sequence.length} correct.`;
    renderRound();
  };

  padsEl.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-sn-pad]');
    if (button) handlePad(Number(button.dataset.snPad));
  });

  startBtn.addEventListener('click', startPattern);
  againBtn.addEventListener('click', startPattern);

  calmInput.addEventListener('change', () => {
    calm = calmInput.checked;
    savePref(CALM_PREF, calm);
    state = { ...state, calm };
    statusEl.textContent = calm ? 'Calm pattern on: static highlights and spoken pad names.' : 'Standard pattern on.';
  });

  renderRound();
  statusEl.textContent = 'Press Start pattern to begin.';

  return {
    destroy() {
      stopShow();
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      paused = true;
    },
    resume() {
      paused = false;
      if (pausedDuringShow && state.status === 'showing') {
        pausedDuringShow = false;
        showTimer = window.setTimeout(showNext, 300);
      }
    },
    isPaused() {
      return paused;
    },
    restart() {
      startPattern();
    },
  };
}
