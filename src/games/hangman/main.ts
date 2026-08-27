import { play } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import { loadPref, savePref } from '../shared/storage';
import type { GameController, PauseReason } from '../shared/types';
import { alphabet, canGuess, guess, MAX_WRONG, newGame, revealedWord, THEMES, type HangmanState, type HangmanTheme } from './engine';
import './styles.css';

const GAME_ID = 'hangman';
const SOLVED_KEY = `nocharge:${GAME_ID}:games-solved`;
const THEME_PREF = 'hangman-last-theme';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function loadSolved(): number {
  const value = Number(getBrowserStorage()?.getItem(SOLVED_KEY));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function saveSolved(value: number): void {
  try {
    getBrowserStorage()?.setItem(SOLVED_KEY, String(value));
  } catch {
    /* storage unavailable */
  }
}

export function mountHangman(root: HTMLElement): GameController {
  const themePref = loadPref<string>(THEME_PREF, 'nature');
  let theme = THEMES.find((candidate) => candidate.id === themePref) ?? THEMES[0]!;
  let solved = loadSolved();

  root.innerHTML = `
    <div class="hg" style="--hg-accent:#fbbf24">
      <div class="hg-hud">
        <div class="hg-hud__themes" role="group" aria-label="Word theme">
          ${THEMES.map((candidate) => `<button type="button" class="hg-hud__theme" data-hg-theme="${candidate.id}" aria-pressed="false">${candidate.label}</button>`).join('')}
        </div>
        <p class="hg-hud__status" role="status" aria-live="polite" data-hg-status></p>
        <p class="hg-hud__metrics" data-hg-metrics></p>
      </div>
      <div class="hg-stage">
        <div class="hg-gallows" data-hg-gallows aria-label="Wrong guesses figure">
          <svg viewBox="0 0 120 140" role="img" aria-hidden="true">
            <path d="M 14 136 L 14 10 L 96 10 L 96 28" fill="none" stroke="#6b7a74" stroke-width="6" stroke-linecap="round"/>
            <g data-hg-figure hidden>
              <circle cx="96" cy="46" r="14" fill="none" stroke="#6b7a74" stroke-width="5"/>
              <path d="M 96 60 L 96 96 M 96 72 L 74 84 M 96 72 L 118 84 M 96 96 L 80 122 M 96 96 L 112 122" fill="none" stroke="#6b7a74" stroke-width="5" stroke-linecap="round"/>
            </g>
          </svg>
        </div>
        <div class="hg-word" role="status" aria-live="polite" data-hg-word></div>
        <div class="hg-letters" role="group" aria-label="Letter buttons" data-hg-letters></div>
        <div class="hg-result" data-hg-result hidden>
          <div class="hg-result__card">
            <p class="hg-result__kicker" data-hg-result-kicker></p>
            <h2 class="hg-result__title" data-hg-result-title></h2>
            <p class="hg-result__detail" data-hg-result-detail></p>
            <button type="button" class="btn" data-hg-again>Play again</button>
          </div>
        </div>
      </div>
      <p class="hg-note">Guess one letter at a time. Six wrong guesses end the round; every word is a calm, common word from the chosen theme. There is no timer.</p>
    </div>
  `;

  const statusEl = root.querySelector<HTMLElement>('[data-hg-status]')!;
  const metricsEl = root.querySelector<HTMLElement>('[data-hg-metrics]')!;
  const wordEl = root.querySelector<HTMLElement>('[data-hg-word]')!;
  const lettersEl = root.querySelector<HTMLElement>('[data-hg-letters]')!;
  const figureEl = root.querySelector<SVGGElement>('[data-hg-figure]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-hg-result]')!;
  const resultKicker = root.querySelector<HTMLElement>('[data-hg-result-kicker]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-hg-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-hg-result-detail]')!;
  const againBtn = root.querySelector<HTMLButtonElement>('[data-hg-again]')!;
  const themeButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-hg-theme]')];

  let paused = false;
  let state: HangmanState = newGame(theme);

  const letterButtons = () => [...lettersEl.querySelectorAll<HTMLButtonElement>('[data-hg-letter]')];

  const metrics = () => `${theme.label} theme · solved in this browser: ${solved}`;

  const renderThemes = () => {
    for (const button of themeButtons) button.setAttribute('aria-pressed', String(button.dataset.hgTheme === theme.id));
  };

  const renderLetters = () => {
    lettersEl.innerHTML = '';
    for (const letter of alphabet()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hg-letter';
      button.dataset.hgLetter = letter;
      button.textContent = letter;
      const used = state.guessed.includes(letter);
      const correct = used && state.word.includes(letter);
      button.disabled = used || state.status !== 'playing';
      if (used) button.classList.add(correct ? 'is-correct' : 'is-wrong');
      button.setAttribute('aria-label', `${letter}${used ? correct ? ', in the word' : ', not in the word' : ''}`);
      lettersEl.append(button);
    }
  };

  const render = () => {
    wordEl.textContent = revealedWord(state);
    if (state.wrongCount === 0) figureEl.setAttribute('hidden', '');
    else figureEl.removeAttribute('hidden');
    const wrongLetters = state.guessed.filter((letter) => !state.word.includes(letter));
    statusEl.textContent = state.status === 'playing'
      ? `Wrong guesses: ${state.wrongCount} of ${MAX_WRONG}${wrongLetters.length ? ` (${wrongLetters.join(', ')})` : ''}`
      : state.status === 'won' ? 'Word solved' : 'Word missed';
    metricsEl.textContent = metrics();
    renderLetters();
  };

  const finish = () => {
    void play(state.status === 'won' ? 'win' : 'lose');
    if (state.status === 'won') {
      solved += 1;
      saveSolved(solved);
    }
    resultKicker.textContent = state.status === 'won' ? 'Solved' : 'Missed';
    resultTitle.textContent = state.status === 'won' ? `The word was ${state.word}.` : `The word was ${state.word}.`;
    resultDetail.textContent = `${statusEl.textContent} · ${metrics()}`;
    resultEl.hidden = false;
    againBtn.focus();
  };

  const submit = (letter: string) => {
    if (paused || !canGuess(state, letter)) return;
    state = guess(state, letter);
    void play(state.guessed[state.guessed.length - 1] === letter && state.word.includes(letter) ? 'flip' : 'error');
    signalMeaningfulGameInteraction(root);
    render();
    if (state.status !== 'playing') finish();
  };

  lettersEl.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-hg-letter]');
    if (button) submit(button.dataset.hgLetter ?? '');
  });

  root.addEventListener('keydown', (event) => {
    if (paused) return;
    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      submit(event.key);
      const next = letterButtons().find((button) => button.dataset.hgLetter === event.key.toUpperCase());
      next?.focus();
    }
  });

  againBtn.addEventListener('click', () => {
    state = newGame(theme);
    resultEl.hidden = true;
    render();
    letterButtons()[0]?.focus();
  });

  for (const button of themeButtons) {
    button.addEventListener('click', () => {
      theme = THEMES.find((candidate) => candidate.id === button.dataset.hgTheme) ?? THEMES[0]!;
      savePref(THEME_PREF, theme.id);
      state = newGame(theme);
      resultEl.hidden = true;
      renderThemes();
      render();
      letterButtons()[0]?.focus();
    });
  }

  renderThemes();
  render();

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
      againBtn.click();
    },
  };
}
