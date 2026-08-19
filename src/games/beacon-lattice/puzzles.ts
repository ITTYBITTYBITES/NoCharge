import { coverageCells, isExactCover, computeCoverage } from './coverage';
import type { BeaconType, Cell, Placement, PuzzleDefinition } from './types';
import { cellKey } from './types';

const p = (x: number, y: number, type: BeaconType, locked = false): Placement =>
  locked ? { x, y, type, locked: true } : { x, y, type };

function blockExcept(width: number, height: number, required: Cell[]): Cell[] {
  const keep = new Set(required.map((cell) => cellKey(cell.x, cell.y)));
  const blocked: Cell[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!keep.has(cellKey(x, y))) blocked.push({ x, y });
    }
  }
  return blocked;
}

function fromSolution(
  meta: Omit<PuzzleDefinition, 'blocked' | 'solution' | 'par' | 'locked'> & {
    solution: Placement[];
    locked?: Placement[];
    blocked?: Cell[];
    open?: boolean;
  },
): PuzzleDefinition {
  const locked = meta.locked ?? [];
  const solution = meta.solution.map((placement) => {
    const isLocked = locked.some((item) => item.x === placement.x && item.y === placement.y);
    return isLocked ? { ...placement, locked: true } : placement;
  });
  const board = { width: meta.width, height: meta.height, blocked: meta.blocked ?? [] };
  const covered = solution.flatMap((placement) => coverageCells(board, placement.type, placement));
  const blocked = meta.open ? (meta.blocked ?? []) : blockExcept(meta.width, meta.height, covered);
  const puzzle: PuzzleDefinition = {
    ...meta,
    locked: solution.filter((placement) => placement.locked),
    blocked,
    solution,
    par: solution.length,
  };
  const coverage = computeCoverage(puzzle, puzzle.solution);
  if (!isExactCover(puzzle, coverage)) {
    throw new Error(`Puzzle ${puzzle.id} solution is not an exact cover.`);
  }
  return puzzle;
}

export const PUZZLES: PuzzleDefinition[] = [
  fromSolution({
    id: 'bl-01-first-plus',
    title: 'First plus',
    width: 5,
    height: 5,
    difficulty: 'intro',
    available: ['cross'],
    inventory: { cross: 1 },
    solution: [p(2, 2, 'cross')],
    unique: true,
    note: 'Place one Cross in the center to cover the plus-shaped lattice.',
  }),
  fromSolution({
    id: 'bl-02-twin-pluses',
    title: 'Twin pluses',
    width: 5,
    height: 5,
    difficulty: 'intro',
    available: ['cross'],
    inventory: { cross: 2 },
    solution: [p(1, 1, 'cross'), p(3, 3, 'cross')],
    unique: true,
    note: 'Two Cross beacons stay exact when their arms never share a cell.',
  }),
  fromSolution({
    id: 'bl-03-offset-pluses',
    title: 'Offset pluses',
    width: 5,
    height: 5,
    difficulty: 'intro',
    available: ['cross'],
    inventory: { cross: 2 },
    solution: [p(1, 3, 'cross'), p(3, 1, 'cross')],
    unique: true,
    note: 'The same two-plus idea, mirrored, so the empty cells sit on the other diagonal.',
  }),
  fromSolution({
    id: 'bl-04-edge-quartet',
    title: 'Edge quartet',
    width: 5,
    height: 5,
    difficulty: 'intro',
    available: ['cross'],
    inventory: { cross: 4 },
    solution: [p(0, 2, 'cross'), p(2, 0, 'cross'), p(4, 2, 'cross'), p(2, 4, 'cross')],
    unique: true,
    note: 'Four edge Cross beacons cover the rim pluses without entering the center.',
  }),
  fromSolution({
    id: 'bl-05-first-diamond',
    title: 'First diamond',
    width: 5,
    height: 5,
    difficulty: 'developing',
    available: ['diagonal'],
    inventory: { diagonal: 1 },
    solution: [p(2, 2, 'diagonal')],
    unique: true,
    note: 'A Diagonal covers its cell and the four diagonal neighbors.',
  }),
  fromSolution({
    id: 'bl-06-paired-diamonds',
    title: 'Paired diamonds',
    width: 5,
    height: 5,
    difficulty: 'developing',
    available: ['diagonal'],
    inventory: { diagonal: 2 },
    solution: [p(0, 2, 'diagonal'), p(3, 2, 'diagonal')],
    unique: true,
    note: 'Side-by-side diamonds share no cells if their centers are two steps apart.',
  }),
  fromSolution({
    id: 'bl-07-plus-and-diamond',
    title: 'Plus and diamond',
    width: 5,
    height: 5,
    difficulty: 'developing',
    available: ['cross', 'diagonal'],
    inventory: { cross: 1, diagonal: 1 },
    solution: [p(1, 1, 'cross'), p(3, 3, 'diagonal')],
    unique: true,
    note: 'Use each type once. The plus and diamond sit on opposite corners.',
  }),
  fromSolution({
    id: 'bl-08-mixed-frame',
    title: 'Mixed frame',
    width: 5,
    height: 5,
    difficulty: 'developing',
    available: ['cross', 'diagonal'],
    inventory: { cross: 2, diagonal: 2 },
    solution: [p(1, 0, 'cross'), p(3, 0, 'diagonal'), p(1, 4, 'cross'), p(3, 4, 'diagonal')],
    unique: true,
    note: 'Cross handles the upright arms; Diagonal finishes the corners of the frame.',
  }),
  fromSolution({
    id: 'bl-09-first-bar',
    title: 'First bar',
    width: 5,
    height: 5,
    difficulty: 'mixed',
    available: ['horizontal'],
    inventory: { horizontal: 1 },
    solution: [p(2, 2, 'horizontal')],
    unique: true,
    note: 'A Horizontal beacon covers only its row: left, self, and right.',
  }),
  fromSolution({
    id: 'bl-10-first-column',
    title: 'First column',
    width: 5,
    height: 5,
    difficulty: 'mixed',
    available: ['vertical'],
    inventory: { vertical: 1 },
    solution: [p(2, 2, 'vertical')],
    unique: true,
    note: 'A Vertical beacon covers only its column: above, self, and below.',
  }),
  fromSolution({
    id: 'bl-11-row-and-column',
    title: 'Row and column',
    width: 5,
    height: 5,
    difficulty: 'mixed',
    available: ['horizontal', 'vertical'],
    inventory: { horizontal: 2, vertical: 2 },
    solution: [p(1, 1, 'horizontal'), p(4, 1, 'vertical'), p(1, 3, 'vertical'), p(3, 3, 'horizontal')],
    unique: true,
    note: 'Alternate bars so a row piece never sits on a cell already claimed by a column.',
  }),
  fromSolution({
    id: 'bl-12-open-bars',
    title: 'Open bars',
    width: 5,
    height: 5,
    difficulty: 'mixed',
    available: ['horizontal', 'vertical'],
    inventory: { horizontal: 8, vertical: 8 },
    open: true,
    blocked: [],
    solution: [
      p(0, 0, 'horizontal'),
      p(2, 0, 'vertical'),
      p(3, 0, 'vertical'),
      p(4, 0, 'vertical'),
      p(0, 1, 'horizontal'),
      p(0, 2, 'horizontal'),
      p(3, 2, 'horizontal'),
      p(0, 3, 'horizontal'),
      p(3, 3, 'horizontal'),
      p(0, 4, 'horizontal'),
      p(3, 4, 'horizontal'),
    ],
    note: 'The full 5×5 can be tiled with Horizontal and Vertical bars alone.',
  }),
  fromSolution({
    id: 'bl-13-limited-cross',
    title: 'Limited cross',
    width: 5,
    height: 5,
    difficulty: 'constrained',
    available: ['cross', 'diagonal'],
    inventory: { cross: 1, diagonal: 2 },
    allowedCells: [
      { x: 1, y: 1 },
      { x: 3, y: 3 },
      { x: 4, y: 1 },
    ],
    solution: [p(1, 1, 'cross'), p(3, 3, 'diagonal'), p(4, 1, 'diagonal')],
    unique: true,
    note: 'Only three cells accept a beacon. Spend the single Cross where a plus is required.',
  }),
  fromSolution({
    id: 'bl-14-typed-slots',
    title: 'Typed slots',
    width: 5,
    height: 5,
    difficulty: 'constrained',
    available: ['cross', 'horizontal'],
    inventory: { cross: 1, horizontal: 2 },
    allowedTypesByCell: {
      '2,2': ['cross'],
      '0,4': ['horizontal'],
      '3,4': ['horizontal'],
    },
    solution: [p(2, 2, 'cross'), p(0, 4, 'horizontal'), p(3, 4, 'horizontal')],
    note: 'Some cells accept only one beacon type. Read the slot before placing.',
  }),
  fromSolution({
    id: 'bl-15-tight-inventory',
    title: 'Tight inventory',
    width: 5,
    height: 5,
    difficulty: 'constrained',
    available: ['cross', 'horizontal', 'vertical'],
    inventory: { cross: 1, horizontal: 1, vertical: 1 },
    solution: [p(1, 1, 'cross'), p(3, 1, 'vertical'), p(3, 3, 'horizontal')],
    unique: true,
    note: 'One of each remaining type. A wasted Cross cannot be replaced by a bar.',
  }),
  fromSolution({
    id: 'bl-16-four-corners-restricted',
    title: 'Restricted corners',
    width: 5,
    height: 5,
    difficulty: 'constrained',
    available: ['diagonal', 'horizontal', 'vertical'],
    inventory: { diagonal: 1, horizontal: 1, vertical: 2 },
    allowedCells: [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 3 },
      { x: 3, y: 3 },
    ],
    solution: [p(1, 1, 'diagonal'), p(3, 1, 'vertical'), p(1, 3, 'vertical'), p(3, 3, 'horizontal')],
    unique: true,
    note: 'Beacons may sit only on the four inner corners.',
  }),
  fromSolution({
    id: 'bl-17-locked-plus',
    title: 'Locked plus',
    width: 5,
    height: 5,
    difficulty: 'constrained',
    available: ['cross'],
    inventory: { cross: 2 },
    locked: [p(1, 1, 'cross', true)],
    solution: [p(1, 1, 'cross'), p(3, 3, 'cross')],
    unique: true,
    note: 'The first Cross is already locked. Complete the opposite plus.',
  }),
  fromSolution({
    id: 'bl-18-locked-diamond',
    title: 'Locked diamond',
    width: 5,
    height: 5,
    difficulty: 'constrained',
    available: ['cross', 'diagonal'],
    inventory: { cross: 2, diagonal: 1 },
    locked: [p(2, 2, 'diagonal', true)],
    solution: [p(0, 2, 'cross'), p(2, 2, 'diagonal'), p(4, 2, 'cross')],
    note: 'Work around the locked center diamond. Do not try to remove it.',
  }),
  fromSolution({
    id: 'bl-19-blocked-lane',
    title: 'Blocked lane',
    width: 5,
    height: 5,
    difficulty: 'constrained',
    available: ['horizontal', 'vertical'],
    inventory: { horizontal: 5, vertical: 4 },
    open: true,
    blocked: [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
    ],
    solution: [
      p(0, 0, 'horizontal'),
      p(0, 1, 'horizontal'),
      p(0, 2, 'horizontal'),
      p(0, 3, 'horizontal'),
      p(0, 4, 'horizontal'),
      p(3, 1, 'vertical'),
      p(3, 4, 'vertical'),
      p(4, 1, 'vertical'),
      p(4, 4, 'vertical'),
    ],
    note: 'The center column is blocked. Coverage skips it and continues on the far side.',
  }),
  fromSolution({
    id: 'bl-20-locked-and-blocked',
    title: 'Lock and block',
    width: 5,
    height: 5,
    difficulty: 'constrained',
    available: ['cross', 'horizontal'],
    inventory: { cross: 2, horizontal: 2 },
    blocked: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 4 },
      { x: 4, y: 4 },
    ],
    locked: [p(2, 0, 'cross', true)],
    solution: [p(2, 0, 'cross'), p(0, 2, 'cross'), p(3, 3, 'horizontal'), p(3, 4, 'horizontal')],
    note: 'A locked Cross and four blocked corners force the remaining bars.',
  }),
  fromSolution({
    id: 'bl-21-seven-core',
    title: 'Seven core',
    width: 7,
    height: 7,
    difficulty: 'advanced',
    available: ['cross'],
    inventory: { cross: 4 },
    solution: [p(1, 1, 'cross'), p(5, 1, 'cross'), p(1, 5, 'cross'), p(5, 5, 'cross')],
    unique: true,
    note: 'Four isolated pluses on a 7×7 field. The center stays empty on purpose.',
  }),
  fromSolution({
    id: 'bl-22-seven-rings',
    title: 'Seven rings',
    width: 7,
    height: 7,
    difficulty: 'advanced',
    available: ['diagonal', 'horizontal', 'vertical'],
    inventory: { diagonal: 4, horizontal: 2, vertical: 2 },
    solution: [
      p(1, 1, 'diagonal'),
      p(5, 1, 'diagonal'),
      p(1, 5, 'diagonal'),
      p(5, 5, 'diagonal'),
      p(3, 2, 'vertical'),
      p(3, 5, 'horizontal'),
    ],
    note: 'Diamonds claim the corners; bars finish the remaining interior cells.',
  }),
  fromSolution({
    id: 'bl-23-seven-mixed',
    title: 'Seven mixed',
    width: 7,
    height: 7,
    difficulty: 'advanced',
    available: ['cross', 'diagonal', 'horizontal', 'vertical'],
    inventory: { cross: 8, diagonal: 8, horizontal: 10, vertical: 10 },
    open: true,
    blocked: [{ x: 3, y: 3 }],
    solution: [
      p(0, 0, 'cross'),
      p(2, 0, 'diagonal'),
      p(3, 0, 'diagonal'),
      p(5, 0, 'cross'),
      p(6, 2, 'cross'),
      p(0, 2, 'horizontal'),
      p(3, 2, 'horizontal'),
      p(0, 3, 'horizontal'),
      p(2, 4, 'cross'),
      p(4, 3, 'horizontal'),
      p(0, 5, 'cross'),
      p(4, 5, 'cross'),
      p(6, 4, 'horizontal'),
      p(6, 6, 'cross'),
      p(2, 6, 'horizontal'),
    ],
    note: 'The center cell is blocked. Mix every beacon type to finish the 7×7.',
  }),
  fromSolution({
    id: 'bl-24-seven-lock',
    title: 'Seven lock',
    width: 7,
    height: 7,
    difficulty: 'advanced',
    available: ['cross', 'diagonal', 'horizontal', 'vertical'],
    inventory: { cross: 4, diagonal: 4, horizontal: 4, vertical: 4 },
    locked: [p(3, 3, 'vertical', true)],
    solution: [
      p(1, 1, 'cross'),
      p(5, 1, 'cross'),
      p(1, 5, 'cross'),
      p(5, 5, 'cross'),
      p(3, 3, 'vertical'),
    ],
    note: 'A locked Vertical in the center is already counting. Place the four corner pluses around it.',
  }),
];

export function getPuzzle(id: string): PuzzleDefinition | undefined {
  return PUZZLES.find((puzzle) => puzzle.id === id);
}

export function puzzleIndex(id: string): number {
  return PUZZLES.findIndex((puzzle) => puzzle.id === id);
}
