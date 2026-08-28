import { describe, expect, it } from 'vitest';
import { beginInput, extendSequence, newGame, pressPad, SIMON_PADS, SIMON_TARGET } from './engine';

describe('simon engine', () => {
  it('extends the sequence one pad at a time', () => {
    let state = newGame();
    state = extendSequence(state, () => 0);
    expect(state.sequence).toEqual([0]);
    state = extendSequence(state, () => 0.25);
    expect(state.sequence).toEqual([0, 1]);
  });

  it('accepts correct pads and returns to idle after a full sequence', () => {
    let state = newGame();
    state = extendSequence(state, () => 0);
    state = beginInput(state);
    state = pressPad(state, 0);
    expect(state.status).toBe('idle');
    expect(state.inputIndex).toBe(1);
  });

  it('loses on the first wrong pad', () => {
    let state = newGame();
    state = extendSequence(state, () => 0);
    state = beginInput(state);
    state = pressPad(state, 1);
    expect(state.status).toBe('lost');
  });

  it('wins at the target length', () => {
    let state = newGame();
    for (let index = 0; index < SIMON_TARGET; index += 1) {
      state = extendSequence(state, () => 0.25);
      state = beginInput(state);
      for (const pad of state.sequence) state = pressPad(state, pad);
    }
    expect(state.status).toBe('won');
    expect(state.sequence).toHaveLength(SIMON_TARGET);
  });

  it('ignores out-of-range pads', () => {
    let state = newGame();
    state = extendSequence(state, () => 0);
    state = beginInput(state);
    const unchanged = pressPad(state, SIMON_PADS + 1);
    expect(unchanged.status).toBe('input');
  });
});
