/**
 * Shared Pass &amp; Play plumbing: two players, one device.
 *
 * Everything in this module is local to the page. There is no network use, no
 * account, and no per-player profile. Player names live only in memory for the
 * current browser session; the only persisted values are bounded per-game
 * match records under `nocharge:passplay:*`.
 */

export type PassPlayPlayer = 1 | 2;

/** The Pass &amp; Play games, in registry order. */
export const PASS_PLAY_GAME_IDS = [
  'tic-tac-toe',
  'dots-and-boxes',
  'four-in-a-row',
  'reversi',
  'last-token',
  'pass-the-picture',
  'gomoku',
  'nine-mens-morris',
  'checkers',
] as const;

export type PassPlayGameId = (typeof PASS_PLAY_GAME_IDS)[number];

export function isPassPlayGameId(value: unknown): value is PassPlayGameId {
  return typeof value === 'string' && (PASS_PLAY_GAME_IDS as readonly string[]).includes(value);
}

export interface PassPlayPlayerNames {
  p1: string;
  p2: string;
}

export const DEFAULT_PLAYER_NAMES: Readonly<PassPlayPlayerNames> = Object.freeze({
  p1: 'Player 1',
  p2: 'Player 2',
});

/** Names stay short so the handoff heading and tally always fit at 320 px. */
export const PLAYER_NAME_MAX_LENGTH = 18;

/**
 * Session-only player names. Deliberately never written to localStorage,
 * sessionStorage, cookies, or the URL — reloading the page restores the
 * defaults, and no name ever leaves the device.
 */
const sessionNames: PassPlayPlayerNames = { p1: DEFAULT_PLAYER_NAMES.p1, p2: DEFAULT_PLAYER_NAMES.p2 };

/** Collapse whitespace, cap length, and fall back to the default name. */
export function normalizePlayerName(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const collapsed = raw.replace(/\s+/g, ' ').trim().slice(0, PLAYER_NAME_MAX_LENGTH);
  return collapsed.length > 0 ? collapsed : fallback;
}

export function getPlayerNames(): Readonly<PassPlayPlayerNames> {
  return { p1: sessionNames.p1, p2: sessionNames.p2 };
}

export function setPlayerName(player: PassPlayPlayer, raw: string): void {
  if (player === 1) sessionNames.p1 = normalizePlayerName(raw, DEFAULT_PLAYER_NAMES.p1);
  else sessionNames.p2 = normalizePlayerName(raw, DEFAULT_PLAYER_NAMES.p2);
}

/** Reset to the default names. Used by tests; play never needs it. */
export function resetPlayerNames(): void {
  sessionNames.p1 = DEFAULT_PLAYER_NAMES.p1;
  sessionNames.p2 = DEFAULT_PLAYER_NAMES.p2;
}

export function playerName(names: Readonly<PassPlayPlayerNames>, player: PassPlayPlayer): string {
  return player === 1 ? names.p1 : names.p2;
}

export function otherPlayer(player: PassPlayPlayer): PassPlayPlayer {
  return player === 1 ? 2 : 1;
}

/**
 * Match tally line, e.g. "Player 1 leads 2–1" or "Tied 1–1". A level tally is
 * described without a leader, and 0–0 stays "Tied 0–0" so the match is still
 * announced as level rather than silent.
 */
export function formatMatchTally(names: Readonly<PassPlayPlayerNames>, wins: readonly [number, number]): string {
  const [a, b] = wins;
  const safeA = Number.isFinite(a) && a >= 0 ? Math.floor(a) : 0;
  const safeB = Number.isFinite(b) && b >= 0 ? Math.floor(b) : 0;
  if (safeA === safeB) return `Tied ${safeA}–${safeB}`;
  const leader = safeA > safeB ? names.p1 : names.p2;
  return `${leader} leads ${Math.max(safeA, safeB)}–${Math.min(safeA, safeB)}`;
}

/** "2–1" style match score. */
export function formatMatchScore(score: readonly [number, number]): string {
  const [a, b] = score;
  const safeA = Number.isFinite(a) && a >= 0 ? Math.floor(a) : 0;
  const safeB = Number.isFinite(b) && b >= 0 ? Math.floor(b) : 0;
  return `${safeA}–${safeB}`;
}

/** Polite live-region text announcing whose turn it now is. */
export function turnAnnouncement(
  names: Readonly<PassPlayPlayerNames>,
  player: PassPlayPlayer,
  context?: string,
): string {
  const name = playerName(names, player);
  const base = `${name}, it is your turn.`;
  return context ? `${base} ${context}` : base;
}

/* ------------------------------------------------------------------ *
 * Bounded local match records (read by My Arcade, never uploaded).
 * ------------------------------------------------------------------ */

export type PassPlayMatchResult = 'p1' | 'p2' | 'draw' | 'shared';

export interface PassPlayMatchRecord {
  gameId: string;
  /** Mode label exactly as the game shows it, e.g. "4×4 · 4 in a row". */
  mode: string;
  result: PassPlayMatchResult;
  score: readonly [number, number];
  /** Epoch milliseconds. */
  finishedAt: number;
}

/** Exact storage prefix documented in docs/MY_ARCADE_DATA_MODEL.md. */
export const PASS_PLAY_MATCH_KEY_PREFIX = 'nocharge:passplay:match:';

/** One bounded record per game — there is deliberately no match history. */
export function passPlayMatchKey(gameId: string): string {
  return `${PASS_PLAY_MATCH_KEY_PREFIX}${gameId}`;
}

const MAX_RECORD_RAW_LENGTH = 2048;
const MAX_MODE_LENGTH = 64;
const MAX_TIMESTAMP = 8.64e15;

function isMatchResult(value: unknown): value is PassPlayMatchResult {
  return value === 'p1' || value === 'p2' || value === 'draw' || value === 'shared';
}

/** Parse one stored match record defensively; anything unexpected reads as absent. */
export function parsePassPlayMatchRecord(raw: string | null): PassPlayMatchRecord | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_RECORD_RAW_LENGTH) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Partial<PassPlayMatchRecord>;
  if (typeof record.gameId !== 'string' || record.gameId.length === 0) return null;
  if (typeof record.mode !== 'string' || record.mode.length === 0 || record.mode.length > MAX_MODE_LENGTH) return null;
  if (!isMatchResult(record.result)) return null;
  const score = record.score;
  if (
    !Array.isArray(score) ||
    score.length !== 2 ||
    !score.every((part) => typeof part === 'number' && Number.isFinite(part) && part >= 0 && part <= 1e6)
  ) {
    return null;
  }
  if (typeof record.finishedAt !== 'number' || !Number.isFinite(record.finishedAt) || record.finishedAt < 0 || record.finishedAt > MAX_TIMESTAMP) {
    return null;
  }
  return {
    gameId: record.gameId,
    mode: record.mode,
    result: record.result,
    score: [Math.floor(score[0]), Math.floor(score[1])],
    finishedAt: Math.floor(record.finishedAt),
  };
}

export interface HandoffRecordStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readPassPlayMatchRecord(storage: HandoffRecordStorage | undefined, gameId: string): PassPlayMatchRecord | null {
  if (!storage) return null;
  try {
    return parsePassPlayMatchRecord(storage.getItem(passPlayMatchKey(gameId)));
  } catch {
    return null;
  }
}

/**
 * Save the most recent match for one game. Storage is bounded by design:
 * exactly one record per game, overwritten in place, never appended to.
 */
export function savePassPlayMatchRecord(
  storage: HandoffRecordStorage | undefined,
  record: PassPlayMatchRecord,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      passPlayMatchKey(record.gameId),
      JSON.stringify({
        gameId: record.gameId,
        mode: record.mode,
        result: record.result,
        score: [record.score[0], record.score[1]],
        finishedAt: record.finishedAt,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

/** Result column value used by My Arcade. */
export function describeMatchResult(record: PassPlayMatchRecord): string {
  if (record.result === 'draw') return 'Draw';
  if (record.result === 'shared') return 'Shared picture';
  return record.result === 'p1' ? 'Player 1' : 'Player 2';
}

/* ------------------------------------------------------------------ *
 * Handoff screen: the shared "Pass to {Player}" component.
 * ------------------------------------------------------------------ */

/**
 * Canonical handoff markup. `HandoffScreen.astro` renders this inside a
 * `<template>` so game code can clone it; the constant remains the single
 * source of truth when no template is present.
 */
export const HANDOFF_SCREEN_TEMPLATE = `
<div class="pp-handoff__backdrop" data-pp="backdrop"></div>
<div class="pp-handoff__panel" role="dialog" aria-modal="true" aria-labelledby="pp-handoff-title" data-pp="panel">
  <p class="pp-handoff__kicker">Pass &amp; Play</p>
  <h2 class="pp-handoff__title" id="pp-handoff-title" data-pp="title">Pass to Player 2</h2>
  <p class="pp-handoff__context" data-pp="context" hidden></p>
  <p class="pp-handoff__tally" data-pp="tally" hidden></p>
  <p class="pp-handoff__live" role="status" aria-live="polite" data-pp="live"></p>
  <div class="pp-handoff__names">
    <div class="pp-handoff__field">
      <label class="pp-handoff__label" for="pp-handoff-name-1">Player 1 name</label>
      <input class="pp-handoff__input" id="pp-handoff-name-1" data-pp-name="1" type="text" maxlength="${PLAYER_NAME_MAX_LENGTH}" autocomplete="off" enterkeyhint="done">
    </div>
    <div class="pp-handoff__field">
      <label class="pp-handoff__label" for="pp-handoff-name-2">Player 2 name</label>
      <input class="pp-handoff__input" id="pp-handoff-name-2" data-pp-name="2" type="text" maxlength="${PLAYER_NAME_MAX_LENGTH}" autocomplete="off" enterkeyhint="done">
    </div>
  </div>
  <button type="button" class="btn pp-handoff__continue" data-pp="continue">Continue</button>
  <p class="pp-handoff__hint" data-pp="hint">Hand the device over, then continue.</p>
</div>`;

export interface HandoffScreenOptions {
  /** The player the device is being passed to. */
  playerTo: PassPlayPlayer;
  /** Optional context line, e.g. "Round 3 · first to 3 round wins". */
  context?: string;
  /** Round-win tally shown while a match is running, e.g. [2, 1]. */
  tally?: readonly [number, number];
  /**
   * Keep the game surface visible through a translucent backdrop. Used by
   * Pass the Picture, whose drawing is shared rather than secret.
   */
  keepVisible?: boolean;
  /**
   * CSS selectors of elements to hide while the handoff is open. Reserved for
   * future hidden-information games; none of the current six games use it.
   */
  hideSelectors?: readonly string[];
  /** Called after the handoff closes. */
  onContinue?: () => void;
}

export interface HandoffScreenController {
  /** The mounted handoff element (already appended to `mount`). */
  element: HTMLElement;
  /** Close the handoff, restore focus, and run `onContinue`. */
  close: () => void;
}

function uniqueHandoffId(root: HTMLElement, base: string): string {
  let id = base;
  let attempt = 2;
  while (root.ownerDocument.getElementById(id)) {
    id = `${base}-${attempt}`;
    attempt += 1;
  }
  return id;
}

/**
 * Mount a full-screen handoff over `mount`. By default the backdrop is opaque
 * so the previous player's view of the board is covered; `keepVisible` makes
 * it translucent for shared-surface games.
 *
 * The handoff manages its own focus: the Continue button receives focus when
 * it opens, Tab cycles inside the dialog, Escape continues, and focus returns
 * to the previously focused element afterwards.
 */
export function createHandoffScreen(
  mount: HTMLElement,
  options: HandoffScreenOptions,
): HandoffScreenController {
  const doc = mount.ownerDocument;
  const host = doc.createElement('div');
  host.className = 'pp-handoff';
  host.dataset.ppHandoff = '';

  const template = doc.querySelector<HTMLTemplateElement>('template[data-handoff-screen]');
  if (template) host.append(template.content.cloneNode(true));
  else {
    const inline = doc.createElement('template');
    inline.innerHTML = HANDOFF_SCREEN_TEMPLATE;
    host.append(inline.content.cloneNode(true));
  }

  if (options.keepVisible) host.classList.add('pp-handoff--shared');

  const title = host.querySelector<HTMLElement>('[data-pp="title"]')!;
  const panel = host.querySelector<HTMLElement>('[data-pp="panel"]')!;
  const contextEl = host.querySelector<HTMLElement>('[data-pp="context"]')!;
  const tallyEl = host.querySelector<HTMLElement>('[data-pp="tally"]')!;
  const live = host.querySelector<HTMLElement>('[data-pp="live"]')!;
  const hint = host.querySelector<HTMLElement>('[data-pp="hint"]')!;
  const nameInputs = [...host.querySelectorAll<HTMLInputElement>('[data-pp-name]')];
  const continueButton = host.querySelector<HTMLButtonElement>('[data-pp="continue"]')!;

  // Dialog ids can collide when a fresh handoff mounts before an old one is
  // garbage collected; make this instance's ids unique in the document.
  const titleId = uniqueHandoffId(mount, 'pp-handoff-title');
  title.id = titleId;
  panel.setAttribute('aria-labelledby', titleId);
  for (const input of nameInputs) {
    const label = host.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
    const id = uniqueHandoffId(mount, input.id);
    input.id = id;
    label?.setAttribute('for', id);
  }

  const names = getPlayerNames();
  const to = options.playerTo;
  const from = otherPlayer(to);

  const renderCopy = () => {
    const current = getPlayerNames();
    title.textContent = `Pass to ${playerName(current, to)}`;
    hint.textContent = `${playerName(current, from)}, hand the device to ${playerName(current, to)}, then continue.`;
    for (const input of nameInputs) {
      const slot = input.dataset.ppName === '1' ? 1 : 2;
      if (doc.activeElement !== input) input.value = playerName(current, slot);
    }
    live.textContent = '';
  };

  if (options.context) {
    contextEl.textContent = options.context;
    contextEl.hidden = false;
  }
  if (options.tally) {
    tallyEl.textContent = formatMatchTally(names, options.tally);
    tallyEl.hidden = false;
  }
  renderCopy();

  // Hide the matched elements (reserved for future hidden-info games) and
  // remember them so close() can restore exactly what was hidden.
  const hiddenTargets: HTMLElement[] = [];
  for (const selector of options.hideSelectors ?? []) {
    let targets: NodeList;
    try {
      targets = mount.querySelectorAll(selector);
    } catch {
      continue;
    }
    for (const node of targets) {
      if (node instanceof HTMLElement && !node.hidden) {
        node.hidden = true;
        hiddenTargets.push(node);
      }
    }
  }

  const previousFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
  mount.append(host);
  continueButton.focus();

  const announceTurn = () => {
    const current = getPlayerNames();
    live.textContent = turnAnnouncement(current, to, options.context);
  };
  // Announce one frame later so screen readers register the new dialog first.
  const view = doc.defaultView;
  const announceTimer = view?.setTimeout(announceTurn, 0);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    if (announceTimer !== undefined) view?.clearTimeout(announceTimer);
    view?.removeEventListener('keydown', onKeydown, true);
    host.remove();
    for (const target of hiddenTargets) target.hidden = false;
    if (options.onContinue) options.onContinue();
    if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    else {
      const fallback = mount.querySelector<HTMLElement>('[data-pp-focus-return]');
      fallback?.focus({ preventScroll: true });
    }
  };

  const focusables = () =>
    [continueButton, ...nameInputs].filter((el) => el.offsetParent !== null || el === doc.activeElement);

  const trapTab = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  function onKeydown(event: KeyboardEvent) {
    if (closed) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Enter' && doc.activeElement instanceof HTMLInputElement && nameInputs.includes(doc.activeElement)) {
      // Enter in a name field confirms the handoff, like pressing Continue.
      event.preventDefault();
      close();
      return;
    }
    trapTab(event);
  }

  view?.addEventListener('keydown', onKeydown, true);
  continueButton.addEventListener('click', close);
  for (const input of nameInputs) {
    input.addEventListener('input', () => {
      setPlayerName(input.dataset.ppName === '1' ? 1 : 2, input.value);
      renderCopy();
    });
  }

  return {
    element: host,
    close,
  };
}
