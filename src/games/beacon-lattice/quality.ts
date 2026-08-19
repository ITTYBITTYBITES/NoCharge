import { coverageCells, requiredSet, voidCellCount } from './coverage';
import { allowedTypesForCell, isCellEligible } from './rules';
import { countSolutions, smallestSolutionSize } from './solver';
import type { BeaconType, Cell, Placement, PuzzleDefinition } from './types';
import { cellKey } from './types';

export function legalCandidates(puzzle: PuzzleDefinition): Placement[] {
  const list: Placement[] = [];
  for (let y = 0; y < puzzle.height; y += 1) {
    for (let x = 0; x < puzzle.width; x += 1) {
      if (!isCellEligible(puzzle, x, y)) continue;
      for (const type of allowedTypesForCell(puzzle, x, y)) {
        if (!puzzle.available.includes(type)) continue;
        const covers = coverageCells(puzzle, type, { x, y });
        if (covers.length === 0) continue;
        list.push({ x, y, type });
      }
    }
  }
  return list;
}

export function requiredCellsList(puzzle: PuzzleDefinition): Cell[] {
  return [...requiredSet(puzzle)].map((key) => {
    const [x, y] = key.split(',').map(Number) as [number, number];
    return { x, y };
  });
}

export function connectedComponents(puzzle: PuzzleDefinition): number {
  const cells = requiredCellsList(puzzle);
  const remaining = new Set(cells.map((cell) => cellKey(cell.x, cell.y)));
  let count = 0;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  for (const start of cells) {
    const startKey = cellKey(start.x, start.y);
    if (!remaining.has(startKey)) continue;
    count += 1;
    const stack = [start];
    remaining.delete(startKey);
    while (stack.length) {
      const current = stack.pop()!;
      for (const [dx, dy] of dirs) {
        const next = cellKey(current.x + dx, current.y + dy);
        if (!remaining.has(next)) continue;
        remaining.delete(next);
        stack.push({ x: current.x + dx, y: current.y + dy });
      }
    }
  }
  return count;
}

function transformCell(cell: Cell, width: number, height: number, variant: number): Cell {
  const { x, y } = cell;
  const w = width - 1;
  const h = height - 1;
  switch (variant) {
    case 0:
      return { x, y };
    case 1:
      return { x: w - y, y: x };
    case 2:
      return { x: w - x, y: h - y };
    case 3:
      return { x: y, y: h - x };
    case 4:
      return { x: w - x, y };
    case 5:
      return { x, y: h - y };
    case 6:
      return { x: y, y: x };
    default:
      return { x: w - y, y: h - x };
  }
}

function canonKey(puzzle: PuzzleDefinition, variant: number): string {
  const required = requiredCellsList(puzzle)
    .map((cell) => transformCell(cell, puzzle.width, puzzle.height, variant))
    .map((cell) => cellKey(cell.x, cell.y))
    .sort()
    .join(';');
  const blocked = puzzle.blocked
    .map((cell) => transformCell(cell, puzzle.width, puzzle.height, variant))
    .map((cell) => cellKey(cell.x, cell.y))
    .sort()
    .join(';');
  const locked = puzzle.locked
    .map((cell) => {
      const next = transformCell(cell, puzzle.width, puzzle.height, variant);
      return `${cellKey(next.x, next.y)}:${cell.type}`;
    })
    .sort()
    .join(';');
  const types = [...puzzle.available].sort().join(',');
  const inventory = (Object.keys(puzzle.inventory) as BeaconType[])
    .sort()
    .map((type) => `${type}:${puzzle.inventory[type]}`)
    .join(',');
  const allowed = (puzzle.allowedCells ?? [])
    .map((cell) => transformCell(cell, puzzle.width, puzzle.height, variant))
    .map((cell) => cellKey(cell.x, cell.y))
    .sort()
    .join(';');
  return `${puzzle.width}x${puzzle.height}|r:${required}|b:${blocked}|l:${locked}|a:${allowed}|t:${types}|i:${inventory}`;
}

export function signature(puzzle: PuzzleDefinition): string {
  return Array.from({ length: 8 }, (_, variant) => canonKey(puzzle, variant)).sort()[0]!;
}

export function duplicatePairs(puzzles: readonly PuzzleDefinition[]): Array<[string, string]> {
  const seen = new Map<string, string>();
  const pairs: Array<[string, string]> = [];
  for (const puzzle of puzzles) {
    const key = signature(puzzle);
    const prior = seen.get(key);
    if (prior) pairs.push([prior, puzzle.id]);
    else seen.set(key, puzzle.id);
  }
  return pairs;
}

export function candidateThreshold(index: number, par: number): number {
  if (index === 0) return 1;
  if (index < 8) return par + 2;
  return par * 2;
}

export type PuzzleReviewRow = {
  number: number;
  id: string;
  dimensions: string;
  required: number;
  requiredPercent: number;
  voidCells: number;
  blocked: number;
  types: string;
  inventory: string;
  candidates: number;
  par: number;
  smallest: number | null;
  solutions: 'one' | 'multiple' | 'capped';
  components: number;
  lesson: string;
  note: string;
};

export function reviewRow(puzzle: PuzzleDefinition, index: number): PuzzleReviewRow {
  const required = requiredSet(puzzle).size;
  const total = puzzle.width * puzzle.height;
  const solutions = puzzle.width >= 7 || puzzle.par > 8 ? 2 : countSolutions(puzzle, 2);
  const smallest = puzzle.width >= 7 || puzzle.par > 8 ? puzzle.par : smallestSolutionSize(puzzle, puzzle.par);
  return {
    number: index + 1,
    id: puzzle.id,
    dimensions: `${puzzle.width}×${puzzle.height}`,
    required,
    requiredPercent: Math.round((required / total) * 100),
    voidCells: voidCellCount(puzzle),
    blocked: puzzle.blocked.length,
    types: puzzle.available.join(', '),
    inventory: (Object.entries(puzzle.inventory) as [string, number][]).map(([type, count]) => `${type} ${count}`).join(', '),
    candidates: legalCandidates(puzzle).length,
    par: puzzle.par,
    smallest,
    solutions: solutions === 1 ? 'one' : solutions >= 2 ? 'capped' : 'one',
    components: connectedComponents(puzzle),
    lesson: puzzle.lesson,
    note: puzzle.componentNote ?? (solutions >= 2 ? 'Multiple solutions exist.' : 'Single verified solution.'),
  };
}
