import { PATTERN_OFFSETS } from './patterns';
import type { BeaconType, Cell, CellKind, CoverageBand, Placement, PuzzleDefinition } from './types';
import { cellKey } from './types';

export function inBounds(puzzle: Pick<PuzzleDefinition, 'width' | 'height'>, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < puzzle.width && y < puzzle.height;
}

export function blockedSet(puzzle: Pick<PuzzleDefinition, 'blocked'>): Set<string> {
  return new Set(puzzle.blocked.map((cell) => cellKey(cell.x, cell.y)));
}

export function requiredSet(puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>): Set<string> {
  if (puzzle.required) return new Set(puzzle.required.map((cell) => cellKey(cell.x, cell.y)));
  const blocked = blockedSet(puzzle);
  const keys = new Set<string>();
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      const key = cellKey(x, y);
      if (!blocked.has(key)) keys.add(key);
    }
  }
  return keys;
}

export function isBlocked(puzzle: Pick<PuzzleDefinition, 'blocked'>, x: number, y: number): boolean {
  return blockedSet(puzzle).has(cellKey(x, y));
}

export function isRequired(
  puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>,
  x: number,
  y: number,
): boolean {
  return requiredSet(puzzle).has(cellKey(x, y));
}

export function isVoid(
  puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>,
  x: number,
  y: number,
): boolean {
  if (!inBounds(puzzle, x, y) || isBlocked(puzzle, x, y)) return false;
  return !isRequired(puzzle, x, y);
}

export function cellKind(
  puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>,
  x: number,
  y: number,
): CellKind {
  if (isBlocked(puzzle, x, y)) return 'blocked';
  if (isRequired(puzzle, x, y)) return 'required';
  return 'void';
}

export function coverageCells(
  puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>,
  type: BeaconType,
  origin: Cell,
): Cell[] {
  const cells: Cell[] = [];
  for (const offset of PATTERN_OFFSETS[type]) {
    const x = origin.x + offset.x;
    const y = origin.y + offset.y;
    if (!inBounds(puzzle, x, y)) continue;
    if (!isRequired(puzzle, x, y)) continue;
    cells.push({ x, y });
  }
  return cells;
}

export function emptyCoverage(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
}

export function computeCoverage(
  puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>,
  placements: readonly Placement[],
): number[][] {
  const grid = emptyCoverage(puzzle.width, puzzle.height);
  for (const placement of placements) {
    for (const cell of coverageCells(puzzle, placement.type, placement)) {
      grid[cell.y]![cell.x] += 1;
    }
  }
  return grid;
}

export function coverageBand(count: number): CoverageBand {
  if (count <= 0) return 'gap';
  if (count === 1) return 'exact';
  return 'overlap';
}

export function isExactCover(
  puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>,
  coverage: number[][],
): boolean {
  for (const key of requiredSet(puzzle)) {
    const [x, y] = key.split(',').map(Number) as [number, number];
    if (coverage[y]![x] !== 1) return false;
  }
  return true;
}

export function coverageSummary(
  puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>,
  coverage: number[][],
): { gaps: number; exact: number; overlaps: number; required: number } {
  let gaps = 0;
  let exact = 0;
  let overlaps = 0;
  let required = 0;
  for (const key of requiredSet(puzzle)) {
    const [x, y] = key.split(',').map(Number) as [number, number];
    required += 1;
    const band = coverageBand(coverage[y]![x]!);
    if (band === 'gap') gaps += 1;
    else if (band === 'exact') exact += 1;
    else overlaps += 1;
  }
  return { gaps, exact, overlaps, required };
}

export function voidCellCount(puzzle: Pick<PuzzleDefinition, 'width' | 'height' | 'blocked' | 'required'>): number {
  let count = 0;
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      if (isVoid(puzzle, x, y)) count += 1;
    }
  }
  return count;
}
