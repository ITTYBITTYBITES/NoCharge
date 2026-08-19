import { computeCoverage, coverageBand, coverageSummary, inBounds, isBlocked, isExactCover } from './coverage';
import { BEACON_META } from './patterns';
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
  GameState,
  InvalidReason,
  PuzzleDefinition,
} from './types';
import { sameCell } from './types';

function reasonMessage(reason: InvalidReason): string {
  switch (reason) {
    case 'cell-blocked':
      return 'That cell is blocked and cannot hold a beacon.';
    case 'placement-not-allowed':
      return 'This cell is not an allowed placement.';
    case 'type-not-allowed':
      return 'That beacon type is not allowed on this cell.';
    case 'inventory-exhausted':
      return 'No remaining beacons of that type.';
    case 'locked-beacon':
      return 'A locked beacon cannot be removed or replaced.';
    case 'occupied':
      return 'A beacon already occupies this cell.';
    case 'empty-cell':
      return 'There is no beacon to remove on this cell.';
    case 'unknown-type':
      return 'Choose a beacon type first.';
    case 'out-of-bounds':
      return 'That cell is outside the board.';
    case 'already-complete':
      return 'This puzzle is already solved. Restart to try another arrangement.';
    case 'nothing-to-undo':
      return 'Nothing to undo.';
    case 'type-unavailable':
      return 'That beacon type is not available on this puzzle.';
  }
}

function fail(reason: InvalidReason): ActionResult {
  return { ok: false, reason, announcement: reasonMessage(reason) };
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
  if (!type) return { ok: true, announcement: 'Beacon selection cleared.' };
  return { ok: true, announcement: `${BEACON_META[type].name} selected.` };
}

export function moveCursor(state: GameState, puzzle: PuzzleDefinition, dx: number, dy: number): ActionResult {
  const next = { x: state.cursor.x + dx, y: state.cursor.y + dy };
  if (!inBounds(puzzle, next.x, next.y)) return fail('out-of-bounds');
  state.cursor = next;
  return { ok: true, announcement: `Focused row ${next.y + 1}, column ${next.x + 1}.` };
}

export function setCursor(state: GameState, puzzle: PuzzleDefinition, cell: Cell): ActionResult {
  if (!inBounds(puzzle, cell.x, cell.y)) return fail('out-of-bounds');
  state.cursor = { ...cell };
  return { ok: true, announcement: `Focused row ${cell.y + 1}, column ${cell.x + 1}.` };
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
  const name = BEACON_META[type].name;
  if (state.complete) {
    return {
      ok: true,
      announcement: `${name} placed. Puzzle solved with ${state.beaconCount} beacons. Par ${puzzle.par}.`,
    };
  }
  const band = coverageBand(state.coverage[cell.y]![cell.x]!);
  return {
    ok: true,
    announcement: `${name} placed at row ${cell.y + 1}, column ${cell.x + 1}. Coverage ${state.coverage[cell.y]![cell.x]} · ${bandLabel(band)}.`,
  };
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
  return {
    ok: true,
    announcement: `${BEACON_META[existing.type].name} removed from row ${cell.y + 1}, column ${cell.x + 1}.`,
  };
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
  if (state.complete) {
    return {
      ok: true,
      announcement: `Replaced with ${BEACON_META[type].name}. Puzzle solved with ${state.beaconCount} beacons.`,
    };
  }
  return { ok: true, announcement: `Replaced with ${BEACON_META[type].name}.` };
}

export function undo(state: GameState, puzzle: PuzzleDefinition): ActionResult {
  if (state.complete) return fail('already-complete');
  const previous = state.history.pop();
  if (!previous) return fail('nothing-to-undo');
  state.placements = previous;
  refresh(state, puzzle);
  return { ok: true, announcement: 'Last change undone.' };
}

export function restartPuzzle(state: GameState, puzzle: PuzzleDefinition): ActionResult {
  const next = createState(puzzle);
  Object.assign(state, next);
  return { ok: true, announcement: `${puzzle.title} restarted.` };
}

export function cellViews(state: GameState, puzzle: PuzzleDefinition): CellView[] {
  const views: CellView[] = [];
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      const blocked = isBlocked(puzzle, x, y);
      const coverage = state.coverage[y]![x]!;
      views.push({
        x,
        y,
        blocked,
        coverage,
        band: blocked ? null : coverageBand(coverage),
        beacon: findPlacement(state.placements, x, y) ?? null,
        eligible: isCellEligible(puzzle, x, y),
        allowedTypes: blocked ? [] : allowedTypesForCell(puzzle, x, y),
      });
    }
  }
  return views;
}

export function boardStatus(state: GameState, puzzle: PuzzleDefinition): string {
  if (state.complete) return `Solved with ${state.beaconCount} beacons. Par ${puzzle.par}.`;
  const summary = coverageSummary(puzzle, state.coverage);
  return `${summary.exact} exact, ${summary.gaps} gaps, ${summary.overlaps} overlaps. ${state.beaconCount} beacons placed. Par ${puzzle.par}.`;
}

export function sameCursor(state: GameState, cell: Cell): boolean {
  return sameCell(state.cursor, cell);
}

function bandLabel(band: 'gap' | 'exact' | 'overlap'): string {
  if (band === 'gap') return 'Gap';
  if (band === 'exact') return 'Exact';
  return 'Overlap';
}
