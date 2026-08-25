export interface Point {
  row: number;
  col: number;
}

export interface Placement {
  word: string;
  start: Point;
  end: Point;
}

export interface WordSearchPuzzle {
  size: number;
  grid: string[][];
  placements: Placement[];
  words: string[];
  seed: number;
}

const DIRS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

const fallback = [
  'cat',
  'dog',
  'fish',
  'bear',
  'lion',
  'horse',
  'mouse',
  'rabbit',
  'tiger',
  'eagle',
  'whale',
  'shark',
];

function rng(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

export function normalizeWords(words: unknown): string[] {
  if (!Array.isArray(words)) return [];
  return words
    .filter((x) => typeof x === 'string')
    .map((x) => x.trim().toLowerCase())
    .filter((x) => /^[a-z]+$/.test(x) && x.length > 1);
}

export function safeWords(words: unknown): string[] {
  const clean = normalizeWords(words);
  return clean.length === 12 ? clean : fallback.slice();
}

/** Words that can physically fit on a board of the given size. */
export function wordsForSize(words: unknown, size: number): string[] {
  const custom = normalizeWords(words);
  const source = custom.length > 0 ? custom : safeWords(words);
  return source.filter((word) => word.length <= size);
}

export function createPuzzle(
  words: unknown = fallback,
  size = 8,
  seed = Date.now(),
): WordSearchPuzzle {
  size = size === 10 ? 10 : 8;
  const list = wordsForSize(words, size).sort((a, b) => b.length - a.length);
  const random = rng(seed);

  let placements: Placement[] = [];
  let grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));

  if (list.length === 0) {
    fillEmpties(grid, size, random);
    return { size, grid, placements: [], words: [], seed };
  }

  for (let attempt = 0; attempt < 80; attempt++) {
    grid = Array.from({ length: size }, () => Array(size).fill(''));
    placements = [];
    let ok = true;
    for (const word of list) {
      const placed = placeWord(grid, size, word, random);
      if (!placed) {
        ok = false;
        break;
      }
      placements.push(placed);
    }
    if (ok) break;
  }

  // Never return a full word list that was not fully placed.
  if (placements.length !== list.length) {
    const placedWords = new Set(placements.map((p) => p.word));
    return {
      size,
      grid: fillEmpties(grid, size, random),
      placements,
      words: list.filter((w) => placedWords.has(w)),
      seed,
    };
  }

  fillEmpties(grid, size, random);
  return { size, grid, placements, words: list, seed };
}

function placeWord(
  grid: string[][],
  size: number,
  word: string,
  random: () => number,
): Placement | null {
  const choices = DIRS.map(([dr, dc]) => ({ dr, dc }));
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const t = choices[i]!;
    choices[i] = choices[j]!;
    choices[j] = t;
  }
  for (const { dr, dc } of choices) {
    for (let tries = 0; tries < 120; tries++) {
      const r = Math.floor(random() * size);
      const c = Math.floor(random() * size);
      const er = r + dr * (word.length - 1);
      const ec = c + dc * (word.length - 1);
      if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
      let valid = true;
      for (let i = 0; i < word.length; i++) {
        const old = grid[r + dr * i]![c + dc * i];
        if (old && old !== word[i]) {
          valid = false;
          break;
        }
      }
      if (!valid) continue;
      for (let i = 0; i < word.length; i++) {
        grid[r + dr * i]![c + dc * i] = word[i]!;
      }
      return { word, start: { row: r, col: c }, end: { row: er, col: ec } };
    }
  }
  return null;
}

function fillEmpties(grid: string[][], size: number, random: () => number): string[][] {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r]![c]) grid[r]![c] = letters[Math.floor(random() * letters.length)]!;
    }
  }
  return grid;
}

export function sameLine(a: Point, b: Point) {
  const dr = Math.sign(b.row - a.row);
  const dc = Math.sign(b.col - a.col);
  return (dr === 0 || dc === 0 || Math.abs(b.row - a.row) === Math.abs(b.col - a.col)) && !(a.row === b.row && a.col === b.col);
}

export function selectedWord(puzzle: WordSearchPuzzle, start: Point, end: Point): string | null {
  if (!sameLine(start, end)) return null;
  const dr = Math.sign(end.row - start.row);
  const dc = Math.sign(end.col - start.col);
  const length = Math.max(Math.abs(end.row - start.row), Math.abs(end.col - start.col)) + 1;
  const text = Array.from({ length }, (_, i) => puzzle.grid[start.row + dr * i]?.[start.col + dc * i] ?? '').join('');
  return puzzle.words.find((w) => w === text || w === text.split('').reverse().join('')) ?? null;
}

export function isComplete(found: string[], words: string[]) {
  return words.length > 0 && words.every((w) => found.includes(w));
}
