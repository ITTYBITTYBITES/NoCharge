import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import type { GameController, PauseReason } from '../shared/types';
import {
  dailySeed,
  isInDictionary,
  MAX_GUESSES,
  submitGuess,
  symbolFor,
  WORD_LENGTH,
  wordForSeed,
  type Feedback,
  type GuessResult,
} from './engine';
import './styles.css';

const DAILY_STREAK_KEY = 'nocharge:daily:word-loom:streak';
const DAILY_SOLVED_KEY = 'nocharge:daily:word-loom:solved';

type Mode = 'daily' | 'practice';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readJson<T>(key: string): T | null {
  try {
    const raw = getBrowserStorage()?.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    getBrowserStorage()?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function mountWordLoom(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="wl" style="--wl-accent:#f97316">
      <div class="wl-hud">
        <div class="wl-hud__modes" role="group" aria-label="Word Loom mode">
          <button type="button" class="wl-hud__mode" data-wl-mode="daily" aria-pressed="true">Today's loom</button>
          <button type="button" class="wl-hud__mode" data-wl-mode="practice" aria-pressed="false">Practice</button>
        </div>
        <p class="wl-hud__status" role="status" aria-live="polite" data-wl-status></p>
        <p class="wl-hud__metrics" data-wl-metrics></p>
      </div>
      <div class="wl-stage">
        <div class="wl-board" data-wl-board aria-label="Word Loom guesses"></div>
        <div class="wl-input">
          <input data-wl-input type="text" maxlength={WORD_LENGTH} autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Type a five-letter word" />
          <button type="button" class="btn" data-wl-submit>Loom it</button>
        </div>
        <div class="wl-result" data-wl-result hidden>
          <div class="wl-result__card">
            <p class="wl-result__kicker" data-wl-result-kicker></p>
            <h2 class="wl-result__title" data-wl-result-title></h2>
            <p class="wl-result__detail" data-wl-result-detail></p>
            <button type="button" class="btn" data-wl-again>Play again</button>
          </div>
        </div>
      </div>
      <p class="wl-note">Six guesses at a five-letter word. Feedback shows ✓ correct position, ~ in the word elsewhere, ✗ absent — symbols AND colors, announced for screen readers. Daily mode uses the device-local date; the streak stays on this device only.</p>
    </div>
  `;

  const statusEl = root.querySelector<HTMLElement>('[data-wl-status]')!;
  const metricsEl = root.querySelector<HTMLElement>('[data-wl-metrics]')!;
  const boardEl = root.querySelector<HTMLElement>('[data-wl-board]')!;
  const inputEl = root.querySelector<HTMLInputElement>('[data-wl-input]')!;
  const submitBtn = root.querySelector<HTMLButtonElement>('[data-wl-submit]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-wl-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-wl-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-wl-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-wl-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-wl-again]')!;
  const modeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-wl-mode]')];

  let paused = false;
  let mode: Mode = 'daily';
  let answer = wordForSeed(dailySeed());
  let guesses: GuessResult[] = [];
  let finished = false;
  let streak = 0;
  let practiceWins = 0;

  const readStreak = () => {
    const value = readJson<{ count: number; lastDate: string }>(DAILY_STREAK_KEY);
    if (value && typeof value.count === 'number' && typeof value.lastDate === 'string') streak = value.count;
  };

  const today = () => dailySeed();

  const metrics = () => mode === 'daily' ? `Streak on this device: ${streak} day${streak === 1 ? '' : 's'}` : `Practice wins: ${practiceWins}`;

  const renderModes = () => {
    for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.wlMode === mode));
  };

  const render = () => {
    boardEl.innerHTML = '';
    for (let row = 0; row < MAX_GUESSES; row += 1) {
      const rowEl = document.createElement('div');
      rowEl.className = 'wl-row';
      const guess = guesses[row];
      for (let col = 0; col < WORD_LENGTH; col += 1) {
        const tile = document.createElement('div');
        tile.className = 'wl-tile';
        const letter = guess?.word[col]?.toUpperCase();
        if (letter) tile.textContent = letter;
        if (guess) {
          const state: Feedback = guess.feedback[col]!;
          tile.classList.add(`is-${state}`);
          tile.setAttribute('aria-label', `${letter}, ${state} (${symbolFor(state)})`);
          tile.setAttribute('data-state', symbolFor(state));
          tile.textContent = `${letter} ${symbolFor(state)}`;
        } else {
          tile.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, empty`);
        }
        rowEl.append(tile);
      }
      boardEl.append(rowEl);
    }
    metricsEl.textContent = metrics();
  };

  const finish = (result: GuessResult) => {
    finished = true;
    void play(result.solved ? 'win' : 'lose');
    if (mode === 'daily') {
      if (result.solved) {
        const record = readJson<{ count: number; lastDate: string }>(DAILY_STREAK_KEY);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const streakBase = record && record.lastDate === dailySeed(yesterday) ? record.count : 0;
        streak = streakBase + 1;
        writeJson(DAILY_STREAK_KEY, { count: streak, lastDate: today() });
        writeJson(DAILY_SOLVED_KEY, { date: today(), guesses: guesses.length });
      }
      resultKicker.textContent = result.solved ? `Solved in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}` : 'Daily missed';
      resultTitle.textContent = result.solved ? 'The loom is complete.' : `The word was ${answer.toUpperCase()}.`;
      resultDetail.textContent = `${metrics()} · Daily words are chosen by the local date.`;
    } else {
      practiceWins += result.solved ? 1 : 0;
      resultKicker.textContent = result.solved ? 'Solved' : 'Practice missed';
      resultTitle.textContent = result.solved ? 'The loom is complete.' : `The word was ${answer.toUpperCase()}.`;
      resultDetail.textContent = `${metrics()} · Practice never touches the daily streak.`;
    }
    resultEl.hidden = false;
    againBtn.focus();
  };

  const submit = () => {
    unlockAudio();
    if (paused || finished) return;
    const word = inputEl.value.trim().toLowerCase();
    if (word.length !== WORD_LENGTH) {
      statusEl.textContent = `Enter exactly ${WORD_LENGTH} letters.`;
      return;
    }
    if (!isInDictionary(word)) {
      statusEl.textContent = `${word.toUpperCase()} is not in the calm word list.`;
      inputEl.select();
      return;
    }
    const result = submitGuess(word, answer);
    guesses.push(result);
    inputEl.value = '';
    render();
    signalMeaningfulGameInteraction(root);
    if (result.solved || guesses.length >= MAX_GUESSES) {
      inputEl.disabled = true;
      submitBtn.disabled = true;
      finish(result);
    } else {
      statusEl.textContent = `${guesses.length} of ${MAX_GUESSES} guesses used.`;
      inputEl.focus();
    }
  };

  const startNew = (nextMode?: Mode) => {
    if (nextMode) mode = nextMode;
    answer = mode === 'daily' ? wordForSeed(dailySeed()) : wordForSeed(String(Date.now()));
    guesses = [];
    finished = false;
    inputEl.disabled = false;
    submitBtn.disabled = false;
    inputEl.value = '';
    resultEl.hidden = true;
    renderModes();
    render();
    statusEl.textContent = mode === 'daily'
      ? `Today's loom — streak stays on this device. Guess away.`
      : 'Practice loom — random word, no streak.';
    inputEl.focus();
  };

  submitBtn.addEventListener('click', submit);
  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submit();
  });
  inputEl.addEventListener('input', () => {
    inputEl.value = inputEl.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, WORD_LENGTH);
  });
  for (const button of modeButtons) {
    button.addEventListener('click', () => startNew(button.dataset.wlMode === 'practice' ? 'practice' : 'daily'));
  }
  againBtn.addEventListener('click', () => startNew());

  readStreak();
  startNew();

  return {
    destroy() {
      root.innerHTML = '';
    },
    pause(_reason?: PauseReason) {
      paused = true;
    },
    resume() {
      paused = false;
    },
    isPaused() {
      return paused;
    },
    restart() {
      startNew();
    },
  };
}
