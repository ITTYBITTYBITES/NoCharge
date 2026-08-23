import { play, unlockAudio } from '../shared/audio';
import { signalMeaningfulGameInteraction } from '../shared/recently-played';
import type { GameController, PauseReason } from '../shared/types';
import {
  createHandoffScreen,
  getPlayerNames,
  playerName,
  savePassPlayMatchRecord,
  type HandoffScreenController,
} from '../shared/pass-play';
import '../shared/pass-play-chrome.css';
import {
  isRoundOver,
  LAST_TOKEN_PRESETS,
  legalTakes,
  openingPlayerForRound,
  takeTokens,
  totalTokens,
  type LastTokenPiles,
} from './engine';
import './styles.css';

const GAME_ID = 'last-token';

function getBrowserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function mountLastToken(root: HTMLElement): GameController {
  root.innerHTML = `
    <div class="pp-game lt" style="--pp-accent:#fb923c">
      <div class="pp-hud">
        <div class="pp-hud__modes" role="group" aria-label="Last Token preset">
          ${LAST_TOKEN_PRESETS.map(
            (preset, index) =>
              `<button type="button" class="pp-hud__mode" data-lt-preset="${preset.id}" aria-pressed="${index === 0}">${preset.label}</button>`,
          ).join('')}
        </div>
        <p class="pp-hud__status" role="status" aria-live="polite" data-lt-status></p>
      </div>
      <div class="pp-stage">
        <div class="lt__piles" role="group" aria-label="Token piles" data-lt-piles></div>
        <div class="pp-result" data-lt-result hidden>
          <div class="pp-result__card">
            <p class="pp-result__kicker">Round complete</p>
            <h2 class="pp-result__title" data-lt-result-title></h2>
            <p class="pp-result__detail" data-lt-result-detail></p>
            <div class="pp-result__actions">
              <button type="button" class="btn" data-lt-next>Next round</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const pilesEl = root.querySelector<HTMLElement>('[data-lt-piles]')!;
  const statusEl = root.querySelector<HTMLElement>('[data-lt-status]')!;
  const resultEl = root.querySelector<HTMLElement>('[data-lt-result]')!;
  const resultTitle = root.querySelector<HTMLElement>('[data-lt-result-title]')!;
  const resultDetail = root.querySelector<HTMLElement>('[data-lt-result-detail]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-lt-next]')!;
  const presetButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-lt-preset]')];
  const stage = () => root.querySelector<HTMLElement>('.pp-stage')!;

  let paused = false;
  let preset = LAST_TOKEN_PRESETS[0]!;
  let piles: LastTokenPiles = [...preset.piles];
  let turn: 1 | 2 = 1;
  let round = 1;
  let finished = false;
  let handoff: HandoffScreenController | null = null;

  const status = (text: string) => {
    statusEl.textContent = text;
  };

  const turnStatus = () => {
    status(`${playerName(getPlayerNames(), turn)} — take 1, 2, or 3 tokens from one pile. Whoever takes the last token loses.`);
  };

  const closeHandoff = () => {
    handoff?.close();
    handoff = null;
  };

  const showHandoff = (player: 1 | 2) => {
    closeHandoff();
    if (paused) return;
    handoff = createHandoffScreen(stage(), {
      playerTo: player,
      context: `Round ${round} · ${totalTokens(piles)} tokens left`,
      onContinue: () => {
        handoff = null;
        pilesEl.querySelector<HTMLButtonElement>('[data-lt-take]:not([disabled])')?.focus({ preventScroll: true });
      },
    });
  };

  const buildPiles = () => {
    pilesEl.innerHTML = '';
    piles.forEach((pile, index) => {
      const group = document.createElement('div');
      group.className = 'lt__pile';
      group.dataset.ltPileGroup = String(index);

      const row = document.createElement('div');
      row.className = 'lt__tokens';
      row.dataset.ltTokens = String(index);
      row.setAttribute('role', 'img');
      row.setAttribute('aria-label', `Pile ${index + 1}: ${pile} ${pile === 1 ? 'token' : 'tokens'} left`);
      for (let token = 0; token < preset.piles[index]!; token += 1) {
        const dot = document.createElement('span');
        dot.className = token < pile ? 'lt__token' : 'lt__token is-taken';
        dot.setAttribute('aria-hidden', 'true');
        row.appendChild(dot);
      }
      group.appendChild(row);

      const actions = document.createElement('div');
      actions.className = 'lt__actions';
      actions.dataset.ltActions = String(index);
      for (const count of legalTakes(pile)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lt__take';
        button.dataset.ltTake = String(count);
        button.dataset.ltPile = String(index);
        button.setAttribute('aria-label', `Take ${count} ${count === 1 ? 'token' : 'tokens'} from pile ${index + 1}`);
        button.textContent = `Take ${count}`;
        button.addEventListener('click', () => {
          if (paused || finished) return;
          unlockAudio();
          onTake(index, count);
        });
        actions.appendChild(button);
      }
      group.appendChild(actions);
      pilesEl.appendChild(group);
    });
  };

  const finishRound = (loser: 1 | 2) => {
    finished = true;
    const names = getPlayerNames();
    const winner = loser === 1 ? 2 : 1;
    const title = `${playerName(names, winner)} wins the round`;
    const detail = `${playerName(names, loser)} took the last token.`;
    status(`${title}. ${detail}`);
    resultTitle.textContent = title;
    resultDetail.textContent = detail;
    resultEl.hidden = false;
    savePassPlayMatchRecord(getBrowserStorage(), {
      gameId: GAME_ID,
      mode: preset.label,
      result: winner === 1 ? 'p1' : 'p2',
      score: winner === 1 ? [1, 0] : [0, 1],
      finishedAt: Date.now(),
    });
    void play('error').then(() => play('win'));
    nextBtn.focus({ preventScroll: true });
  };

  const onTake = (pileIndex: number, count: number) => {
    if (finished) return;
    const next = takeTokens(piles, pileIndex, count);
    if (next === null) return;

    signalMeaningfulGameInteraction(root);
    piles = next;
    void play('place');
    buildPiles();

    if (isRoundOver(piles)) {
      finishRound(turn);
      return;
    }

    turn = turn === 1 ? 2 : 1;
    turnStatus();
    showHandoff(turn);
  };

  const startRound = (nextRound: number) => {
    round = nextRound;
    piles = [...preset.piles];
    turn = openingPlayerForRound(round);
    finished = false;
    resultEl.hidden = true;
    closeHandoff();
    buildPiles();
    turnStatus();
    showHandoff(turn);
  };

  const reset = (presetId?: string) => {
    if (presetId) preset = LAST_TOKEN_PRESETS.find((candidate) => candidate.id === presetId) ?? preset;
    for (const button of presetButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.ltPreset === preset.id));
    }
    startRound(1);
  };

  // Left/right arrows move between the Take buttons of one pile; Up/Down
  // moves between piles at the same take amount.
  pilesEl.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!(event.target instanceof HTMLElement)) return;
    const button = event.target.closest<HTMLElement>('[data-lt-take]');
    if (!button) return;
    const pile = Number(button.dataset.ltPile);
    const take = button.dataset.ltTake;
    let target: HTMLElement | null = null;
    if (event.key === 'ArrowRight') {
      target = pilesEl.querySelector(`[data-lt-actions="${pile}"] [data-lt-take="${Number(take) + 1}"]`);
    } else if (event.key === 'ArrowLeft') {
      target = pilesEl.querySelector(`[data-lt-actions="${pile}"] [data-lt-take="${Number(take) - 1}"]`);
    } else if (event.key === 'ArrowDown') {
      target = pilesEl.querySelector(`[data-lt-actions="${pile + 1}"] [data-lt-take="${take}"]`);
    } else if (event.key === 'ArrowUp') {
      target = pilesEl.querySelector(`[data-lt-actions="${pile - 1}"] [data-lt-take="${take}"]`);
    } else {
      return;
    }
    event.preventDefault();
    if (paused || finished) return;
    if (target instanceof HTMLButtonElement && !target.disabled) target.focus({ preventScroll: true });
  });

  for (const button of presetButtons) {
    button.addEventListener('click', () => {
      if (paused) return;
      unlockAudio();
      reset(button.dataset.ltPreset);
    });
  }

  nextBtn.addEventListener('click', () => {
    if (paused) return;
    unlockAudio();
    startRound(round + 1);
  });

  reset();

  return {
    destroy() {
      closeHandoff();
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
      reset();
    },
  };
}
