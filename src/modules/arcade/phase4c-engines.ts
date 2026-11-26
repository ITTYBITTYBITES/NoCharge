import type { ArcadeGameOutcome } from '../../content/schemas';

export type Phase4cGameId =
  | 'beacon-lattice' | 'checkers' | 'color-flip' | 'dots-and-boxes'
  | 'freecell' | 'gomoku' | 'klondike' | 'memory-match' | 'minesweeper'
  | 'mini-sudoku' | 'nine-mens-morris' | 'nonogram' | 'pass-the-picture'
  | 'reversi' | 'sudoku-9x9' | 'tile-garden' | 'word-search' | 'word-tile-rush';

export type Phase4cState = Record<string, any>;
export interface Phase4cAction { type: string; [key: string]: any }
export interface Phase4cTransition {
  state: Phase4cState;
  message: string;
  outcome?: ArcadeGameOutcome;
  breakpoint?: 'round-end' | 'game-over';
}

const copy = <T,>(value: T): T => structuredClone(value);
const nextSeed = (seed: number) => (Math.imul(seed, 1664525) + 1013904223) >>> 0;

export function seededShuffle<T>(items: readonly T[], initialSeed: number): T[] {
  const result = [...items];
  let seed = initialSeed >>> 0;
  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = nextSeed(seed);
    const other = seed % (index + 1);
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

export interface PlayingCard { suit: '♠' | '♥' | '♦' | '♣'; rank: number; faceUp: boolean }
export const CARD_SUITS: readonly PlayingCard['suit'][] = ['♠', '♥', '♦', '♣'];
export function createDeck(seed: number, faceUp = true): PlayingCard[] {
  const cards = CARD_SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, index) => ({ suit, rank: index + 1, faceUp })));
  return seededShuffle(cards, seed);
}
export function cardName(card: PlayingCard): string {
  return `${(['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][card.rank] ?? card.rank)}${card.suit}`;
}
export const cardIsRed = (card: PlayingCard) => card.suit === '♥' || card.suit === '♦';

export function createInitialPhase4cState(game: Phase4cGameId): Phase4cState {
  switch (game) {
    case 'beacon-lattice': return { board: Array(25).fill(-1), inventory: [0, 1, 2, 3, 4], selected: 0, rotation: 0, history: [], moves: 0, complete: false };
    case 'checkers': {
      const board: (string | null)[] = Array(64).fill(null);
      for (let row = 0; row < 3; row += 1) for (let column = 0; column < 8; column += 1) if ((row + column) % 2 === 1) board[row * 8 + column] = 'b';
      for (let row = 5; row < 8; row += 1) for (let column = 0; column < 8; column += 1) if ((row + column) % 2 === 1) board[row * 8 + column] = 'r';
      return { board, turn: 'r', selected: -1, forced: -1, moveCount: 0, complete: false };
    }
    case 'color-flip': return { mode: 'trail', colors: ['coral', 'teal', 'gold', 'violet'], activeColor: 'coral', turn: 0, score: 0, target: ['teal', 'gold', 'violet', 'coral', 'gold', 'teal', 'violet', 'coral', 'gold', 'teal'], rotating: false, complete: false };
    case 'dots-and-boxes': return { horizontal: Array(20).fill(false), vertical: Array(20).fill(false), boxes: Array(16).fill(0), turn: 1, moves: 0, complete: false };
    case 'freecell': {
      const deck = createDeck(0xfce110, true);
      const tableau = Array.from({ length: 8 }, () => [] as PlayingCard[]);
      deck.forEach((card, index) => tableau[index % 8]!.push(card));
      return { tableau, free: Array(4).fill(null), foundations: { '♠': 0, '♥': 0, '♦': 0, '♣': 0 }, selection: null, moves: 0, complete: false };
    }
    case 'gomoku': return { board: Array(225).fill(null), turn: 'X', selected: 112, moves: 0, complete: false };
    case 'klondike': {
      const deck = createDeck(0x1c10d1e, false);
      const tableau = Array.from({ length: 7 }, (_, column) => deck.splice(0, column + 1).map((card, index, pile) => ({ ...card, faceUp: index === pile.length - 1 })));
      return { stock: deck, waste: [] as PlayingCard[], tableau, foundations: { '♠': [] as number[], '♥': [] as number[], '♦': [] as number[], '♣': [] as number[] }, drawMode: 1, selection: null, moves: 0, complete: false };
    }
    case 'memory-match': {
      const symbols = ['▲', '●', '◆', '★', '✿', '☾', '⬟', '✦'];
      const deck = seededShuffle([...symbols, ...symbols], 0x4d454d31);
      return { deck, revealed: [], matched: Array(16).fill(false), moves: 0, complete: false, mismatch: false };
    }
    case 'minesweeper': return { rows: 9, columns: 9, mines: 10, cells: Array.from({ length: 81 }, () => ({ mine: false, open: false, flag: false, count: 0 })), seed: 0x51a7e, firstClick: true, selected: 40, flags: 0, opened: 0, complete: false };
    case 'mini-sudoku': return makeSudokuState(6);
    case 'nine-mens-morris': return { board: Array(24).fill(0), turn: 1, reserve: [9, 9], selected: -1, cursor: 0, removeMode: false, moves: 0, complete: false };
    case 'nonogram': return makeNonogramState(5);
    case 'pass-the-picture': return { strokes: [] as { color: string; points: { x: number; y: number }[] }[], color: '#c65d46', passes: 0, maxPasses: 8, complete: false };
    case 'reversi': {
      const board = Array(64).fill(0);
      board[27] = 2; board[28] = 1; board[35] = 1; board[36] = 2;
      return { board, turn: 1, moves: 0, passes: 0, complete: false };
    }
    case 'sudoku-9x9': return makeSudokuState(9);
    case 'tile-garden': {
      const board = Array(64).fill(0);
      for (const index of [9, 10, 17, 18, 37, 38, 45]) board[index] = 1;
      return { board, nextSeed: 1, moves: 0, mode: 'garden', complete: false };
    }
    case 'word-search': return makeWordSearchState();
    case 'word-tile-rush': {
      const grid = Array(48).fill('');
      const seeded = makeRushGrid(0x7257).slice(0, 18);
      seeded.forEach((letter, index) => { grid[30 + index] = letter; });
      return { grid, path: [], score: 0, rowsAdded: 0, seconds: 90, startedClock: false, complete: false };
    }
  }
}

export function makeSudokuState(size: 6 | 9): Phase4cState {
  if (size === 9) {
    const rows = ['530070000', '600195000', '098000060', '800060003', '400803001', '700020006', '060000280', '000419005', '000080079'];
    const solution = ['534678912', '672195348', '198342567', '859761423', '426853791', '713924856', '961537284', '287419635', '345286179'];
    const values = rows.join('').split('').map(Number);
    return { size, board: values, initial: [...values], solution: solution.join('').split('').map(Number), selected: 0, mistakes: 0, complete: false };
  }
  const solution = Array.from({ length: 36 }, (_, index) => ((Math.floor(index / 6) * 3 + Math.floor(Math.floor(index / 6) / 2) + index % 6) % 6) + 1);
  const puzzleRows = ['003050', '000100', '200060', '001000', '345002', '010000'];
  const board = puzzleRows.join('').split('').map(Number);
  return { size, board, initial: [...board], solution, selected: 5, mistakes: 0, complete: false };
}

export function makeNonogramState(size: 5 | 10): Phase4cState {
  const solution = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size); const column = index % size;
    const center = (size - 1) / 2;
    return Math.abs(row - center) + Math.abs(column - center) <= (size === 5 ? 2 : 5);
  });
  const clues = (line: boolean[]) => line.join('').split('0').filter(Boolean).map((run) => run.length);
  const rowClues = Array.from({ length: size }, (_, row) => clues(solution.slice(row * size, (row + 1) * size)));
  const columnClues = Array.from({ length: size }, (_, column) => clues(Array.from({ length: size }, (_, row) => solution[row * size + column]!)));
  return { size, solution, marks: Array(size * size).fill(0), rowClues, columnClues, selected: 0, complete: false };
}

export function makeWordSearchState(): Phase4cState {
  const size = 8;
  const grid = Array.from({ length: size * size }, (_, index) => String.fromCharCode(65 + ((index * 17 + 11) % 26)));
  const words = [
    { word: 'STAR', cells: [0, 1, 2, 3] },
    { word: 'MOON', cells: [8, 16, 24, 32] },
    { word: 'ORBIT', cells: [56, 49, 42, 35, 28] },
    { word: 'COMET', cells: [19, 20, 21, 22, 23] },
  ];
  for (const entry of words) entry.cells.forEach((cell, index) => { grid[cell] = entry.word[index]!; });
  return { size, grid, words: words.map((entry) => entry.word), placements: words.map((entry) => entry.cells), found: [] as number[], selection: [], complete: false };
}

export function makeRushGrid(seed: number): string[] {
  const letters = 'AEIOURSTLNCM';
  let state = seed >>> 0;
  return Array.from({ length: 48 }, () => { state = nextSeed(state); return letters[state % letters.length]!; });
}

export function checkersMoves(board: readonly (string | null)[], from: number): number[] {
  const piece = board[from];
  if (!piece) return [];
  const row = Math.floor(from / 8); const column = from % 8;
  const player = piece.toLowerCase();
  const directions = piece === piece.toUpperCase() ? [-1, 1] : player === 'r' ? [-1] : [1];
  const moves: number[] = [];
  for (const dr of directions) for (const dc of [-1, 1]) {
    const nextRow = row + dr; const nextColumn = column + dc;
    if (nextRow < 0 || nextRow > 7 || nextColumn < 0 || nextColumn > 7) continue;
    const next = nextRow * 8 + nextColumn;
    if (board[next] === null) moves.push(next);
    else if (board[next]!.toLowerCase() !== player) {
      const landingRow = row + dr * 2; const landingColumn = column + dc * 2;
      if (landingRow >= 0 && landingRow < 8 && landingColumn >= 0 && landingColumn < 8 && board[landingRow * 8 + landingColumn] === null) moves.push(landingRow * 8 + landingColumn);
    }
  }
  return moves;
}

export function checkersCaptureMoves(board: readonly (string | null)[], from: number): number[] {
  return checkersMoves(board, from).filter((to) => Math.abs(Math.floor(to / 8) - Math.floor(from / 8)) === 2);
}

export function allCheckersLegalMoves(board: readonly (string | null)[], player: 'r' | 'b', forced = -1): Array<{ from: number; to: number; capture: boolean }> {
  const candidates = board.flatMap((piece, from) => piece && piece.toLowerCase() === player && (forced < 0 || forced === from)
    ? checkersMoves(board, from).map((to) => ({ from, to, capture: Math.abs(Math.floor(to / 8) - Math.floor(from / 8)) === 2 }))
    : []);
  const captures = candidates.filter((move) => move.capture);
  return captures.length ? captures : forced >= 0 ? [] : candidates;
}

export function reversiLegalMoves(board: readonly number[], player: 1 | 2): number[] {
  const other = player === 1 ? 2 : 1;
  const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] as const;
  const result: number[] = [];
  for (let index = 0; index < 64; index += 1) {
    if (board[index] !== 0) continue;
    const row = Math.floor(index / 8); const column = index % 8;
    const legal = directions.some(([dr, dc]) => {
      let r = row + dr; let c = column + dc; let seenOpponent = false;
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === other) {
        seenOpponent = true; r += dr; c += dc;
      }
      return seenOpponent && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === player;
    });
    if (legal) result.push(index);
  }
  return result;
}

export function hasFive(board: readonly (string | null)[], index: number, mark: string): boolean {
  const row = Math.floor(index / 15); const column = index % 15;
  return [[1, 0], [0, 1], [1, 1], [1, -1]].some(([dr, dc]) => {
    let total = 1;
    for (const sign of [-1, 1]) {
      let r = row + dr! * sign; let c = column + dc! * sign;
      while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r * 15 + c] === mark) { total += 1; r += dr! * sign; c += dc! * sign; }
    }
    return total >= 5;
  });
}

export function isValidSudokuEntry(board: readonly number[], size: number, index: number, value: number): boolean {
  const row = Math.floor(index / size); const column = index % size;
  const boxRows = size === 6 ? 2 : 3; const boxColumns = size === 6 ? 3 : 3;
  for (let offset = 0; offset < size; offset += 1) {
    if (offset !== column && board[row * size + offset] === value) return false;
    if (offset !== row && board[offset * size + column] === value) return false;
  }
  const startRow = Math.floor(row / boxRows) * boxRows; const startColumn = Math.floor(column / boxColumns) * boxColumns;
  for (let r = startRow; r < startRow + boxRows; r += 1) for (let c = startColumn; c < startColumn + boxColumns; c += 1) {
    const cell = r * size + c; if (cell !== index && board[cell] === value) return false;
  }
  return true;
}

export function phase4cTransition(game: Phase4cGameId, state: Phase4cState, action: Phase4cAction): Phase4cTransition {
  const next = copy(state);
  const complete = (outcome: ArcadeGameOutcome, message: string): Phase4cTransition => ({ state: { ...next, complete: true }, message, outcome, breakpoint: 'game-over' });
  switch (game) {
    case 'beacon-lattice': {
      if (action.type === 'rotate') return { state: { ...next, rotation: (next.rotation + 1) % 4 }, message: 'Beacon orientation changed.' };
      if (action.type === 'select-piece') return { state: { ...next, selected: action.piece }, message: `Beacon ${action.piece + 1} selected.` };
      if (action.type === 'undo') {
        const previous = next.history.pop(); if (!previous) return { state, message: 'No placement is available to undo.' };
        return { state: { ...previous, history: next.history }, message: 'The previous beacon placement was removed.' };
      }
      if (action.type === 'place') {
        const shapes = BEACON_SHAPES[next.selected] ?? BEACON_SHAPES[0]!;
        const cells = rotateShape(shapes, next.rotation).map(([dr, dc]) => [Math.floor(action.cell / 5) + dr, action.cell % 5 + dc]);
        if (cells.some(([r, c]: number[]) => r < 0 || r >= 5 || c < 0 || c >= 5 || next.board[r * 5 + c] !== -1)) return { state, message: 'That beacon does not fit; it was not placed.' };
        const history = [...next.history, { ...state, history: [] }];
        for (const [r, c] of cells) next.board[r! * 5 + c!] = next.selected;
        next.inventory = next.inventory.filter((piece: number) => piece !== next.selected);
        next.moves += 1;
        if (next.inventory.length === 0 && next.board.every((cell: number) => cell >= 0)) return complete('win', 'Every cell is covered exactly once. Lattice complete.');
        if (next.inventory.length === 0) return complete('loss', 'The beacon inventory is used, but some cells remain uncovered. Reset to try again.');
        next.selected = next.inventory[0]; next.rotation = 0;
        return { state: { ...next, history }, message: 'Beacon placed. Continue covering every required cell without overlap.' };
      }
      return { state, message: '' };
    }
    case 'checkers': {
      if (action.type !== 'square' || next.complete) return { state, message: '' };
      const target = action.index as number; const selected = next.selected as number;
      const legalMoves = allCheckersLegalMoves(next.board, next.turn, next.forced);
      if (selected >= 0 && legalMoves.some((move) => move.from === selected && move.to === target)) {
        const board = [...next.board]; const piece = board[selected]; board[selected] = null;
        if (Math.abs(Math.floor(target / 8) - Math.floor(selected / 8)) === 2) board[((Math.floor(selected / 8) + Math.floor(target / 8)) / 2) * 8 + ((selected % 8 + target % 8) / 2)] = null;
        const promoted = piece === 'r' && Math.floor(target / 8) === 0 ? 'R' : piece === 'b' && Math.floor(target / 8) === 7 ? 'B' : piece;
        board[target] = promoted;
        const captured = Math.abs(Math.floor(target / 8) - Math.floor(selected / 8)) === 2;
        const moreJumps = captured ? checkersCaptureMoves(board, target) : [];
        const other = next.turn === 'r' ? 'b' : 'r';
        const opponentPieces = board.filter((item: string | null) => item && item.toLowerCase() === other).length;
        const canMove = board.some((item: string | null, index: number) => item && item.toLowerCase() === other && checkersMoves(board, index).length > 0);
        const done = opponentPieces === 0 || !canMove;
        if (done) return { state: { ...next, board, moveCount: next.moveCount + 1, selected: -1, complete: true }, message: `${next.turn === 'r' ? 'Red' : 'Black'} wins: the opponent has no legal continuation.`, outcome: 'win', breakpoint: 'game-over' };
        if (moreJumps.length) return { state: { ...next, board, selected: target, forced: target, moveCount: next.moveCount + 1 }, message: `Player ${next.turn === 'r' ? 1 : 2}'s Turn. Continue the same capture sequence with the selected piece.` };
        const turn = other;
        return { state: { ...next, board, turn, selected: -1, forced: -1, moveCount: next.moveCount + 1 }, message: `Player ${turn === 'r' ? 1 : 2}'s Turn. ${turn === 'r' ? 'Red' : 'Black'} moves.` };
      }
      const piece = next.board[target];
      if (piece && piece.toLowerCase() === next.turn && legalMoves.some((move) => move.from === target)) return { state: { ...next, selected: target }, message: `${piece === 'r' || piece === 'R' ? 'Red' : 'Black'} piece selected. Choose a highlighted legal destination.` };
      if (piece && piece.toLowerCase() === next.turn && legalMoves.some((move) => move.capture)) return { state, message: 'A capture is mandatory. Choose a piece with a legal jump.' };
      return { state, message: 'Choose one of your own pieces or a legal destination.' };
    }
    case 'color-flip': {
      if (action.type === 'mode') return { state: { ...next, mode: action.mode }, message: `${action.mode === 'trail' ? 'Trail' : 'Color cycle'} mode selected.` };
      if (action.type === 'color') return { state: { ...next, activeColor: action.color }, message: `${action.color} selected.` };
      if (action.type === 'rotate') { const colors = next.colors as string[]; const index = colors.indexOf(next.activeColor); return { state: { ...next, activeColor: colors[(index + 1) % colors.length] }, message: 'Active color advanced to the next swatch.' }; }
      if (action.type === 'step') {
        const turn = next.turn as number; const hit = next.activeColor === next.target[turn]; const score = next.score + (hit ? 1 : 0);
        if (turn + 1 >= next.target.length) return complete(score === next.target.length ? 'win' : 'draw', `Color session complete. ${score} of ${next.target.length} colors matched.`);
        const colors = next.colors as string[];
        const activeColor = next.mode === 'cycle' || next.rotating
          ? colors[(colors.indexOf(next.activeColor) + 1) % colors.length]
          : next.activeColor;
        return { state: { ...next, turn: turn + 1, score, activeColor }, message: hit ? `Matched ${next.target[turn]}. ${next.mode === 'cycle' || next.rotating ? `The active swatch rotates to ${activeColor}.` : 'The next color is ready.'}` : `The target was ${next.target[turn]}. Keep going; misses do not end the session.` };
      }
      return { state, message: '' };
    }
    case 'dots-and-boxes': {
      if (action.type !== 'edge' || next.complete) return { state, message: '' };
      const { orientation, row, column } = action;
      const index = orientation === 'h' ? row * 4 + column : row * 5 + column;
      const edges = orientation === 'h' ? next.horizontal : next.vertical;
      if (edges[index]) return { state, message: 'That edge is already drawn.' };
      edges[index] = true; let claimed = 0;
      const adjacent: number[] = orientation === 'h'
        ? [...(row > 0 ? [(row - 1) * 4 + column] : []), ...(row < 4 ? [row * 4 + column] : [])]
        : [...(column > 0 ? [row * 4 + column - 1] : []), ...(column < 4 ? [row * 4 + column] : [])];
      for (const box of adjacent) {
        if (next.boxes[box] !== 0) continue;
        const br = Math.floor(box / 4); const bc = box % 4;
        const closed = next.horizontal[br * 4 + bc] && next.horizontal[(br + 1) * 4 + bc] && next.vertical[br * 5 + bc] && next.vertical[br * 5 + bc + 1];
        if (closed) { next.boxes[box] = next.turn; claimed += 1; }
      }
      next.moves += 1;
      const done = next.boxes.every((owner: number) => owner > 0);
      if (done) {
        const counts = [next.boxes.filter((owner: number) => owner === 1).length, next.boxes.filter((owner: number) => owner === 2).length];
        return { state: { ...next, complete: true }, message: `Board filled. Player ${counts[0] === counts[1] ? 'tie' : counts[0] > counts[1] ? '1' : '2'} wins with ${Math.max(...counts)} boxes.`, outcome: counts[0] === counts[1] ? 'draw' : counts[0] > counts[1] ? 'win' : 'loss', breakpoint: 'game-over' };
      }
      const movingPlayer = next.turn;
      if (!claimed) next.turn = next.turn === 1 ? 2 : 1;
      return { state: next, message: claimed ? `Player ${movingPlayer}'s Turn. Draw again.` : `Player ${next.turn}'s Turn.` };
    }
    case 'freecell': return freecellAction(next, action, complete);
    case 'gomoku': {
      if (action.type === 'cursor') return { state: { ...next, selected: action.index }, message: `Selected row ${Math.floor(action.index / 15) + 1}, column ${action.index % 15 + 1}.` };
      if (action.type !== 'place' || next.complete || next.board[action.index] !== null) return { state, message: 'Choose an empty intersection.' };
      next.board[action.index] = next.turn; next.moves += 1;
      if (hasFive(next.board, action.index, next.turn)) return complete('win', `Player ${next.turn} makes a line of five or more.`);
      if (next.moves >= 225) return complete('draw', 'The board is full. Gomoku ends in a draw.');
      next.turn = next.turn === 'X' ? 'O' : 'X';
      return { state: next, message: `Player ${next.turn === 'X' ? 1 : 2}'s Turn.` };
    }
    case 'klondike': return klondikeAction(next, action, complete);
    case 'memory-match': {
      if (action.type !== 'flip' || next.complete || next.mismatch || next.matched[action.index] || next.revealed.includes(action.index)) return { state, message: '' };
      next.revealed.push(action.index);
      if (next.revealed.length === 2) {
        next.moves += 1;
        const [first, second] = next.revealed;
        if (next.deck[first] === next.deck[second]) {
          next.matched[first] = true; next.matched[second] = true; next.revealed = [];
          if (next.matched.every(Boolean)) return complete('win', `All eight pairs found in ${next.moves} turns.`);
          return { state: next, message: 'Pair found. Both symbols stay visible.' };
        }
        next.mismatch = true;
        return { state: next, message: 'Those symbols differ. They will turn over after a short pause.' };
      }
      return { state: next, message: `Card ${action.index + 1} revealed. Choose one more card.` };
    }
    case 'minesweeper': return minesweeperAction(next, action, complete);
    case 'mini-sudoku':
    case 'sudoku-9x9': {
      if (action.type === 'select') return { state: { ...next, selected: action.index }, message: `Cell ${Math.floor(action.index / next.size) + 1}, ${action.index % next.size + 1} selected.` };
      if (action.type !== 'digit' || next.complete) return { state, message: '' };
      const index = next.selected; const value = action.value;
      if (next.initial[index] !== 0) return { state, message: 'Given clues cannot be changed.' };
      if (value !== 0 && !isValidSudokuEntry(next.board, next.size, index, value)) return { state, message: 'That digit would repeat in this row, column, or box.' };
      const board = [...next.board]; board[index] = value;
      const correct = next.solution[index] === value;
      next.board = board; next.mistakes += value !== 0 && !correct ? 1 : 0;
      if (board.every((cell: number, i: number) => cell === next.solution[i])) return complete('win', 'Every row, column, and box is complete. Puzzle solved.');
      return { state: next, message: value === 0 ? 'Cell cleared.' : correct ? `Digit ${value} entered.` : `Digit ${value} entered. Check the full row, column, and box before keeping it.` };
    }
    case 'nine-mens-morris': return morrisAction(next, action, complete);
    case 'nonogram': {
      if (action.type === 'size') return { state: makeNonogramState(action.size), message: `${action.size} by ${action.size} picture puzzle selected.` };
      if (action.type === 'select') return { state: { ...next, selected: action.index }, message: `Row ${Math.floor(action.index / next.size) + 1}, column ${action.index % next.size + 1} selected.` };
      if (action.type === 'toggle') {
        const index = action.index; next.marks[index] = (next.marks[index] + 1) % 3; next.selected = index;
        const solved = next.solution.every((filled: boolean, cell: number) => !filled || next.marks[cell] === 1)
          && next.marks.every((mark: number, cell: number) => mark !== 1 || next.solution[cell]);
        if (solved) return complete('win', 'Every required run is filled and no extra cell is marked. Picture solved.');
        return { state: next, message: next.marks[index] === 1 ? 'Cell filled. Compare its row and column runs.' : next.marks[index] === 2 ? 'Cell marked empty.' : 'Cell cleared.' };
      }
      return { state, message: '' };
    }
    case 'pass-the-picture': {
      if (action.type === 'color') return { state: { ...next, color: action.color }, message: `Stroke color set to ${action.name}.` };
      if (action.type === 'stroke') {
        if (next.complete) return { state, message: 'This drawing session is finished.' };
        next.strokes.push({ color: next.color, points: action.points }); next.passes += 1;
        if (next.passes >= next.maxPasses) return complete('win', `The shared drawing is complete after ${next.passes} passes.`);
        return { state: next, message: `Artist ${next.passes + 1}'s Turn.` };
      }
      if (action.type === 'undo') return { state: { ...next, strokes: next.strokes.slice(0, -1), passes: Math.max(0, next.passes - 1), complete: false }, message: 'The latest stroke was removed.' };
      if (action.type === 'finish') return complete('win', 'The artists ended the session. The finished drawing is ready to keep.');
      return { state, message: '' };
    }
    case 'reversi': return reversiAction(next, action);
    case 'tile-garden': return tileGardenAction(next, action, complete);
    case 'word-search': {
      if (action.type !== 'cell') return { state, message: '' };
      const selection = [...next.selection];
      if (selection.length === 0 || selection.length >= 2) selection.splice(0, selection.length, action.index);
      else selection.push(action.index);
      if (selection.length === 2) {
        const path = getStraightPath(selection[0], selection[1], 8);
        const word = path.map((index: number) => next.grid[index]).join('');
        const reverse = [...word].reverse().join('');
        const target = next.words.find((candidate: string) => candidate === word || candidate === reverse);
        if (target && !next.found.includes(target)) {
          next.found.push(target); next.selection = [];
          if (next.found.length === next.words.length) return complete('win', 'Every hidden word has been found. Puzzle complete.');
          return { state: next, message: `${target} found. Choose another listed word.` };
        }
        if (!path.length) { next.selection = [selection[0]]; return { state: next, message: 'Choose a straight horizontal, vertical, or diagonal endpoint.' }; }
        next.selection = []; return { state: next, message: `${word} is not an unfound listed word. Try another pair of endpoints.` };
      }
      return { state: { ...next, selection }, message: `Start cell ${action.index + 1} selected. Choose the far end of a straight word.` };
    }
    case 'word-tile-rush': {
      if (action.type === 'tile') {
        if (next.complete || next.path.length >= 12) return { state, message: 'Submit or clear the current letter path first.' };
        const index = action.index;
        if (next.path.includes(index)) return { state: { ...next, path: next.path.slice(0, next.path.indexOf(index) + 1), startedClock: true }, message: 'Path shortened to the selected tile.' };
        const previous = next.path.at(-1);
        if (previous !== undefined && Math.max(Math.abs(Math.floor(previous / 6) - Math.floor(index / 6)), Math.abs(previous % 6 - index % 6)) > 1) return { state, message: 'Choose a neighboring letter, including a diagonal neighbor.' };
        next.path.push(index); next.startedClock = true;
        return { state: next, message: `Path reads ${next.path.map((cell: number) => next.grid[cell]).join('')}.` };
      }
      if (action.type === 'clear-path') return { state: { ...next, path: [] }, message: 'Letter path cleared.' };
      if (action.type === 'submit-word') {
        const word = next.path.map((index: number) => next.grid[index]).join('');
        if (!RUSH_WORDS.has(word)) return { state: { ...next, path: [] }, message: `${word || 'That path'} is not in the local word list; no points were added.` };
        const grid = [...next.grid]; next.path.forEach((index: number) => { grid[index] = ''; });
        settleColumns(grid, 6, 8);
        const rowsAdded = next.rowsAdded + 1;
        for (let column = 0; column < 6; column += 1) grid[(8 - 1) * 6 + column] = String.fromCharCode(65 + ((rowsAdded * 7 + column * 5) % 26));
        next.grid = grid; next.rowsAdded = rowsAdded; next.path = []; next.score += word.length;
        if (grid.slice(0, 6).some(Boolean)) return complete('loss', `The rising letters reached the top after ${next.score} points.`);
        return { state: next, message: `${word} accepted for ${word.length} points. The grid rises one row.` };
      }
      if (action.type === 'tick') {
        next.seconds = Math.max(0, next.seconds - 1);
        if (next.seconds === 0) return complete('loss', `Time ended with ${next.score} points.`);
        return { state: next, message: '' };
      }
      return { state, message: '' };
    }
  }
}

export const BEACON_NAMES = ['F', 'V', 'I', 'U', 'L'] as const;
const BEACON_SHAPES: number[][][] = [
  [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
];
export function rotateShape(shape: number[][], turns: number): number[][] {
  let result = shape.map(([row, column]) => [row!, column!]);
  for (let turn = 0; turn < turns; turn += 1) {
    const maxRow = Math.max(...result.map(([row]) => row!));
    result = result.map(([row, column]) => [column!, maxRow - row!]);
    const minRow = Math.min(...result.map(([row]) => row!));
    const minColumn = Math.min(...result.map(([, column]) => column!));
    result = result.map(([row, column]) => [row! - minRow, column! - minColumn]);
  }
  return result;
}

function freecellAction(state: Phase4cState, action: Phase4cAction, complete: (outcome: ArcadeGameOutcome, message: string) => Phase4cTransition): Phase4cTransition {
  if (action.type === 'select') return { state: { ...state, selection: action.source }, message: `${action.label} selected. Choose a destination.` };
  if (action.type === 'move-foundation') {
    const selection = state.selection; if (!selection) return { state, message: 'Select a card first.' };
    const pile = selection.pile === 'free' ? [state.free[selection.index] as PlayingCard] : state.tableau[selection.index] as PlayingCard[];
    const card = selection.pile === 'free' ? pile[0] : pile.at(-1); if (!card || selection.pile === 'tableau' && selection.cardIndex !== pile.length - 1) return { state, message: 'Only an exposed card can move to a foundation.' };
    if (action.suit && action.suit !== card.suit) return { state, message: `${cardName(card)} belongs on the ${card.suit} foundation.` };
    const expected = state.foundations[card.suit] + 1; if (card.rank !== expected) return { state, message: 'A foundation starts with Ace and grows upward by suit.' };
    if (selection.pile === 'free') state.free[selection.index] = null; else (state.tableau[selection.index] as PlayingCard[]).pop();
    state.foundations[card.suit] = card.rank; state.selection = null; state.moves += 1;
    if (Object.values(state.foundations).every((rank: any) => rank === 13)) return complete('win', 'All four foundations reach King. FreeCell solved.');
    return { state, message: `${cardName(card)} moved to its foundation.` };
  }
  if (action.type === 'move-free') {
    const selection = state.selection; if (!selection) return { state, message: 'Select a card first.' };
    if (state.free[action.index]) return { state, message: 'That free cell is occupied.' };
    if (selection.pile === 'free') {
      const card = state.free[selection.index] as PlayingCard | null;
      if (!card || selection.index === action.index) return { state, message: 'Choose a different empty free cell.' };
      state.free[selection.index] = null; state.free[action.index] = card; state.selection = null; state.moves += 1;
      return { state, message: `${cardName(card)} moved to free cell ${action.index + 1}.` };
    }
    const source = state.tableau[selection.index] as PlayingCard[]; const card = source[selection.cardIndex] as PlayingCard;
    if (selection.cardIndex !== source.length - 1) return { state, message: 'A free cell holds one exposed card; select the column top.' };
    source.pop(); state.free[action.index] = card; state.selection = null; state.moves += 1;
    return { state, message: `${cardName(card)} moved to free cell ${action.index + 1}.` };
  }
  if (action.type === 'move-tableau') {
    const selection = state.selection; if (!selection) return { state, message: 'Select a card first.' };
    if (selection.pile === 'tableau' && selection.index === action.index) return { state, message: 'Choose a different tableau column.' };
    const source = selection.pile === 'free' ? [state.free[selection.index] as PlayingCard] : state.tableau[selection.index] as PlayingCard[];
    const sourceIndex = selection.pile === 'free' ? 0 : selection.cardIndex;
    const cards = source.slice(sourceIndex) as PlayingCard[]; const target = state.tableau[action.index] as PlayingCard[];
    const top = target.at(-1);
    const validStack = cards.every((card, i) => i === 0 || cards[i - 1]!.rank === card.rank + 1 && cardIsRed(cards[i - 1]!) !== cardIsRed(card));
    const fits = top ? top.rank === cards[0]!.rank + 1 && cardIsRed(top) !== cardIsRed(cards[0]!) : true;
    const emptyCells = state.free.filter((card: PlayingCard | null) => card === null).length;
    const emptyColumns = state.tableau.filter((column: PlayingCard[], index: number) => !column.length && index !== action.index).length;
    const capacity = (emptyCells + 1) * (2 ** emptyColumns);
    if (!validStack || !fits || cards.length > capacity) return { state, message: `That move is not legal. Current free-cell capacity is ${capacity} card${capacity === 1 ? '' : 's'}.` };
    if (selection.pile === 'free') state.free[selection.index] = null; else source.splice(selection.cardIndex);
    target.push(...cards); state.selection = null; state.moves += 1;
    return { state, message: `${cards.length} card${cards.length === 1 ? '' : 's'} moved to tableau column ${action.index + 1}.` };
  }
  return { state, message: '' };
}

function klondikeAction(state: Phase4cState, action: Phase4cAction, complete: (outcome: ArcadeGameOutcome, message: string) => Phase4cTransition): Phase4cTransition {
  if (action.type === 'flip') {
    const pile = state.tableau[action.column] as PlayingCard[]; const card = pile[action.cardIndex];
    if (!card || card.faceUp) return { state, message: 'That card is already visible.' };
    if (action.cardIndex !== pile.length - 1) return { state, message: 'Only the newly exposed top card turns face up.' };
    card.faceUp = true; state.moves += 1;
    return { state, message: `${cardName(card)} turned face up.` };
  }
  if (action.type === 'draw') {
    if (state.stock.length) {
      const stock = [...state.stock]; const waste = [...state.waste];
      for (let i = 0; i < state.drawMode && stock.length; i += 1) waste.push({ ...stock.pop()!, faceUp: true });
      return { state: { ...state, stock, waste, selection: null, moves: state.moves + 1 }, message: `${waste.at(-1) ? cardName(waste.at(-1)) : 'Card'} revealed. Choose a move.` };
    }
    if (!state.waste.length) return { state, message: 'No cards remain in the stock or waste.' };
    const stock = [...state.waste].reverse().map((card: PlayingCard) => ({ ...card, faceUp: false }));
    return { state: { ...state, stock, waste: [], selection: null, moves: state.moves + 1 }, message: 'Waste returned to the stock.' };
  }
  if (action.type === 'select-waste') return { state: { ...state, selection: { pile: 'waste' } }, message: 'Waste card selected. Choose a legal destination.' };
  if (action.type === 'select-tableau') return { state: { ...state, selection: { pile: 'tableau', index: action.column, cardIndex: action.cardIndex } }, message: `Column ${action.column + 1} card selected.` };
  if (action.type === 'move-foundation') {
    const selection = state.selection;
    const source = selection?.pile === 'waste' ? state.waste : selection?.pile === 'tableau' ? state.tableau[selection.index] : null;
    const card = source?.at(-1) as PlayingCard | undefined;
    if (!card || selection.pile === 'tableau' && selection.cardIndex !== source!.length - 1) return { state, message: 'Only a selected exposed card can move to a foundation.' };
    if (action.suit && action.suit !== card.suit) return { state, message: `${cardName(card)} belongs on the ${card.suit} foundation.` };
    const foundation = state.foundations[card.suit] as number[];
    if (card.rank !== foundation.length + 1) return { state, message: 'A foundation grows from Ace to King in one suit.' };
    source!.pop(); foundation.push(card.rank); state.selection = null; state.moves += 1;
    if (Object.values(state.foundations).every((pile: any) => pile.length === 13)) return complete('win', 'All four suits reach King. Klondike solved.');
    return { state, message: `${cardName(card)} moved to its foundation.` };
  }
  if (action.type === 'move-tableau') {
    const selection = state.selection;
    if (!selection) return { state, message: 'Select a waste or tableau card first.' };
    const source = selection.pile === 'waste' ? state.waste : state.tableau[selection.index] as PlayingCard[];
    const sourceIndex = selection.pile === 'waste' ? source.length - 1 : selection.cardIndex;
    const cards = source.slice(sourceIndex) as PlayingCard[]; const target = state.tableau[action.column] as PlayingCard[]; const top = target.at(-1);
    const valid = cards.length > 0 && cards.every((card, i) => i === 0 || cards[i - 1]!.rank === card.rank + 1 && cardIsRed(cards[i - 1]!) !== cardIsRed(card))
      && (top ? top.rank === cards[0]!.rank + 1 && cardIsRed(top) !== cardIsRed(cards[0]!) : cards[0]!.rank === 13);
    if (!valid) return { state, message: 'Build tableau piles downward in alternating colors; only a King starts an empty column.' };
    source.splice(sourceIndex); target.push(...cards);
    if (selection.pile === 'tableau' && source.length && !source.at(-1)!.faceUp) source[source.length - 1]!.faceUp = true;
    state.selection = null; state.moves += 1;
    return { state, message: `${cards.length} card${cards.length === 1 ? '' : 's'} moved to column ${action.column + 1}.` };
  }
  if (action.type === 'draw-mode') return { state: { ...state, drawMode: action.value }, message: `Draw ${action.value} mode selected.` };
  return { state, message: '' };
}

function minesweeperAction(state: Phase4cState, action: Phase4cAction, complete: (outcome: ArcadeGameOutcome, message: string) => Phase4cTransition): Phase4cTransition {
  if (action.type === 'select') return { state: { ...state, selected: action.index }, message: `Row ${Math.floor(action.index / 9) + 1}, column ${action.index % 9 + 1} selected.` };
  if (action.type === 'flag') {
    const cell = state.cells[action.index]; if (cell.open) return { state, message: 'An open cell cannot be flagged.' };
    state.selected = action.index; cell.flag = !cell.flag; state.flags += cell.flag ? 1 : -1;
    return { state, message: cell.flag ? `Flag placed at cell ${action.index + 1}.` : 'Flag removed.' };
  }
  if (action.type !== 'reveal') return { state, message: '' };
  const size = state.rows; const start = action.index; state.selected = start;
  if (state.cells[start].open || state.cells[start].flag) return { state, message: 'That cell is already open or flagged.' };
  if (state.firstClick) {
    let seed = state.seed; const mines = new Set<number>();
    while (mines.size < state.mines) { seed = nextSeed(seed); const index = seed % (size * size); if (index !== start) mines.add(index); }
    state.cells = Array.from({ length: size * size }, (_, index) => ({ mine: mines.has(index), open: false, flag: false, count: 0 }));
    for (let index = 0; index < state.cells.length; index += 1) {
      if (state.cells[index].mine) continue;
      const row = Math.floor(index / size); const column = index % size;
      state.cells[index].count = neighborIndexes(row, column, size, size).filter((neighbor) => mines.has(neighbor)).length;
    }
    state.firstClick = false;
  }
  const cell = state.cells[start];
  if (cell.mine) { state.cells.forEach((item: any) => { if (item.mine) item.open = true; }); return complete('loss', 'A mine was revealed. The mine map is shown; restart for a fresh layout.'); }
  const stack = [start]; const seen = new Set<number>();
  while (stack.length) {
    const index = stack.pop()!; if (seen.has(index) || state.cells[index].open || state.cells[index].flag) continue;
    seen.add(index); state.cells[index].open = true; state.opened += 1;
    if (state.cells[index].count === 0) stack.push(...neighborIndexes(Math.floor(index / size), index % size, size, size));
  }
  if (state.opened === size * size - state.mines) return complete('win', 'Every safe cell is open. Minefield cleared.');
  return { state, message: `${state.cells[start].count ? `${state.cells[start].count} neighboring mine${state.cells[start].count === 1 ? '' : 's'}` : 'Open area'} revealed.` };
}

export function neighborIndexes(row: number, column: number, rows: number, columns: number): number[] {
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
    if (!dr && !dc) continue;
    const r = row + dr; const c = column + dc;
    if (r >= 0 && r < rows && c >= 0 && c < columns) result.push(r * columns + c);
  }
  return result;
}

function morrisAction(state: Phase4cState, action: Phase4cAction, complete: (outcome: ArcadeGameOutcome, message: string) => Phase4cTransition): Phase4cTransition {
  if (action.type === 'cursor') return { state: { ...state, cursor: action.index }, message: `Point ${action.index + 1} selected for this turn.` };
  if (action.type !== 'point' || state.complete) return { state, message: '' };
  const point = action.index; state.cursor = point; const board = state.board as number[];
  if (state.removeMode) {
    if (board[point] !== (state.turn === 1 ? 2 : 1) || isInMill(board, point) && board.some((owner, index) => owner === (state.turn === 1 ? 2 : 1) && !isInMill(board, index))) return { state, message: 'Choose an opponent stone outside a mill, unless every opposing stone is protected.' };
    board[point] = 0; state.removeMode = false; state.moves += 1;
    const opponent = state.turn === 1 ? 2 : 1;
    const remaining = board.filter((owner) => owner === opponent).length;
    if (remaining < 3 && state.reserve[opponent - 1] === 0) return complete('win', `Player ${state.turn} wins after reducing the opposing stones below three.`);
    const canMove = board.some((owner: number, index: number) => owner === opponent && (remaining <= 3
      ? board.some((cell: number) => cell === 0)
      : morrisNeighbors(index).some((neighbor) => board[neighbor] === 0)));
    if (state.reserve[opponent - 1] === 0 && !canMove) return complete('win', `Player ${state.turn} wins: the opponent has no legal move.`);
    state.turn = opponent;
    return { state, message: `Player ${state.turn}'s Turn.` };
  }
  if (state.reserve[state.turn - 1] > 0) {
    if (board[point] !== 0) return { state, message: 'Choose an empty point for one of your reserve stones.' };
    board[point] = state.turn; state.reserve[state.turn - 1] -= 1; state.moves += 1;
    if (isInMill(board, point)) { state.removeMode = true; return { state, message: `Player ${state.turn}'s Turn. Mill formed; remove an opposing stone.` }; }
    state.turn = state.turn === 1 ? 2 : 1;
    return { state, message: `Player ${state.turn}'s Turn.` };
  }
  const mine = state.turn;
  if (state.selected < 0) {
    if (board[point] !== mine) return { state, message: 'Select one of your own stones.' };
    state.selected = point; return { state, message: 'Stone selected. Choose a connected empty point.' };
  }
  if (board[point] === mine) { state.selected = point; return { state, message: 'Selection moved to another one of your stones.' }; }
  if (board[point] !== 0 || !morrisNeighbors(state.selected).includes(point) && board.filter((owner: number) => owner === mine).length > 3) return { state, message: 'That destination is not connected to the selected point.' };
  board[state.selected] = 0; board[point] = mine; state.selected = -1; state.moves += 1;
  if (isInMill(board, point)) { state.removeMode = true; return { state, message: `Player ${mine}'s Turn. Mill formed; remove an opposing stone.` }; }
  const opponent = mine === 1 ? 2 : 1;
  if (!board.some((owner: number, index: number) => owner === opponent && morrisNeighbors(index).some((to) => board[to] === 0))) return complete('win', `Player ${mine} wins: the opponent has no legal move.`);
  state.turn = opponent;
  return { state, message: `Player ${opponent}'s Turn.` };
}

export const MORRIS_POINTS: readonly [number, number][] = [
  [0, 0], [3, 0], [6, 0], [1, 1], [3, 1], [5, 1], [2, 2], [3, 2], [4, 2],
  [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [2, 4], [3, 4], [4, 4],
  [1, 5], [3, 5], [5, 5], [0, 6], [3, 6], [6, 6],
];
const MORRIS_LINES: readonly number[][] = [
  [0, 1, 2], [2, 14, 23], [23, 22, 21], [21, 9, 0],
  [3, 4, 5], [5, 13, 20], [20, 19, 18], [18, 10, 3],
  [6, 7, 8], [8, 12, 17], [17, 16, 15], [15, 11, 6],
  [1, 4, 7], [9, 10, 11], [12, 13, 14], [16, 19, 22],
];
const MORRIS_EDGES: readonly [number, number][] = [
  [0, 1], [1, 2], [2, 14], [14, 23], [23, 22], [22, 21], [21, 9], [9, 0],
  [3, 4], [4, 5], [5, 13], [13, 20], [20, 19], [19, 18], [18, 10], [10, 3],
  [6, 7], [7, 8], [8, 12], [12, 17], [17, 16], [16, 15], [15, 11], [11, 6],
  [1, 4], [4, 7], [9, 10], [10, 11], [12, 13], [13, 14], [16, 19], [19, 22],
];
export function morrisNeighbors(point: number): number[] {
  return MORRIS_EDGES.flatMap(([first, second]) => first === point ? [second] : second === point ? [first] : []);
}
function isInMill(board: number[], point: number): boolean { return MORRIS_LINES.some((line) => line.includes(point) && line.every((index) => board[index] === board[point]) && board[point] > 0); }

function reversiAction(state: Phase4cState, action: Phase4cAction): Phase4cTransition {
  if (action.type !== 'cell' || state.complete) return { state, message: '' };
  const legal = reversiLegalMoves(state.board, state.turn);
  if (!legal.includes(action.index)) return { state, message: legal.length ? 'Choose a highlighted legal square.' : 'The game is resolving an automatic pass.' };
  const board = [...state.board]; const other = state.turn === 1 ? 2 : 1; board[action.index] = state.turn;
  const row = Math.floor(action.index / 8); const column = action.index % 8;
  for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
    let r = row + dr; let c = column + dc; const line: number[] = [];
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === other) { line.push(r * 8 + c); r += dr; c += dc; }
    if (line.length && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === state.turn) line.forEach((index) => { board[index] = state.turn; });
  }
  const nextPlayer = other as 1 | 2;
  if (!reversiLegalMoves(board, nextPlayer).length) {
    if (!reversiLegalMoves(board, state.turn).length || board.every((cell: number) => cell > 0)) return reversiFinish({ ...state, board, complete: true }, board);
    return { state: { ...state, board, moves: state.moves + 1, passes: state.passes + 1 }, message: `Player ${state.turn}'s Turn. Player ${nextPlayer} passes.` };
  }
  return { state: { ...state, board, turn: nextPlayer, moves: state.moves + 1, passes: 0 }, message: `Player ${nextPlayer}'s Turn.` };
}
function reversiFinish(state: Phase4cState, board: number[]): Phase4cTransition {
  const first = board.filter((cell) => cell === 1).length; const second = board.filter((cell) => cell === 2).length;
  return { state: { ...state, complete: true }, message: `Final count: Player 1 ${first}, Player 2 ${second}. ${first === second ? 'The game is a draw.' : `Player ${first > second ? 1 : 2} wins.`}`, outcome: first === second ? 'draw' : first > second ? 'win' : 'loss', breakpoint: 'game-over' };
}

function tileGardenAction(state: Phase4cState, action: Phase4cAction, complete: (outcome: ArcadeGameOutcome, message: string) => Phase4cTransition): Phase4cTransition {
  if (action.type === 'mode') return { state: { ...state, mode: action.mode }, message: `${action.mode} mode selected.` };
  if (action.type !== 'plant' || state.complete) return { state, message: '' };
  if (state.board[action.index] !== 0) return { state, message: 'Choose an empty garden bed.' };
  const board = [...state.board]; board[action.index] = state.nextSeed; let merges = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (let row = 0; row < 7 && !changed; row += 1) for (let column = 0; column < 7 && !changed; column += 1) {
      const cells = [row * 8 + column, row * 8 + column + 1, (row + 1) * 8 + column, (row + 1) * 8 + column + 1];
      const value = board[cells[0]!];
      if (value > 0 && cells.every((cell) => board[cell] === value)) {
        cells.slice(1).forEach((cell) => { board[cell] = 0; }); board[cells[0]!] = value + 1; merges += 1; changed = true;
      }
    }
  }
  const moves = state.moves + 1; const nextSeed = (moves % 3 === 0 ? 2 : 1);
  const center = [27, 28, 35, 36];
  if (center.some((cell) => board[cell] >= 5)) return complete('win', 'A Flower blooms in the center garden. Goal reached.');
  const hasSpace = board.some((value: number) => value === 0);
  if (!hasSpace) return complete('loss', 'Every garden bed is occupied before the target Flower blooms.');
  return { state: { ...state, board, moves, nextSeed }, message: merges ? `A group merged ${merges} time${merges === 1 ? '' : 's'}. The next seed is tier ${nextSeed}.` : `Seed planted. The next seed is tier ${nextSeed}.` };
}

export function getStraightPath(start: number, end: number, size: number): number[] {
  const sr = Math.floor(start / size); const sc = start % size; const er = Math.floor(end / size); const ec = end % size;
  const dr = Math.sign(er - sr); const dc = Math.sign(ec - sc);
  if (!(sr === er || sc === ec || Math.abs(er - sr) === Math.abs(ec - sc))) return [];
  const length = Math.max(Math.abs(er - sr), Math.abs(ec - sc)) + 1;
  return Array.from({ length }, (_, step) => (sr + dr * step) * size + sc + dc * step);
}

function settleColumns(grid: string[], columns: number, rows: number): void {
  for (let column = 0; column < columns; column += 1) {
    const letters = Array.from({ length: rows }, (_, row) => grid[row * columns + column]).filter(Boolean);
    const empty = rows - letters.length;
    for (let row = 0; row < rows; row += 1) grid[row * columns + column] = row < empty ? '' : letters[row - empty]!;
  }
}
const RUSH_WORDS = new Set(['STAR', 'STONE', 'STREAM', 'RAIN', 'TRAIN', 'MOON', 'MOONS', 'NOTE', 'TONE', 'SAND', 'SOUND', 'CLOUD', 'CLOUDS', 'GARDEN', 'GLOW', 'GROWS', 'PLANT', 'PLANTS', 'FLOWER', 'FLOWERS', 'EARTH', 'HEART', 'SHARE', 'SHARES', 'WATER', 'WATERED', 'CATS', 'CART', 'CARE', 'CAREs'.toUpperCase(), 'READ', 'READS', 'LEARN', 'LEARNED', 'GAME', 'GAMES', 'WORD', 'WORDS', 'TILE', 'TILES', 'RIVER', 'RIVERS', 'LIGHT', 'LIGHTS']);
