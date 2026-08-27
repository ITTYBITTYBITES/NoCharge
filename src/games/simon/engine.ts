/**
 * Sequence memory rules for the NoCharge edition.
 *
 * The engine is colour-agnostic: pads are abstract ids (0–3) and the UI maps
 * them to colour + icon + spoken label. A "calm pattern" presentation can
 * therefore substitute symbols and static highlights for flashing colour — the
 * rules never change.
 */

export const SIMON_PADS = 4;
export const SIMON_TARGET = 12;

export type SimonStatus = 'idle' | 'showing' | 'input' | 'won' | 'lost';

export interface SimonState {
  sequence: number[];
  inputIndex: number;
  status: SimonStatus;
  /** When true the UI must use the reduced-motion presentation. */
  calm: boolean;
}

export interface SimonPad {
  id: number;
  color: string;
  icon: string;
  label: string;
}

export const PADS: SimonPad[] = [
  { id: 0, color: '#38bdf8', icon: '◆', label: 'circle' },
  { id: 1, color: '#f472b6', icon: '▲', label: 'triangle' },
  { id: 2, color: '#fbbf24', icon: '●', label: 'square' },
  { id: 3, color: '#34d399', icon: '✦', label: 'star' },
];

export function padById(id: number): SimonPad {
  return PADS[id] ?? PADS[0]!;
}

export function nextSequenceLength(sequence: readonly number[]): number {
  return sequence.length + 1;
}

export function newGame(calm = false): SimonState {
  return { sequence: [], inputIndex: 0, status: 'idle', calm };
}

/** Add one random pad to the sequence. */
export function extendSequence(state: SimonState, random = Math.random): SimonState {
  const raw = Math.floor(random() * SIMON_PADS);
  const next = Math.max(0, Math.min(SIMON_PADS - 1, raw));
  return {
    ...state,
    sequence: [...state.sequence, next],
    inputIndex: 0,
    status: 'showing',
  };
}

export function beginInput(state: SimonState): SimonState {
  return { ...state, inputIndex: 0, status: 'input' };
}

/** Register a pad press. Returns the next state; status becomes won at target or lost on mismatch. */
export function pressPad(state: SimonState, pad: number): SimonState {
  if (state.status !== 'input') return state;
  if (pad < 0 || pad >= SIMON_PADS) return state;
  const expected = state.sequence[state.inputIndex];
  if (pad !== expected) return { ...state, status: 'lost', inputIndex: state.inputIndex + 1 };
  const inputIndex = state.inputIndex + 1;
  if (inputIndex >= state.sequence.length) {
    return {
      ...state,
      inputIndex,
      status: state.sequence.length >= SIMON_TARGET ? 'won' : 'idle',
    };
  }
  return { ...state, inputIndex, status: 'input' };
}

/** Human label for the currently expected pad, used by the live status line. */
export function expectedPadLabel(state: SimonState): string {
  const pad = state.sequence[state.inputIndex];
  return pad === undefined ? '' : padById(pad).label;
}
