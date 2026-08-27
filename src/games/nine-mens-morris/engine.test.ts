import { describe, expect, it } from 'vitest';
import { hasAnyMove, moveStone, newGame, placeStone, removeStone, select, MORRIS_POINTS, MORRIS_STONES, type MorrisGame } from './engine';

function state(overrides: Partial<MorrisGame>): MorrisGame {
  return { ...newGame(), ...overrides };
}

function boardWith(stones: Record<number, 1 | 2>): number[] {
  const board = Array.from({ length: MORRIS_POINTS }, () => 0);
  for (const [index, player] of Object.entries(stones)) board[Number(index)] = player;
  return board;
}

describe("nine men's morris engine", () => {
  it('starts at 24 points with 9 stones each', () => {
    const game = newGame();
    expect(game.board).toHaveLength(MORRIS_POINTS);
    expect(game.hand).toEqual([MORRIS_STONES, MORRIS_STONES]);
    expect(game.phase).toBe('placing');
    expect(game.turn).toBe(1);
    expect(game.removalPending).toBe(false);
  });

  it('forms a mill on placement and requires a removal', () => {
    let game = newGame();
    game = placeStone(game, 0); game = placeStone(game, 8);
    game = placeStone(game, 1); game = placeStone(game, 13);
    game = placeStone(game, 2); // P1 mill 0,1,2
    expect(game.removalPending).toBe(true);
    expect(game.turn).toBe(1);
    const blocked = placeStone(game, 3);
    expect(blocked).toBe(game);
  });

  it('removes one opponent stone and continues when they still have three', () => {
    const withFour = state({
      board: boardWith({ 0: 1, 1: 1, 2: 1, 8: 2, 13: 2, 21: 2, 22: 2 }),
      hand: [6, 5],
      phase: 'placing',
      turn: 1,
      removalPending: true,
    });
    const after = removeStone(withFour, 8);
    expect(after.board[8]).toBe(0);
    expect(after.removalPending).toBe(false);
    expect(after.turn).toBe(2);
    expect(after.phase).toBe('placing');
  });

  it('protects a mill stone when another opponent stone exists', () => {
    const withMillStone = state({
      board: boardWith({ 0: 1, 8: 2, 9: 2, 10: 2, 13: 2 }),
      hand: [8, 6],
      phase: 'moving',
      turn: 1,
      removalPending: true,
    });
    const rejected = removeStone(withMillStone, 8);
    expect(rejected).toBe(withMillStone);
    const accepted = removeStone(withMillStone, 13);
    expect(accepted.board[13]).toBe(0);
  });

  it('ends the game when an opponent drops below three stones', () => {
    const withThree = state({
      board: boardWith({ 0: 1, 1: 1, 2: 1, 8: 2, 13: 2, 21: 2 }),
      hand: [6, 6],
      phase: 'placing',
      turn: 1,
      removalPending: true,
    });
    const after = removeStone(withThree, 8);
    expect(after.phase).toBe('won');
    expect(after.winner).toBe(1);
  });

  it('selects own stones in moving phase and exposes legal targets', () => {
    const moving = state({
      board: boardWith({ 0: 1, 1: 1, 11: 1, 14: 1, 3: 2 }),
      hand: [0, 0],
      phase: 'moving',
      turn: 1,
    });
    const selection = select(moving, 0);
    expect(selection.selected).toBe(0);
    expect(selection.legal).toEqual([1, 7].filter((point) => moving.board[point] === 0));
    const other = select(moving, 3);
    expect(other.selected).toBeNull();
  });

  it('moves only along adjacency in moving phase and anywhere while flying', () => {
    const moving = state({
      board: boardWith({ 0: 1, 1: 1, 11: 1, 14: 1, 3: 2, 4: 2 }),
      hand: [0, 0],
      phase: 'moving',
      turn: 1,
    });
    const rejected = moveStone(moving, 0, 2);
    expect(rejected).toBe(moving);
    const accepted = moveStone(moving, 0, 7);
    expect(accepted.board[0]).toBe(0);
    expect(accepted.board[7]).toBe(1);
    const flying = state({
      board: boardWith({ 0: 1, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2 }),
      hand: [0, 0],
      phase: 'flying',
      turn: 1,
    });
    const flew = moveStone(flying, 0, 23);
    expect(flew.board[0]).toBe(0);
    expect(flew.board[23]).toBe(1);
  });

  it('detects a blocked player who cannot move', () => {
    const blocked = state({
      board: boardWith({ 0: 1, 1: 1, 11: 1, 14: 1, 2: 2, 7: 2, 9: 2, 10: 2, 12: 2, 13: 2, 15: 2, 19: 2 }),
      hand: [0, 0],
      phase: 'moving',
      turn: 1,
    });
    expect(hasAnyMove(blocked)).toBe(false);
  });
});
