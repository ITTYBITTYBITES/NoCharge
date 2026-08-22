/**
 * Shared grid helpers for Nonogram, 2048, and Tile Garden.
 * Provides cell addressing and adjacency detection.
 */

export interface CellCoord {
  row: number;
  col: number;
}

/** Create a 2D array of the given dimensions filled with a default value. */
export function createGrid<T>(rows: number, cols: number, fill: T): T[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

/** Check if coordinates are within bounds. */
export function inBounds(row: number, col: number, rows: number, cols: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

/** Get orthogonal neighbors of a cell. */
export function orthogonalNeighbors(row: number, col: number, rows: number, cols: number): CellCoord[] {
  const result: CellCoord[] = [];
  if (row > 0) result.push({ row: row - 1, col });
  if (row < rows - 1) result.push({ row: row + 1, col });
  if (col > 0) result.push({ row, col: col - 1 });
  if (col < cols - 1) result.push({ row, col: col + 1 });
  return result;
}

/** Check if two cells are adjacent (orthogonally). */
export function areAdjacent(a: CellCoord, b: CellCoord): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

/** Get the 2×2 block starting at (row, col) — all four cells. */
export function block2x2(row: number, col: number): CellCoord[] {
  return [
    { row, col },
    { row, col: col + 1 },
    { row: row + 1, col },
    { row: row + 1, col: col + 1 },
  ];
}

/** Check if a 2×2 block fits within bounds. */
export function block2x2InBounds(row: number, col: number, rows: number, cols: number): boolean {
  return row >= 0 && row + 1 < rows && col >= 0 && col + 1 < cols;
}

/** Clone a 2D grid (shallow copy of each row). */
export function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row]);
}
