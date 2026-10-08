import {
  cellKind,
  computeCoverage,
  coverageBand,
  coverageSummary,
  inBounds,
  isBlocked,
  isExactCover,
  isVoid,
} from './coverage';
import {
  allowedTypesForCell,
  clonePlacements,
  findPlacement,
  inventoryRemaining,
  isCellEligible,
  playerBeaconCount,
} from './rules';
import type {
  ActionResult,
  BeaconType,
  Cell,
  CellView,
  CoverageBand,
  GameState,
  InvalidReason,
  PuzzleDefinition,
} from './types';
import { sameCell } from './types';
import { message, type Message } from '../../i18n/message';
import type { MessageKey } from '../../i18n/messages';

// The engine is pure logic. It returns message keys and parameters; the UI
// formats them in the active locale (see main.ts). No English text lives here.

const REASON_KEYS: Record<InvalidReason, MessageKey> = {
  'cell-blocked': 'beacon.err.blocked',
  'cell-void': 'beacon.err.outside',
  paused: 'beacon.err.paused',
  'placement-not-allowed': 'beacon.err.notAllowed',
  'type-not-allowed': 'beacon.err.typeNotHere',
  'inventory-exhausted': 'beacon.err.noneLeft',
  'locked-beacon': 'beacon.err.locked',
  occupied: 'beacon.err.occupied',
  'empty-cell': 'beacon.err.nothingToRemove',
  'unknown-type': 'beacon.err.chooseType',
  'out-of-bounds': 'beacon.err.outsideBoard',
  'already-complete': 'beacon.err.solved',
  'nothing-to-undo': 'beacon.err.nothingToUndo',
  'type-unavailable': 'beacon.err.typeUnavailable',
};

const TYPE_KEYS: Record<BeaconType, MessageKey> = {
  cross: 'beacon.type.cross',
  diagonal: 'beacon.type.diagonal',
  horizontal: 'beacon.type.horizontal',
  vertical: 'beacon.type.vertical',
};

const BAND_KEYS: Record<CoverageBand, MessageKey> = {
  gap: 'beacon.band.gap',
  exact: 'beacon.band.exact',
  overlap: 'beacon.band.overlap',
};

/** Localizable name of a beacon type, for use as a nested message parameter. */
export function beaconTypeName(type: BeaconType): Message {
  return message(TYPE_KEYS[type]);
}

export function coverageBandName(band: CoverageBand): Message {
  return message(BAND_KEYS[band]);
}

function fail(reason: InvalidReason): ActionResult {
  return { ok: false, reason, message: message(REASON_KEYS[reason]) };
}

function ok(key: MessageKey, params?: Record<string, string | number | Message>): ActionResult {
  return { ok: true, message: message(key, params) };
}

export function createState(puzzle: PuzzleDefinition): GameState {
  const placements = clonePlacements(puzzle.locked);
  return {
    puzzleId: puzzle.id,
    selectedType: puzzle.available[0] ?? null,
    cursor: { x: 0, y: 0 },
    placements,
    coverage: computeCoverage(puzzle, placements),
    history: [],
    complete: isExactCover(puzzle, computeCoverage(puzzle, placements)),
    beaconCount: playerBeaconCount(placements),
  };
}

export function selectType(state: GameState, puzzle: PuzzleDefinition, type: BeaconType | null): ActionResult {
  if (type && !puzzle.available.includes(type)) return fail('type-unavailable');
  state.selectedType = type;
  if (!type) return ok('beacon.selectionCleared');
  return ok('beacon.selected', { name: beaconTypeName(type) });
}

export function moveCursor(state: GameState, puzzle: PuzzleDefinition, dx: number, dy: number): ActionResult {
  const next = { x: state.cursor.x + dx, y: state.cursor.y + dy };
  if (!inBounds(puzzle, next.x, next.y)) return fail('out-of-bounds');
  state.cursor = next;
  return ok('beacon.focused', { row: next.y + 1, column: next.x + 1 });
}

export function setCursor(state: GameState, puzzle: PuzzleDefinition, cell: Cell): ActionResult {
  if (!inBounds(puzzle, cell.x, cell.y)) return fail('out-of-bounds');
  state.cursor = { ...cell };
  return ok('beacon.focused', { row: cell.y + 1, column: cell.x + 1 });
}

function refresh(state: GameState, puzzle: PuzzleDefinition): void {
  state.coverage = computeCoverage(puzzle, state.placements);
  state.beaconCount = playerBeaconCount(state.placements);
  state.complete = isExactCover(puzzle, state.coverage);
}

export function placeBeacon(
  state: GameState,
  puzzle: PuzzleDefinition,
  cell: Cell,
  type: BeaconType | null = state.selectedType,
): ActionResult {
  if (state.complete) return fail('already-complete');
  if (!type) return fail('unknown-type');
  if (!puzzle.available.includes(type)) return fail('type-unavailable');
  if (!inBounds(puzzle, cell.x, cell.y)) return fail('out-of-bounds');
  if (isBlocked(puzzle, cell.x, cell.y)) return fail('cell-blocked');
  if (isVoid(puzzle, cell.x, cell.y)) return fail('cell-void');
  if (!isCellEligible(puzzle, cell.x, cell.y)) return fail('placement-not-allowed');
  if (!allowedTypesForCell(puzzle, cell.x, cell.y).includes(type)) return fail('type-not-allowed');

  const existing = findPlacement(state.placements, cell.x, cell.y);
  if (existing?.locked) return fail('locked-beacon');
  if (existing) return fail('occupied');
  if (inventoryRemaining(puzzle, state.placements, type) <= 0) return fail('inventory-exhausted');

  state.history.push(clonePlacements(state.placements));
  state.placements.push({ x: cell.x, y: cell.y, type });
  state.cursor = { ...cell };
  refresh(state, puzzle);
  const name = beaconTypeName(type);
  if (state.complete) {
    return ok('beacon.placedSolved', { name, count: state.beaconCount, par: puzzle.par });
  }
  const coverage = state.coverage[cell.y]![cell.x]!;
  const band = coverageBand(coverage);
  return ok('beacon.placed', {
    name,
    row: cell.y + 1,
    column: cell.x + 1,
    coverage,
    band: coverageBandName(band),
  });
}

export function removeBeacon(state: GameState, puzzle: PuzzleDefinition, cell: Cell): ActionResult {
  if (state.complete) return fail('already-complete');
  if (!inBounds(puzzle, cell.x, cell.y)) return fail('out-of-bounds');
  const existing = findPlacement(state.placements, cell.x, cell.y);
  if (!existing) return fail('empty-cell');
  if (existing.locked) return fail('locked-beacon');

  state.history.push(clonePlacements(state.placements));
  state.placements = state.placements.filter((placement) => !(placement.x === cell.x && placement.y === cell.y));
  state.cursor = { ...cell };
  refresh(state, puzzle);
  return ok('beacon.removed', { name: beaconTypeName(existing.type), row: cell.y + 1, column: cell.x + 1 });
}

export function replaceBeacon(
  state: GameState,
  puzzle: PuzzleDefinition,
  cell: Cell,
  type: BeaconType,
): ActionResult {
  if (state.complete) return fail('already-complete');
  const existing = findPlacement(state.placements, cell.x, cell.y);
  if (!existing) return placeBeacon(state, puzzle, cell, type);
  if (existing.locked) return fail('locked-beacon');
  if (existing.type === type) return fail('occupied');

  const without = state.placements.filter((placement) => !(placement.x === cell.x && placement.y === cell.y));
  if (!puzzle.available.includes(type)) return fail('type-unavailable');
  if (!allowedTypesForCell(puzzle, cell.x, cell.y).includes(type)) return fail('type-not-allowed');
  if (inventoryRemaining(puzzle, without, type) <= 0) return fail('inventory-exhausted');

  state.history.push(clonePlacements(state.placements));
  state.placements = [...without, { x: cell.x, y: cell.y, type }];
  state.cursor = { ...cell };
  refresh(state, puzzle);
  const name = beaconTypeName(type);
  if (state.complete) {
    return ok('beacon.replacedSolved', { name, count: state.beaconCount });
  }
  return ok('beacon.replaced', { name });
}

export function undo(state: GameState, puzzle: PuzzleDefinition): ActionResult {
  if (state.complete) return fail('already-complete');
  const previous = state.history.pop();
  if (!previous) return fail('nothing-to-undo');
  state.placements = previous;
  refresh(state, puzzle);
  return ok('beacon.undone');
}

export function restartPuzzle(state: GameState, puzzle: PuzzleDefinition): ActionResult {
  const next = createState(puzzle);
  Object.assign(state, next);
  return ok('beacon.restarted', { title: puzzle.title });
}

export function cellViews(state: GameState, puzzle: PuzzleDefinition): CellView[] {
  const views: CellView[] = [];
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      const kind = cellKind(puzzle, x, y);
      const coverage = state.coverage[y]![x]!;
      views.push({
        x,
        y,
        kind,
        blocked: kind === 'blocked',
        voidCell: kind === 'void',
        coverage,
        band: kind === 'required' ? coverageBand(coverage) : null,
        beacon: findPlacement(state.placements, x, y) ?? null,
        eligible: isCellEligible(puzzle, x, y),
        allowedTypes: kind === 'required' ? allowedTypesForCell(puzzle, x, y) : [],
      });
    }
  }
  return views;
}

/** Board summary as a message. */
export function boardStatus(state: GameState, puzzle: PuzzleDefinition): Message {
  if (state.complete) {
    return message('beacon.statusSolved', { count: state.beaconCount, par: puzzle.par });
  }
  const summary = coverageSummary(puzzle, state.coverage);
  return message('beacon.status', {
    exact: summary.exact,
    gaps: summary.gaps,
    overlaps: summary.overlaps,
    count: state.beaconCount,
    par: puzzle.par,
  });
}

export function sameCursor(state: GameState, cell: Cell): boolean {
  return sameCell(state.cursor, cell);
}
