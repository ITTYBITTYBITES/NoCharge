import { isBlocked, inBounds, isRequired } from './coverage';
import type { BeaconType, Placement, PuzzleDefinition } from './types';
import { cellKey } from './types';

export function allowedCellSet(puzzle: PuzzleDefinition): Set<string> | null {
  if (!puzzle.allowedCells) return null;
  return new Set(puzzle.allowedCells.map((cell) => cellKey(cell.x, cell.y)));
}

export function allowedTypesForCell(puzzle: PuzzleDefinition, x: number, y: number): BeaconType[] {
  const specific = puzzle.allowedTypesByCell?.[cellKey(x, y)];
  if (specific) return [...specific];
  return [...puzzle.available];
}

export function isCellEligible(puzzle: PuzzleDefinition, x: number, y: number): boolean {
  if (!inBounds(puzzle, x, y) || isBlocked(puzzle, x, y) || !isRequired(puzzle, x, y)) return false;
  const allowed = allowedCellSet(puzzle);
  if (allowed && !allowed.has(cellKey(x, y))) return false;
  return allowedTypesForCell(puzzle, x, y).length > 0;
}

export function inventoryUsed(placements: readonly Placement[], type: BeaconType): number {
  return placements.filter((placement) => placement.type === type).length;
}

export function inventoryRemaining(
  puzzle: PuzzleDefinition,
  placements: readonly Placement[],
  type: BeaconType,
): number {
  const limit = puzzle.inventory[type];
  if (limit == null) return Number.POSITIVE_INFINITY;
  return limit - inventoryUsed(placements, type);
}

export function findPlacement(placements: readonly Placement[], x: number, y: number): Placement | undefined {
  return placements.find((placement) => placement.x === x && placement.y === y);
}

export function clonePlacements(placements: readonly Placement[]): Placement[] {
  return placements.map((placement) => ({ ...placement }));
}

export function playerBeaconCount(placements: readonly Placement[]): number {
  return placements.length;
}
