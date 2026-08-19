import type { BeaconType, Cell } from './types';

export const PATTERN_OFFSETS: Record<BeaconType, readonly Cell[]> = {
  cross: [
    { x: 0, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ],
  diagonal: [
    { x: 0, y: 0 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ],
  horizontal: [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ],
  vertical: [
    { x: 0, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ],
};

export const BEACON_META: Record<
  BeaconType,
  { name: string; short: string; shortcut: string; description: string }
> = {
  cross: {
    name: 'Cross',
    short: '+',
    shortcut: '1',
    description: 'Covers its cell plus one orthogonal neighbor in each direction.',
  },
  diagonal: {
    name: 'Diagonal',
    short: 'X',
    shortcut: '2',
    description: 'Covers its cell plus the four diagonal neighbors.',
  },
  horizontal: {
    name: 'Horizontal',
    short: '—',
    shortcut: '3',
    description: 'Covers its cell plus the adjacent left and right cells.',
  },
  vertical: {
    name: 'Vertical',
    short: '|',
    shortcut: '4',
    description: 'Covers its cell plus the adjacent cells above and below.',
  },
};

export function isBeaconType(value: string): value is BeaconType {
  return value === 'cross' || value === 'diagonal' || value === 'horizontal' || value === 'vertical';
}
