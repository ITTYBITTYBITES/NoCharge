import { describe, expect, it } from 'vitest';
import {
  DOTS_BOARD_SIZES,
  allEdgeKeys,
  applyEdge,
  boxCounts,
  boxEdgeKeys,
  boxLabel,
  edgeLabel,
  emptyDotsState,
  hEdgeKey,
  isEdgeTaken,
  isGameComplete,
  leadingPlayer,
  parseEdgeKey,
  remainingEdges,
  vEdgeKey,
} from './engine';

describe('edge keys', () => {
  it('enumerates exactly 2·n·(n+1) edges for square boards', () => {
    expect(allEdgeKeys(4)).toHaveLength(40);
    expect(allEdgeKeys(6)).toHaveLength(84);
    expect(DOTS_BOARD_SIZES).toEqual([4, 6]);
  });

  it('round-trips parseEdgeKey and rejects malformed keys', () => {
    expect(parseEdgeKey(hEdgeKey(2, 3))).toEqual({ kind: 'h', a: 2, b: 3 });
    expect(parseEdgeKey(vEdgeKey(0, 4))).toEqual({ kind: 'v', a: 0, b: 4 });
    expect(parseEdgeKey('diagonal:1:1')).toBeNull();
    expect(parseEdgeKey('h:x:1')).toBeNull();
    expect(parseEdgeKey('')).toBeNull();
  });

  it('names edges with one-based positions', () => {
    expect(edgeLabel(hEdgeKey(1, 2), 4)).toBe('horizontal line, dot row 2 of 5, column 3 of 4');
    expect(edgeLabel(vEdgeKey(2, 0), 4)).toBe('vertical line, row 3 of 4, dot column 1 of 5');
    expect(boxLabel(1, 2)).toBe('box row 2, column 3');
  });
});

describe('applyEdge', () => {
  it('draws an edge and refuses redraws', () => {
    let state = emptyDotsState();
    const first = applyEdge(state, hEdgeKey(0, 0), 1, 4);
    expect(first).not.toBeNull();
    expect(first!.completed).toEqual([]);
    state = first!.state;
    expect(isEdgeTaken(state, hEdgeKey(0, 0))).toBe(true);
    expect(applyEdge(state, hEdgeKey(0, 0), 2, 4)).toBeNull();
  });

  it('rejects out-of-bounds keys', () => {
    expect(applyEdge(emptyDotsState(), hEdgeKey(5, 0), 1, 4)).toBeNull();
    expect(applyEdge(emptyDotsState(), hEdgeKey(0, 4), 1, 4)).toBeNull();
    expect(applyEdge(emptyDotsState(), vEdgeKey(4, 0), 1, 4)).toBeNull();
    expect(applyEdge(emptyDotsState(), vEdgeKey(0, 5), 1, 4)).toBeNull();
    expect(applyEdge(emptyDotsState(), 'nope', 1, 4)).toBeNull();
  });

  it('completes a box with its fourth edge and reports it', () => {
    let state = emptyDotsState();
    for (const key of [boxEdgeKeys(0, 0)[0], boxEdgeKeys(0, 0)[1], boxEdgeKeys(0, 0)[2]]) {
      state = applyEdge(state, key, 1, 4)!.state;
    }
    const finishing = applyEdge(state, boxEdgeKeys(0, 0)[3], 2, 4)!;
    expect(finishing.completed).toEqual(['0:0']);
    expect(finishing.state.boxes.get('0:0')).toBe(2);
    expect(boxCounts(finishing.state)).toEqual([0, 1]);
  });

  it('one edge can complete two neighbouring boxes at once', () => {
    let state = emptyDotsState();
    // Fill every edge around boxes (0,0) and (0,1) except the shared vertical.
    const shared = vEdgeKey(0, 1);
    const keys = [
      ...boxEdgeKeys(0, 0).filter((k) => k !== shared),
      ...boxEdgeKeys(0, 1).filter((k) => k !== shared),
    ];
    for (const key of keys) state = applyEdge(state, key, 1, 4)!.state;
    const finishing = applyEdge(state, shared, 1, 4)!;
    expect(finishing.completed.sort()).toEqual(['0:0', '0:1']);
  });

  it('never mutates the previous state', () => {
    const state = emptyDotsState();
    applyEdge(state, hEdgeKey(0, 0), 1, 4);
    expect(state.edges.size).toBe(0);
    expect(state.boxes.size).toBe(0);
  });
});

describe('end of game', () => {
  it('counts remaining edges as the board empties', () => {
    let state = emptyDotsState();
    expect(remainingEdges(state, 4)).toHaveLength(40);
    state = applyEdge(state, hEdgeKey(0, 0), 1, 4)!.state;
    expect(remainingEdges(state, 4)).toHaveLength(39);
  });

  it('completes only when every box is claimed', () => {
    let state = emptyDotsState();
    expect(isGameComplete(state, 2)).toBe(false);
    let index = 0;
    const keys = allEdgeKeys(2);
    while (!isGameComplete(state, 2)) {
      const next = applyEdge(state, keys[index]!, 1, 2);
      expect(next).not.toBeNull();
      state = next!.state;
      index += 1;
    }
    expect(state.boxes.size).toBe(4);
    expect(remainingEdges(state, 2)).toHaveLength(0);
  });

  it('reports the leader and exact ties', () => {
    const empty = emptyDotsState();
    expect(leadingPlayer(empty)).toBeNull();
    const drawn = {
      edges: new Map<string, 1 | 2>(),
      boxes: new Map<string, 1 | 2>([
        ['0:0', 1],
        ['0:1', 2],
      ]),
    };
    expect(leadingPlayer(drawn)).toBeNull();
    drawn.boxes.set('1:0', 1);
    expect(leadingPlayer(drawn)).toBe(1);
  });
});
