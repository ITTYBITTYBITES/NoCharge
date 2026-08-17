export type CheckpointTileState = {
  previousY: number;
  y: number;
  x: number;
  color: string;
  evaluated: boolean;
};

export type CheckpointEvaluation =
  | { status: 'not-crossed'; scoreDelta: 0; shouldEnd: false }
  | { status: 'already-evaluated'; scoreDelta: 0; shouldEnd: false }
  | { status: 'correct'; scoreDelta: 1; shouldEnd: false }
  | { status: 'wrong-color'; scoreDelta: 0; shouldEnd: true }
  | { status: 'off-path'; scoreDelta: 0; shouldEnd: true };

/** A checkpoint belongs to the first frame that moves a tile center onto or below it. */
export function crossedCheckpoint(previousY: number, currentY: number, checkpointY: number): boolean {
  return previousY < checkpointY && currentY >= checkpointY;
}

/**
 * Evaluate one tile at one deterministic checkpoint. The caller marks the tile
 * evaluated for any result other than `not-crossed` or `already-evaluated`.
 */
export function evaluateCheckpoint(
  tile: CheckpointTileState,
  checkpointY: number,
  playerX: number,
  playerColor: string,
  horizontalTolerance: number,
): CheckpointEvaluation {
  if (tile.evaluated) return { status: 'already-evaluated', scoreDelta: 0, shouldEnd: false };
  if (!crossedCheckpoint(tile.previousY, tile.y, checkpointY)) {
    return { status: 'not-crossed', scoreDelta: 0, shouldEnd: false };
  }
  if (Math.abs(tile.x - playerX) > horizontalTolerance) {
    return { status: 'off-path', scoreDelta: 0, shouldEnd: true };
  }
  if (tile.color !== playerColor) {
    return { status: 'wrong-color', scoreDelta: 0, shouldEnd: true };
  }
  return { status: 'correct', scoreDelta: 1, shouldEnd: false };
}

/** Keep pause frames completely inert, including the previous-position marker. */
export function advanceTileForFrame<T extends CheckpointTileState>(tile: T, deltaY: number, paused: boolean): T {
  if (paused) return { ...tile };
  return { ...tile, previousY: tile.y, y: tile.y + deltaY };
}

/** Off-screen cleanup is storage maintenance, never a scoring event. */
export function cleanupOffscreenTiles<T extends { y: number }>(
  tiles: T[],
  boundaryY: number,
): { tiles: T[]; scoreDelta: 0 } {
  return { tiles: tiles.filter((tile) => tile.y < boundaryY), scoreDelta: 0 };
}
