import { describe, expect, test } from 'vitest';

import {
  advanceTileForFrame,
  cleanupOffscreenTiles,
  crossedCheckpoint,
  evaluateCheckpoint,
  type CheckpointTileState,
} from './checkpoint-rules';

const checkpointY = 0.78;
const matchingTile = (overrides: Partial<CheckpointTileState> = {}): CheckpointTileState => ({
  previousY: 0.77,
  y: checkpointY,
  x: 0.5,
  color: 'amber',
  evaluated: false,
  ...overrides,
});

describe('Color Flip checkpoint rules', () => {
  test('does not evaluate a tile before its center crosses the checkpoint', () => {
    expect(crossedCheckpoint(0.7, 0.77, checkpointY)).toBe(false);
    expect(evaluateCheckpoint(matchingTile({ previousY: 0.7, y: 0.77 }), checkpointY, 0.5, 'amber', 0.24)).toEqual({
      status: 'not-crossed',
      scoreDelta: 0,
      shouldEnd: false,
    });
  });

  test('evaluates a tile moving from above to exactly at or below the checkpoint', () => {
    expect(crossedCheckpoint(0.77, checkpointY, checkpointY)).toBe(true);
    expect(crossedCheckpoint(0.77, 0.79, checkpointY)).toBe(true);
  });

  test('does not evaluate an already evaluated tile again', () => {
    expect(evaluateCheckpoint(matchingTile({ evaluated: true }), checkpointY, 0.5, 'amber', 0.24)).toEqual({
      status: 'already-evaluated',
      scoreDelta: 0,
      shouldEnd: false,
    });
  });

  test('awards exactly one point for a matching color', () => {
    expect(evaluateCheckpoint(matchingTile(), checkpointY, 0.5, 'amber', 0.24)).toEqual({
      status: 'correct',
      scoreDelta: 1,
      shouldEnd: false,
    });
  });

  test('awards no point and fails for a wrong color', () => {
    expect(evaluateCheckpoint(matchingTile(), checkpointY, 0.5, 'blue', 0.24)).toEqual({
      status: 'wrong-color',
      scoreDelta: 0,
      shouldEnd: true,
    });
  });

  test('awards no point and fails when the player is off the tile path', () => {
    expect(evaluateCheckpoint(matchingTile({ x: 0.8 }), checkpointY, 0.5, 'amber', 0.24)).toEqual({
      status: 'off-path',
      scoreDelta: 0,
      shouldEnd: true,
    });
  });

  test('off-screen cleanup removes tiles without adding score', () => {
    expect(cleanupOffscreenTiles([matchingTile({ y: 1.21 }), matchingTile({ y: 1.1 })], 1.2)).toEqual({
      tiles: [matchingTile({ y: 1.1 })],
      scoreDelta: 0,
    });
  });

  test('a paused frame does not advance position or checkpoint state', () => {
    const before = matchingTile({ previousY: 0.75, y: 0.77 });
    const after = advanceTileForFrame(before, 0.03, true);
    expect(after).toEqual(before);
    expect(crossedCheckpoint(after.previousY, after.y, checkpointY)).toBe(false);
  });
});
