export const BEACON_TYPES = ['cross', 'diagonal', 'horizontal', 'vertical'] as const;

export type BeaconType = (typeof BEACON_TYPES)[number];

export type Cell = {
  x: number;
  y: number;
};

export type Placement = Cell & {
  type: BeaconType;
  locked?: boolean;
};

export type PuzzleDifficulty = 'intro' | 'developing' | 'mixed' | 'constrained' | 'advanced';

export type PuzzleDefinition = {
  id: string;
  title: string;
  width: number;
  height: number;
  difficulty: PuzzleDifficulty;
  blocked: readonly Cell[];
  available: readonly BeaconType[];
  inventory: Partial<Record<BeaconType, number>>;
  allowedCells?: readonly Cell[];
  allowedTypesByCell?: Readonly<Record<string, readonly BeaconType[]>>;
  locked: readonly Placement[];
  solution: readonly Placement[];
  par: number;
  note?: string;
  unique?: boolean;
};

export type InvalidReason =
  | 'cell-blocked'
  | 'placement-not-allowed'
  | 'type-not-allowed'
  | 'inventory-exhausted'
  | 'locked-beacon'
  | 'occupied'
  | 'empty-cell'
  | 'unknown-type'
  | 'out-of-bounds'
  | 'already-complete'
  | 'nothing-to-undo'
  | 'type-unavailable';

export type ActionResult =
  | { ok: true; announcement: string }
  | { ok: false; reason: InvalidReason; announcement: string };

export type CoverageBand = 'gap' | 'exact' | 'overlap';

export type CellView = {
  x: number;
  y: number;
  blocked: boolean;
  coverage: number;
  band: CoverageBand | null;
  beacon: Placement | null;
  eligible: boolean;
  allowedTypes: BeaconType[];
};

export type GameState = {
  puzzleId: string;
  selectedType: BeaconType | null;
  cursor: Cell;
  placements: Placement[];
  coverage: number[][];
  history: Placement[][];
  complete: boolean;
  beaconCount: number;
};

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}
