/**
 * A1 — Game catalog.
 *
 * The single machine-readable registry of facts about every published NoCharge
 * game. Editorial copy (title, tagline, description, artwork, guide) lives in
 * `src/content/games/*.md`; this module supplies the structured facts that
 * drive the Arcade filters, Discovery Wheel, related-games, collections
 * checks, Game Finder, Daily hub, and the registry-facts page.
 *
 * Rules:
 * - Every non-draft game in the content collection MUST have an entry here.
 *   A unit test enforces the exact match in both directions.
 * - `sessionMin`/`sessionMax` are parsed from the published `session` label so
 *   the display label and the structured facts can never disagree.
 * - Storage keys are game-specific keys only; shared keys are listed once in
 *   SHARED_STORAGE_KEYS and documented on Privacy.
 * - Facts are honest per-game values, not promises: `hasKeyboardComplete`
 *   means the full core loop is operable by keyboard alone (verified in code),
 *   `isOriginal` means the rules are not a named third-party game.
 */
import { isPassPlayGameId } from '../games/shared/pass-play';

/**
 * Minimal shape accepted by the catalog. `CollectionEntry<'games'>` is
 * structurally compatible, so pages can pass content entries directly while
 * unit tests can pass parsed frontmatter without Astro's virtual module.
 */
export interface CatalogEntryLike {
  id: string;
  data: {
    title: string;
    tagline: string;
    genre: string;
    session: string;
    artwork?: { coverSquareFallback?: string; coverLandscapeFallback?: string };
    draft?: boolean;
  };
}

export type Players = 'solo' | 'pass-and-play';
export type GameInput = 'keyboard' | 'pointer' | 'touch';
export type Pressure = 'timed' | 'untimed' | 'both';

export interface GameFacts {
  slug: string;
  title: string;
  blurb: string;
  genre: string;
  sessionLabel: string;
  sessionMin: number;
  sessionMax: number;
  players: Players;
  inputs: GameInput[];
  pressure: Pressure;
  isOriginal: boolean;
  releasedAt: string;
  updatedAt: string;
  storageKeys: string[];
  hasKeyboardComplete: boolean;
  guideSlug: string;
  artSquare: string;
  artLandscape: string;
}

/**
 * Shared keys written by the game shell or shared plumbing for every game.
 * Documented once on Privacy; not repeated per game.
 */
export const SHARED_STORAGE_KEYS = [
  'nocharge:pref:game-muted',
  'nocharge:pref:sound-enabled',
  'nocharge:pref:sound-volume',
  'nocharge:pref:ambient-sound',
  'nocharge:pref:recently-played',
] as const;

type BaseFacts = Omit<GameFacts, 'slug' | 'title' | 'blurb' | 'genre' | 'sessionLabel' | 'sessionMin' | 'sessionMax' | 'guideSlug' | 'artSquare' | 'artLandscape'>;

const ALL_INPUTS: GameInput[] = ['keyboard', 'pointer', 'touch'];
const POINTER_ONLY: GameInput[] = ['pointer', 'touch'];

/** Machine facts not expressed in editorial frontmatter. */
const BASE_FACTS: Record<string, BaseFacts> = {
  'memory-match': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-15', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:memory-match:high', 'nocharge:memory-match:best-moves'],
  },
  'word-tile-rush': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'timed', isOriginal: true,
    releasedAt: '2026-08-15', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:word-tile-rush:high'],
  },
  'color-flip': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'both', isOriginal: true,
    releasedAt: '2026-08-15', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:color-flip:high', 'nocharge:color-flip-turn-based:high', 'nocharge:pref:color-flip-rotation'],
  },
  'beacon-lattice': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: true,
    releasedAt: '2026-08-19', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:beacon-lattice:high', 'nocharge:pref:beacon-lattice-progress'],
  },
  klondike: {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-15', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:klondike:games-won', 'nocharge:klondike:best-moves', 'nocharge:pref:klondike-draw-mode'],
  },
  freecell: {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-15', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:freecell:games-won'],
  },
  nonogram: {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:nonogram:puzzles-revealed'],
  },
  'twenty-forty-eight': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:2048:best-tile'],
  },
  'tile-garden': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: true,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:tile-garden:best-tier'],
  },
  'word-search': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-23', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:word-search:puzzles-solved', 'nocharge:word-search:last-list'],
  },
  'mini-sudoku': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-23', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:sudoku:puzzles-solved', 'nocharge:sudoku:current-puzzle', 'nocharge:pref:sudoku-pencil-marks'],
  },
  'tic-tac-toe': {
    players: 'pass-and-play', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:passplay:match:tic-tac-toe'],
  },
  'dots-and-boxes': {
    players: 'pass-and-play', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:passplay:match:dots-and-boxes'],
  },
  'four-in-a-row': {
    players: 'pass-and-play', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:passplay:match:four-in-a-row'],
  },
  reversi: {
    players: 'pass-and-play', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:passplay:match:reversi'],
  },
  'last-token': {
    players: 'pass-and-play', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: true,
    storageKeys: ['nocharge:passplay:match:last-token'],
  },
  'pass-the-picture': {
    players: 'pass-and-play', inputs: POINTER_ONLY, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-22', updatedAt: '2026-08-24', hasKeyboardComplete: false,
    storageKeys: ['nocharge:passplay:match:pass-the-picture'],
  },
  minesweeper: {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:minesweeper:games-won', 'nocharge:minesweeper:best-time', 'nocharge:pref:minesweeper-last-size'],
  },
  hangman: {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:hangman:games-solved', 'nocharge:pref:hangman-last-theme'],
  },
  'lights-out': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:lights-out:puzzles-solved', 'nocharge:lights-out:best-moves'],
  },
  simon: {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:simon:best-length', 'nocharge:pref:simon-calm'],
  },
  'sudoku-9x9': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:sudoku9:current-puzzle', 'nocharge:sudoku9:puzzles-solved', 'nocharge:pref:sudoku-pencil-marks'],
  },
  gomoku: {
    players: 'pass-and-play', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:passplay:match:gomoku'],
  },
  'nine-mens-morris': {
    players: 'pass-and-play', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:passplay:match:nine-mens-morris'],
  },
  'word-loom': {
    players: 'solo', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: true,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:daily:word-loom:streak', 'nocharge:daily:word-loom:solved'],
  },
  checkers: {
    players: 'pass-and-play', inputs: ALL_INPUTS, pressure: 'untimed', isOriginal: false,
    releasedAt: '2026-08-27', updatedAt: '2026-08-27', hasKeyboardComplete: true,
    storageKeys: ['nocharge:passplay:match:checkers'],
  },
};

type GameEntry = CatalogEntryLike;

/** Parse the numeric range from a published session label, e.g. "5–20 min". */
export function parseSessionRange(label: string): { min: number; max: number } {
  const numbers = [...label.matchAll(/\d+/g)].map((match) => Number(match[0]));
  if (numbers.length === 0) return { min: 1, max: 10 };
  if (numbers.length === 1) return { min: Math.max(1, Math.floor(numbers[0] / 2)), max: numbers[0] };
  const [first, second] = numbers;
  const min = Math.min(first, second);
  const max = Math.max(first, second);
  return { min: Math.max(1, min), max: Math.max(min, max) };
}

export function buildFacts(entry: GameEntry): GameFacts {
  const base = BASE_FACTS[entry.id];
  if (!base) throw new Error(`Game catalog missing facts for "${entry.id}". Add it to src/lib/game-catalog.ts.`);
  const session = parseSessionRange(entry.data.session);
  return {
    slug: entry.id,
    title: entry.data.title,
    blurb: entry.data.tagline,
    genre: entry.data.genre,
    sessionLabel: entry.data.session,
    sessionMin: session.min,
    sessionMax: session.max,
    players: base.players,
    inputs: base.inputs,
    pressure: base.pressure,
    isOriginal: base.isOriginal,
    releasedAt: base.releasedAt,
    updatedAt: base.updatedAt,
    storageKeys: base.storageKeys,
    hasKeyboardComplete: base.hasKeyboardComplete,
    guideSlug: entry.id,
    artSquare: entry.data.artwork?.coverSquareFallback ?? `/game-art/${entry.id}/cover-square.jpg`,
    artLandscape: entry.data.artwork?.coverLandscapeFallback ?? `/game-art/${entry.id}/cover-landscape.jpg`,
  };
}

export function buildGameFacts(entries: GameEntry[]): GameFacts[] {
  return entries.map(buildFacts);
}

export function allFacts(entries: GameEntry[]): GameFacts[] {
  return buildGameFacts(entries.filter((entry) => !entry.data.draft));
}

/** Ensure every machine fact agrees with the shared runtime sources. */
export function validateCatalog(entries: GameEntry[]): string[] {
  const errors: string[] = [];
  const published = entries.filter((entry) => !entry.data.draft);
  for (const entry of published) {
    if (!BASE_FACTS[entry.id]) errors.push(`missing catalog entry: ${entry.id}`);
    const facts = buildFacts(entry);
    const passPlay = isPassPlayGameId(entry.id);
    if (passPlay && facts.players !== 'pass-and-play') errors.push(`wrong players for pass play: ${entry.id}`);
    if (!passPlay && facts.players !== 'solo') errors.push(`wrong players for solo game: ${entry.id}`);
    if (facts.sessionMax < facts.sessionMin) errors.push(`session range inverted: ${entry.id}`);
    if (facts.inputs.length === 0) errors.push(`no inputs: ${entry.id}`);
    if (facts.hasKeyboardComplete && !facts.inputs.includes('keyboard')) {
      errors.push(`keyboard-complete but keyboard not listed: ${entry.id}`);
    }
  }
  for (const slug of Object.keys(BASE_FACTS)) {
    if (!published.some((entry) => entry.id === slug)) errors.push(`stale catalog entry: ${slug}`);
  }
  return errors;
}

export interface FacetFilter {
  players?: Players | 'any';
  pressure?: Pressure | 'any';
  maxSession?: number;
  minSession?: number;
  keyboardComplete?: boolean;
  pointer?: boolean;
  touch?: boolean;
  genre?: string;
}

export function matchesFacets(facts: GameFacts, filter: FacetFilter): boolean {
  if (filter.players && filter.players !== 'any' && facts.players !== filter.players) return false;
  if (filter.pressure && filter.pressure !== 'any') {
    if (filter.pressure === 'timed' && facts.pressure === 'untimed') return false;
    if (filter.pressure === 'untimed' && facts.pressure === 'timed') return false;
  }
  if (filter.maxSession && facts.sessionMax > filter.maxSession) return false;
  if (filter.minSession && facts.sessionMax < filter.minSession) return false;
  if (filter.keyboardComplete && !facts.hasKeyboardComplete) return false;
  if (filter.pointer && !facts.inputs.includes('pointer')) return false;
  if (filter.touch && !facts.inputs.includes('touch')) return false;
  if (filter.genre && facts.genre !== filter.genre) return false;
  return true;
}

/** Review date used for "New"/"Updated" chips and the registry facts page. */
export const REGISTRY_REVIEW_DATE = '2026-08-27';

/** Days after release a game is still labelled "New" in the catalog UI. */
export const NEW_RELEASE_WINDOW_DAYS = 60;

/** Days after an update a game shows an "Updated" chip (and only when updated after release). */
export const UPDATED_WINDOW_DAYS = 30;

export function daysSince(reference: string, target: string): number {
  const start = new Date(`${reference}T00:00:00Z`).getTime();
  const end = new Date(`${target}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function isNewRelease(facts: GameFacts, reviewDate = REGISTRY_REVIEW_DATE): boolean {
  return daysSince(facts.releasedAt, reviewDate) <= NEW_RELEASE_WINDOW_DAYS;
}

export function isRecentlyUpdated(facts: GameFacts, reviewDate = REGISTRY_REVIEW_DATE): boolean {
  return facts.updatedAt > facts.releasedAt && daysSince(facts.updatedAt, reviewDate) <= UPDATED_WINDOW_DAYS;
}

/** Related games by same genre first, then nearest session length, then title. */
export function relatedGames(facts: GameFacts, all: GameFacts[], limit = 3): GameFacts[] {
  return all
    .filter((candidate) => candidate.slug !== facts.slug)
    .map((candidate) => ({
      candidate,
      genreMatch: candidate.genre === facts.genre ? 0 : 1,
      sessionDistance: Math.abs(candidate.sessionMax - facts.sessionMax),
    }))
    .sort((a, b) => a.genreMatch - b.genreMatch || a.sessionDistance - b.sessionDistance || a.candidate.title.localeCompare(b.candidate.title))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
