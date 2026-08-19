import type { Cell } from './types';

export function rect(x0: number, y0: number, x1: number, y1: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) cells.push({ x, y });
  }
  return cells;
}

export function plus(cx: number, cy: number, arm = 1): Cell[] {
  const cells = [{ x: cx, y: cy }];
  for (let i = 1; i <= arm; i += 1) {
    cells.push({ x: cx, y: cy - i }, { x: cx, y: cy + i }, { x: cx - i, y: cy }, { x: cx + i, y: cy });
  }
  return cells;
}

export function diamond(cx: number, cy: number): Cell[] {
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy - 1 },
    { x: cx + 1, y: cy - 1 },
    { x: cx - 1, y: cy + 1 },
    { x: cx + 1, y: cy + 1 },
  ];
}

export function uniqueCells(...groups: Cell[][]): Cell[] {
  const seen = new Set<string>();
  const cells: Cell[] = [];
  for (const group of groups) {
    for (const cell of group) {
      const key = `${cell.x},${cell.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push(cell);
    }
  }
  return cells;
}
