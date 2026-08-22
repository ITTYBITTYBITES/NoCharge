/**
 * Color Flip visual mode engine — tap-to-step tile puzzle.
 *
 * Redesign rationale:
 * - Removes real-time scrolling and reflex timing (calm design).
 * - One color per round (picked at round start).
 * - Player taps adjacent tiles to step; matching color scores.
 * - Color rotation option: never / every 10 steps / every 5 steps.
 *
 * The turn-based mode is NOT in this module; it lives entirely in main.ts
 * and remains byte-identical.
 */

export type ColorId = 'green' | 'blue' | 'amber' | 'rose';

export const ALL_COLORS: readonly ColorId[] = ['green', 'blue', 'amber', 'rose'];

export type RotationMode = 'never' | 'every-10' | 'every-5';

export interface TileCell {
  color: ColorId;
  x: number;
  y: number;
  stepped: boolean;
}

export interface TapToStepState {
  /** Player position in grid coordinates. */
  playerX: number;
  playerY: number;
  /** Current player color. */
  playerColor: ColorId;
  /** The color picked at round start (or after last rotation). */
  roundColor: ColorId;
  /** Grid of visible tiles around the player (5×5 viewport). */
  grid: (TileCell | null)[][];
  /** Steps taken this round. */
  steps: number;
  /** Score (correct-color steps). */
  score: number;
  /** Game alive flag. */
  alive: boolean;
  /** Round phase: 'picking' = choosing color, 'playing' = stepping. */
  phase: 'picking' | 'playing' | 'ended';
  /** Rotation mode. */
  rotation: RotationMode;
  /** Steps since last rotation. */
  stepsSinceRotation: number;
  /** History for undo (last step only). */
  history: TapToStepSnapshot | null;
  /** Best score. */
  best: number;
}

export interface TapToStepSnapshot {
  playerX: number;
  playerY: number;
  playerColor: ColorId;
  grid: (TileCell | null)[][];
  steps: number;
  score: number;
  stepsSinceRotation: number;
}

/** Size of the visible viewport grid. */
export const GRID_SIZE = 5;
/** Player always centered in the viewport. */
const CENTER = Math.floor(GRID_SIZE / 2);

function cloneGrid(grid: (TileCell | null)[][]): (TileCell | null)[][] {
  return grid.map((row) =>
    row.map((cell) => (cell ? { ...cell } : null)),
  );
}

function snapshot(state: TapToStepState): TapToStepSnapshot {
  return {
    playerX: state.playerX,
    playerY: state.playerY,
    playerColor: state.playerColor,
    grid: cloneGrid(state.grid),
    steps: state.steps,
    score: state.score,
    stepsSinceRotation: state.stepsSinceRotation,
  };
}

/** Seeded color picker for reproducible tile generation. */
function pickColor(rng: () => number): ColorId {
  return ALL_COLORS[Math.floor(rng() * ALL_COLORS.length)]!;
}

/** Simple RNG from seed. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Generate a fresh grid of tiles around the player. */
function generateGrid(rng: () => number, playerColor: ColorId): (TileCell | null)[][] {
  const grid: (TileCell | null)[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowArr: (TileCell | null)[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      if (row === CENTER && col === CENTER) {
        // Player position — empty
        rowArr.push(null);
      } else {
        // Bias toward the player's color early so the game is forgiving
        const bias = rng() < 0.4 ? playerColor : pickColor(rng);
        rowArr.push({ color: bias, x: col, y: row, stepped: false });
      }
    }
    grid.push(rowArr);
  }
  return grid;
}

/** Create a new game state. */
export function createGame(
  rotation: RotationMode = 'never',
  best = 0,
  seed?: number,
): TapToStepState {
  const rng = seededRng(seed ?? Math.floor(Math.random() * 0x7fffffff));
  const initialColor: ColorId = 'green';
  return {
    playerX: CENTER,
    playerY: CENTER,
    playerColor: initialColor,
    roundColor: initialColor,
    grid: generateGrid(rng, initialColor),
    steps: 0,
    score: 0,
    alive: true,
    phase: 'picking',
    rotation,
    stepsSinceRotation: 0,
    history: null,
    best,
  };
}

/** Pick the round color and transition to playing phase. */
export function pickRoundColor(state: TapToStepState, color: ColorId): TapToStepState {
  if (state.phase !== 'picking') return state;
  return {
    ...state,
    playerColor: color,
    roundColor: color,
    phase: 'playing',
  };
}

/** Check if a position is adjacent (orthogonally) to the player. */
export function isAdjacent(x: number, y: number, px: number, py: number): boolean {
  const dx = Math.abs(x - px);
  const dy = Math.abs(y - py);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

/** Step the player onto an adjacent tile. */
export function step(
  state: TapToStepState,
  targetX: number,
  targetY: number,
  rng: () => number,
): TapToStepState | null {
  if (state.phase !== 'playing' || !state.alive) return null;
  if (!isAdjacent(targetX, targetY, state.playerX, state.playerY)) return null;

  const tile = state.grid[targetY]?.[targetX];
  if (!tile) return null;

  const hist = snapshot(state);
  const grid = cloneGrid(state.grid);
  const newSteps = state.steps + 1;
  const newStepsSinceRotation = state.stepsSinceRotation + 1;

  // Mark old player position as stepped (empty)
  grid[state.playerY]![state.playerX] = null;

  // Check color match
  const matched = tile.color === state.playerColor;
  const newScore = matched ? state.score + 1 : state.score;

  // Move player to target
  grid[targetY]![targetX] = null; // player occupies this cell

  let newPlayerColor = state.playerColor;
  let newRoundColor = state.roundColor;
  let resetStepsSinceRotation = newStepsSinceRotation;

  // Check rotation
  const shouldRotate =
    state.rotation === 'every-5' && newStepsSinceRotation >= 5 ||
    state.rotation === 'every-10' && newStepsSinceRotation >= 10;

  if (shouldRotate) {
    // Rotate to next color in cycle
    const idx = ALL_COLORS.indexOf(state.playerColor);
    newPlayerColor = ALL_COLORS[(idx + 1) % ALL_COLORS.length]!;
    newRoundColor = newPlayerColor;
    resetStepsSinceRotation = 0;
  }

  // Shift the grid: move player back to center, regenerate outer ring
  const shiftedGrid = shiftGrid(grid, targetX - CENTER, targetY - CENTER, rng, newPlayerColor);

  const alive = matched; // wrong color ends the game

  return {
    ...state,
    playerX: CENTER,
    playerY: CENTER,
    playerColor: newPlayerColor,
    roundColor: newRoundColor,
    grid: shiftedGrid,
    steps: newSteps,
    score: newScore,
    alive,
    phase: alive ? 'playing' : 'ended',
    stepsSinceRotation: resetStepsSinceRotation,
    history: hist,
    best: Math.max(state.best, newScore),
  };
}

/** Shift the grid so the player is back at center, filling new edges. */
function shiftGrid(
  grid: (TileCell | null)[][],
  dx: number,
  dy: number,
  rng: () => number,
  playerColor: ColorId,
): (TileCell | null)[][] {
  const newGrid: (TileCell | null)[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowArr: (TileCell | null)[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const srcRow = row + dy;
      const srcCol = col + dx;
      if (srcRow >= 0 && srcRow < GRID_SIZE && srcCol >= 0 && srcCol < GRID_SIZE) {
        const src = grid[srcRow]![srcCol];
        if (src) {
          rowArr.push({ ...src, x: col, y: row });
        } else {
          // Refill empty cells with new tiles
          const bias = rng() < 0.4 ? playerColor : pickColor(rng);
          rowArr.push({ color: bias, x: col, y: row, stepped: false });
        }
      } else {
        // New tile from outside
        const bias = rng() < 0.4 ? playerColor : pickColor(rng);
        rowArr.push({ color: bias, x: col, y: row, stepped: false });
      }
    }
    newGrid.push(rowArr);
  }
  // Clear center for player
  newGrid[CENTER]![CENTER] = null;
  return newGrid;
}

/** Undo the last step. Returns null if no history. */
export function undo(state: TapToStepState): TapToStepState | null {
  if (!state.history) return null;
  const h = state.history;
  return {
    ...state,
    playerX: h.playerX,
    playerY: h.playerY,
    playerColor: h.playerColor,
    grid: h.grid,
    steps: h.steps,
    score: h.score,
    alive: true,
    phase: 'playing',
    stepsSinceRotation: h.stepsSinceRotation,
    history: null,
  };
}

/** Get the color name for display. */
export function colorName(id: ColorId): string {
  return id[0]!.toUpperCase() + id.slice(1);
}

/** Get the color hex for display. */
export function colorHex(id: ColorId): string {
  switch (id) {
    case 'green': return '#0f9d58';
    case 'blue': return '#3b82f6';
    case 'amber': return '#f59e0b';
    case 'rose': return '#f43f5e';
  }
}

/** Get the single-letter shortcut for a color. */
export function colorShortcut(id: ColorId): string {
  switch (id) {
    case 'green': return 'G';
    case 'blue': return 'B';
    case 'amber': return 'A';
    case 'rose': return 'R';
  }
}
