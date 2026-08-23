import { describe, it, expect } from 'vitest';
import {
  createGame,
  pickRoundColor,
  step,
  undo,
  isAdjacent,
  type ColorId,
  ALL_COLORS,
  GRID_SIZE,
} from './engine';

describe('Color Flip tap-to-step engine', () => {
  it('creates a game in picking phase', () => {
    const game = createGame('never', 0, 42);
    expect(game.phase).toBe('picking');
    expect(game.alive).toBe(true);
    expect(game.score).toBe(0);
    expect(game.steps).toBe(0);
    expect(game.grid.length).toBe(GRID_SIZE);
  });

  it('transitions to playing phase after picking a color', () => {
    const game = createGame('never', 0, 42);
    const picked = pickRoundColor(game, 'blue');
    expect(picked.phase).toBe('playing');
    expect(picked.playerColor).toBe('blue');
    expect(picked.roundColor).toBe('blue');
  });

  it('ignores pick after already playing', () => {
    let game = createGame('never', 0, 42);
    game = pickRoundColor(game, 'blue');
    const again = pickRoundColor(game, 'rose');
    expect(again.playerColor).toBe('blue'); // unchanged
  });

  it('step onto adjacent tile moves player', () => {
    let game = createGame('never', 0, 42);
    game = pickRoundColor(game, 'green');

    const center = Math.floor(GRID_SIZE / 2);
    // Step right
    const result = step(game, center + 1, center, () => 0.5);
    expect(result).not.toBeNull();
    expect(result!.steps).toBe(1);
  });

  it('step onto non-adjacent tile returns null', () => {
    let game = createGame('never', 0, 42);
    game = pickRoundColor(game, 'green');

    const center = Math.floor(GRID_SIZE / 2);
    // Step to corner (not adjacent)
    const result = step(game, 0, 0, () => 0.5);
    expect(result).toBeNull();
  });

  it('matching color scores a point', () => {
    let game = createGame('never', 0, 42);
    game = pickRoundColor(game, 'green');

    const center = Math.floor(GRID_SIZE / 2);
    // Force the right tile to be green
    game.grid[center]![center + 1] = { color: 'green', x: center + 1, y: center, stepped: false };
    const result = step(game, center + 1, center, () => 0.5);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(1);
    expect(result!.alive).toBe(true);
  });

  it('wrong color ends the game', () => {
    let game = createGame('never', 0, 42);
    game = pickRoundColor(game, 'green');

    const center = Math.floor(GRID_SIZE / 2);
    // Force the right tile to be blue (wrong)
    game.grid[center]![center + 1] = { color: 'blue', x: center + 1, y: center, stepped: false };
    const result = step(game, center + 1, center, () => 0.5);
    expect(result).not.toBeNull();
    expect(result!.alive).toBe(false);
    expect(result!.phase).toBe('ended');
  });

  it('rotation changes color after 5 steps', () => {
    let game = createGame('every-5', 0, 42);
    game = pickRoundColor(game, 'green');
    const center = Math.floor(GRID_SIZE / 2);
    const rng = () => 0.5;

    // Take 5 steps, each time forcing matching color
    for (let i = 0; i < 5; i++) {
      game.grid[center]![center + 1] = { color: game.playerColor, x: center + 1, y: center, stepped: false };
      const result = step(game, center + 1, center, rng);
      expect(result).not.toBeNull();
      game = result!;
    }

    // After 5 steps, color should have rotated
    expect(game.playerColor).not.toBe('green');
    expect(game.stepsSinceRotation).toBe(0);
  });

  it('rotation never changes color when mode is never', () => {
    let game = createGame('never', 0, 42);
    game = pickRoundColor(game, 'green');
    const center = Math.floor(GRID_SIZE / 2);
    const rng = () => 0.5;

    for (let i = 0; i < 12; i++) {
      game.grid[center]![center + 1] = { color: 'green', x: center + 1, y: center, stepped: false };
      const result = step(game, center + 1, center, rng);
      if (!result) break;
      game = result;
    }

    expect(game.playerColor).toBe('green');
  });

  it('undo restores previous state', () => {
    let game = createGame('never', 0, 42);
    game = pickRoundColor(game, 'green');
    const center = Math.floor(GRID_SIZE / 2);
    game.grid[center]![center + 1] = { color: 'green', x: center + 1, y: center, stepped: false };

    const stepped = step(game, center + 1, center, () => 0.5);
    expect(stepped).not.toBeNull();
    expect(stepped!.steps).toBe(1);

    const undone = undo(stepped!);
    expect(undone).not.toBeNull();
    expect(undone!.steps).toBe(0);
    expect(undone!.score).toBe(0);
    expect(undone!.alive).toBe(true);
  });

  it('undo returns null when no history', () => {
    const game = createGame('never', 0, 42);
    expect(undo(game)).toBeNull();
  });

  it('isAdjacent checks orthogonal adjacency', () => {
    expect(isAdjacent(3, 2, 2, 2)).toBe(true); // right
    expect(isAdjacent(1, 2, 2, 2)).toBe(true); // left
    expect(isAdjacent(2, 3, 2, 2)).toBe(true); // down
    expect(isAdjacent(2, 1, 2, 2)).toBe(true); // up
    expect(isAdjacent(3, 3, 2, 2)).toBe(false); // diagonal
    expect(isAdjacent(0, 0, 2, 2)).toBe(false); // far
  });
});
