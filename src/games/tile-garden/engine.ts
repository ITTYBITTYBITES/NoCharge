/**
 * Tile Garden engine — pure rules, no DOM, no localStorage.
 * Calm merge game on 8×8 grid with 4 tiers: seed → sprout → bloom → flower.
 * Player places tiles on empty cells; 4 same-tier tiles in a 2×2 block
 * auto-merge into one tier-up tile centered; surrounding cells empty.
 * Three modes: Garden (default), Meadow (endless), Sketch (creative).
 */
import { createGrid, cloneGrid, block2x2, block2x2InBounds } from '../shared/grid';

export type TileTier = 0 | 1 | 2 | 3; // seed, sprout, bloom, flower
export type GameMode = 'garden' | 'meadow' | 'sketch';

export const TIER_NAMES = ['Seed', 'Sprout', 'Bloom', 'Flower'] as const;

export interface Tile {
  tier: TileTier;
  species: number; // 0-5 for different plant types
}

export interface TileGardenState {
  grid: (Tile | null)[][];
  mode: GameMode;
  moves: number;
  bestTier: number;
  won: boolean;
  history: { grid: (Tile | null)[][]; moves: number; bestTier: number }[];
  nextTile: Tile;
}

function cloneTile(t: Tile | null): Tile | null {
  if (!t) return null;
  return { tier: t.tier, species: t.species };
}

function cloneGridTiles(grid: (Tile | null)[][]): (Tile | null)[][] {
  return grid.map((row) => row.map(cloneTile));
}

/** Create a new game. */
export function createGame(mode: GameMode = 'garden'): TileGardenState {
  const grid = createGrid<Tile | null>(8, 8, null);
  return {
    grid,
    mode,
    moves: 0,
    bestTier: 0,
    won: false,
    history: [],
    nextTile: generateNextTile(),
  };
}

function generateNextTile(): Tile {
  return {
    tier: 0, // Always seeds
    species: Math.floor(Math.random() * 6),
  };
}

/** Place a tile on an empty cell. Returns null if cell is occupied. */
export function placeTile(
  state: TileGardenState,
  row: number,
  col: number,
): TileGardenState | null {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
  if (state.grid[row]![col] !== null) return null;
  if (state.won) return null;

  const history = [...state.history, {
    grid: cloneGridTiles(state.grid),
    moves: state.moves,
    bestTier: state.bestTier,
  }];

  const grid = cloneGridTiles(state.grid);
  grid[row]![col] = cloneTile(state.nextTile);

  let newState: TileGardenState = {
    ...state,
    grid,
    moves: state.moves + 1,
    history,
    nextTile: generateNextTile(),
  };

  // Check for merges (in Sketch mode, no auto-merge)
  if (state.mode !== 'sketch') {
    newState = processMerges(newState);
  }

  // Update best tier
  let bestTier = newState.bestTier;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const tile = newState.grid[r]![c];
      if (tile && tile.tier > bestTier) bestTier = tile.tier;
    }
  }
  newState = { ...newState, bestTier };

  // Check win condition (Garden mode: a flower at center)
  if (state.mode === 'garden') {
    const center = newState.grid[3]![3]; // center of 8x8 is (3,3) or (4,4)
    const center2 = newState.grid[4]![4];
    if ((center && center.tier === 3) || (center2 && center2.tier === 3)) {
      newState = { ...newState, won: true };
    }
  }

  return newState;
}

/** Process all 2×2 merges on the grid. */
function processMerges(state: TileGardenState): TileGardenState {
  let grid = cloneGridTiles(state.grid);
  let merged = true;

  while (merged) {
    merged = false;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const cells = block2x2(r, c);
        const tiles = cells.map((pos) => grid[pos.row]![pos.col]);

        // Check if all four are same tier and same species (tier < 3)
        if (
          tiles.every((t) => t !== null) &&
          tiles[0]!.tier < 3 &&
          tiles.every((t) => t!.tier === tiles[0]!.tier && t!.species === tiles[0]!.species)
        ) {
          // Merge: clear all four, place tier-up at center (r+1, c+1 approximated)
          const mergeRow = r + 1;
          const mergeCol = c + 1;
          // Only merge if merge target is within one of the 2x2 cells
          for (const cell of cells) {
            grid[cell.row]![cell.col] = null;
          }
          // Place merged tile at top-left of the 2x2 block
          grid[r]![c] = { tier: (tiles[0]!.tier + 1) as TileTier, species: tiles[0]!.species };
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  return { ...state, grid };
}

/** Place any tile freely (Sketch mode helper). */
export function placeCustomTile(
  state: TileGardenState,
  row: number,
  col: number,
  tile: Tile,
): TileGardenState | null {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
  if (state.grid[row]![col] !== null) return null;

  const history = [...state.history, {
    grid: cloneGridTiles(state.grid),
    moves: state.moves,
    bestTier: state.bestTier,
  }];

  const grid = cloneGridTiles(state.grid);
  grid[row]![col] = cloneTile(tile);

  return {
    ...state,
    grid,
    moves: state.moves + 1,
    history,
  };
}

/** Undo last move. */
export function undo(state: TileGardenState): TileGardenState | null {
  if (state.history.length === 0) return null;
  const history = [...state.history];
  const prev = history.pop()!;
  return {
    ...state,
    grid: prev.grid,
    moves: prev.moves,
    bestTier: prev.bestTier,
    history,
    won: false,
  };
}

/** Clear a tile (Sketch mode). */
export function clearTile(
  state: TileGardenState,
  row: number,
  col: number,
): TileGardenState | null {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
  if (state.grid[row]![col] === null) return null;

  const history = [...state.history, {
    grid: cloneGridTiles(state.grid),
    moves: state.moves,
    bestTier: state.bestTier,
  }];

  const grid = cloneGridTiles(state.grid);
  grid[row]![col] = null;

  return { ...state, grid, moves: state.moves + 1, history };
}
