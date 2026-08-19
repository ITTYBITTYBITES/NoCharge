import { computeCoverage, coverageCells, isExactCover, isRequired } from './coverage';
import { allowedTypesForCell, isCellEligible } from './rules';
import type { BeaconType, Placement, PuzzleDefinition } from './types';
import { cellKey } from './types';

export type SolveOptions = {
  limit?: number;
  maxBeacons?: number;
};

function candidates(puzzle: PuzzleDefinition): Placement[] {
  const list: Placement[] = [];
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      if (!isCellEligible(puzzle, x, y)) continue;
      if (puzzle.locked.some((locked) => locked.x === x && locked.y === y)) continue;
      for (const type of allowedTypesForCell(puzzle, x, y)) {
        if (!puzzle.available.includes(type)) continue;
        list.push({ x, y, type });
      }
    }
  }
  return list;
}

function usedOf(placements: Placement[], type: BeaconType): number {
  return placements.filter((placement) => placement.type === type).length;
}

function remainingGaps(
  puzzle: PuzzleDefinition,
  coverage: number[][],
): { x: number; y: number }[] {
  const gaps: { x: number; y: number }[] = [];
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      if (!isRequired(puzzle, x, y)) continue;
      if ((coverage[y]![x] ?? 0) === 0) gaps.push({ x, y });
    }
  }
  return gaps;
}

function wouldOverlap(puzzle: PuzzleDefinition, coverage: number[][], placement: Placement): boolean {
  return coverageCells(puzzle, placement.type, placement).some((cell) => coverage[cell.y]![cell.x]! >= 1);
}

export function findSolutions(puzzle: PuzzleDefinition, options: SolveOptions = {}): Placement[][] {
  const limit = options.limit ?? 2;
  const maxBeacons = options.maxBeacons ?? Number.POSITIVE_INFINITY;
  const found: Placement[][] = [];
  const start = puzzle.locked.map((placement) => ({ ...placement }));
  const optionsList = candidates(puzzle);
  const occupied = new Set(start.map((placement) => cellKey(placement.x, placement.y)));

  const search = (placed: Placement[]) => {
    if (found.length >= limit) return;
    const coverage = computeCoverage(puzzle, placed);
    if (isExactCover(puzzle, coverage)) {
      found.push(placed.map((placement) => ({ ...placement })));
      return;
    }
    if (placed.length >= maxBeacons) return;

    const gaps = remainingGaps(puzzle, coverage);
    if (gaps.length === 0) return;
    const target = gaps[0]!;
    const useful = optionsList.filter((option) => {
      if (occupied.has(cellKey(option.x, option.y))) return false;
      const limitForType = puzzle.inventory[option.type];
      if (limitForType != null && usedOf(placed, option.type) >= limitForType) return false;
      if (wouldOverlap(puzzle, coverage, option)) return false;
      return coverageCells(puzzle, option.type, option).some((cell) => cell.x === target.x && cell.y === target.y);
    });

    for (const option of useful) {
      occupied.add(cellKey(option.x, option.y));
      placed.push(option);
      search(placed);
      placed.pop();
      occupied.delete(cellKey(option.x, option.y));
      if (found.length >= limit) return;
    }
  };

  search(start);
  return found;
}

export function countSolutions(puzzle: PuzzleDefinition, limit = 2): number {
  return findSolutions(puzzle, { limit }).length;
}

export function smallestSolutionSize(puzzle: PuzzleDefinition, ceiling: number): number | null {
  for (let size = puzzle.locked.length; size <= ceiling; size += 1) {
    const found = findSolutions(puzzle, { limit: 1, maxBeacons: size });
    if (found.length) return found[0]!.length;
  }
  return null;
}
