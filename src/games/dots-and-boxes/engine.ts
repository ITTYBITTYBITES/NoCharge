/**
 * Dots &amp; Boxes rules for the Pass &amp; Play edition.
 *
 * Pure functions only: no DOM, no storage, no AI. The engine never suggests
 * an edge and never evaluates who is "ahead"; it only applies the standard
 * rules — draw one edge per turn, completing a box claims it and grants
 * another move on the same turn.
 */

export type DotsPlayer = 1 | 2;
export type EdgeKind = 'h' | 'v';

/** Board sizes in boxes, e.g. 4×4 or 6×6. */
export const DOTS_BOARD_SIZES = [4, 6] as const;

export interface DotsState {
  /** Edge key -> the player who drew it. */
  edges: ReadonlyMap<string, DotsPlayer>;
  /** Box key "r:c" -> the player who completed it. */
  boxes: ReadonlyMap<string, DotsPlayer>;
}

export function emptyDotsState(): DotsState {
  return { edges: new Map(), boxes: new Map() };
}

export function hEdgeKey(dotRow: number, boxColumn: number): string {
  return `h:${dotRow}:${boxColumn}`;
}

export function vEdgeKey(boxRow: number, dotColumn: number): string {
  return `v:${boxRow}:${dotColumn}`;
}

export function parseEdgeKey(key: string): { kind: EdgeKind; a: number; b: number } | null {
  const match = /^(h|v):(-?\d+):(-?\d+)$/.exec(key);
  if (!match) return null;
  return { kind: match[1] as EdgeKind, a: Number(match[2]), b: Number(match[3]) };
}

/** Every legal edge key for a board with `boxes` columns and rows of boxes. */
export function allEdgeKeys(boxes: number): string[] {
  const keys: string[] = [];
  for (let dotRow = 0; dotRow <= boxes; dotRow += 1) {
    for (let column = 0; column < boxes; column += 1) keys.push(hEdgeKey(dotRow, column));
  }
  for (let row = 0; row < boxes; row += 1) {
    for (let dotColumn = 0; dotColumn <= boxes; dotColumn += 1) keys.push(vEdgeKey(row, dotColumn));
  }
  return keys;
}

/** The four edges around the box at box-row `r`, box-column `c`. */
export function boxEdgeKeys(row: number, column: number): [string, string, string, string] {
  return [hEdgeKey(row, column), hEdgeKey(row + 1, column), vEdgeKey(row, column), vEdgeKey(row, column + 1)];
}

export function isEdgeTaken(state: DotsState, key: string): boolean {
  return state.edges.has(key);
}

export function remainingEdges(state: DotsState, boxes: number): string[] {
  const taken = state.edges;
  return allEdgeKeys(boxes).filter((key) => !taken.has(key));
}

/**
 * Draw one edge. Returns null when the edge is already drawn; otherwise the
 * next state plus the boxes this edge completed (possibly none). A player who
 * completes at least one box keeps the move.
 */
export function applyEdge(
  state: DotsState,
  key: string,
  player: DotsPlayer,
  boxes: number,
): { state: DotsState; completed: string[] } | null {
  if (isEdgeTaken(state, key)) return null;
  const parsed = parseEdgeKey(key);
  if (!parsed) return null;
  // Bounds: horizontal edges live in dot rows 0..boxes with box columns
  // 0..boxes-1; vertical edges are the transpose.
  const maxA = parsed.kind === 'h' ? boxes : boxes - 1;
  const maxB = parsed.kind === 'h' ? boxes - 1 : boxes;
  if (parsed.a < 0 || parsed.a > maxA || parsed.b < 0 || parsed.b > maxB) return null;

  const edges = new Map(state.edges);
  edges.set(key, player);

  const nextBoxes = new Map(state.boxes);
  const completed: string[] = [];
  const candidateRows = parsed.kind === 'h' ? [parsed.a - 1, parsed.a] : [parsed.a];
  const candidateColumns = parsed.kind === 'v' ? [parsed.b - 1, parsed.b] : [parsed.b];
  for (const row of candidateRows) {
    for (const column of candidateColumns) {
      if (row < 0 || column < 0 || row >= boxes || column >= boxes) continue;
      const boxKey = `${row}:${column}`;
      if (nextBoxes.has(boxKey)) continue;
      const [top, bottom, left, right] = boxEdgeKeys(row, column);
      if (edges.has(top) && edges.has(bottom) && edges.has(left) && edges.has(right)) {
        nextBoxes.set(boxKey, player);
        completed.push(boxKey);
      }
    }
  }

  return { state: { edges, boxes: nextBoxes }, completed };
}

/** Box counts owned by each player: [player 1, player 2]. */
export function boxCounts(state: DotsState): [number, number] {
  let p1 = 0;
  let p2 = 0;
  for (const owner of state.boxes.values()) {
    if (owner === 1) p1 += 1;
    else p2 += 1;
  }
  return [p1, p2];
}

/** The game ends when every box is claimed. */
export function isGameComplete(state: DotsState, boxes: number): boolean {
  return state.boxes.size >= boxes * boxes;
}

/** Winner by most boxes, or null on an exact tie. */
export function leadingPlayer(state: DotsState): DotsPlayer | null {
  const [p1, p2] = boxCounts(state);
  if (p1 === p2) return null;
  return p1 > p2 ? 1 : 2;
}

/** Accessible edge label, e.g. "horizontal line, row 2 of 5, column 3 of 4". */
export function edgeLabel(key: string, boxes: number): string {
  const parsed = parseEdgeKey(key);
  if (!parsed) return 'line';
  if (parsed.kind === 'h') {
    return `horizontal line, dot row ${parsed.a + 1} of ${boxes + 1}, column ${parsed.b + 1} of ${boxes}`;
  }
  return `vertical line, row ${parsed.a + 1} of ${boxes}, dot column ${parsed.b + 1} of ${boxes + 1}`;
}

/** Accessible box label for claimed boxes, e.g. "box row 2, column 3". */
export function boxLabel(row: number, column: number): string {
  return `box row ${row + 1}, column ${column + 1}`;
}
