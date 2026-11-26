import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';
import { useLocalArcadeAudio } from './useLocalArcadeAudio';

const SIDE = 4;
const INITIAL_SEED = 0x2048cafe;
export type Direction = 'up' | 'down' | 'left' | 'right';
type MoveResult = { board: number[]; gained: number; changed: boolean };
type BreakEvent = { outcome: 'loss'; round: number };

export function startingBoard(): number[] {
  const board = Array.from({ length: SIDE * SIDE }, () => 0);
  board[5] = 2;
  board[10] = 2;
  return board;
}

function collapseLine(line: number[]): { values: number[]; gained: number } {
  const tiles = line.filter((tile) => tile > 0);
  const merged: number[] = [];
  let gained = 0;
  for (let index = 0; index < tiles.length; index += 1) {
    if (tiles[index] === tiles[index + 1]) {
      const value = tiles[index]! * 2;
      merged.push(value);
      gained += value;
      index += 1;
    } else {
      merged.push(tiles[index]!);
    }
  }
  return { values: [...merged, ...Array.from({ length: SIDE - merged.length }, () => 0)], gained };
}

export function moveBoard(board: number[], direction: Direction): MoveResult {
  const next = [...board];
  let gained = 0;
  for (let line = 0; line < SIDE; line += 1) {
    let indexes = direction === 'left' || direction === 'right'
      ? Array.from({ length: SIDE }, (_, position) => line * SIDE + position)
      : Array.from({ length: SIDE }, (_, position) => position * SIDE + line);
    if (direction === 'right' || direction === 'down') indexes = [...indexes].reverse();
    const collapsed = collapseLine(indexes.map((index) => board[index]!));
    gained += collapsed.gained;
    indexes.forEach((index, position) => { next[index] = collapsed.values[position]!; });
  }
  return { board: next, gained, changed: next.some((tile, index) => tile !== board[index]) };
}

function nextRandom(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

export function addTile(board: number[], randomState: number): { board: number[]; randomState: number } {
  const empty = board.flatMap((value, index) => value === 0 ? [index] : []);
  if (empty.length === 0) return { board, randomState };
  let seed = nextRandom(randomState);
  const position = empty[seed % empty.length]!;
  seed = nextRandom(seed);
  const next = [...board];
  next[position] = seed % 10 === 0 ? 4 : 2;
  return { board: next, randomState: seed };
}

export function hasLegalMove(board: number[]): boolean {
  if (board.some((tile) => tile === 0)) return true;
  for (let row = 0; row < SIDE; row += 1) {
    for (let column = 0; column < SIDE; column += 1) {
      const index = row * SIDE + column;
      if (column < SIDE - 1 && board[index] === board[index + 1]) return true;
      if (row < SIDE - 1 && board[index] === board[index + SIDE]) return true;
    }
  }
  return false;
}

function directionForKey(key: string): Direction | null {
  const normalized = key.toLowerCase();
  if (normalized === 'arrowup' || normalized === 'w') return 'up';
  if (normalized === 'arrowdown' || normalized === 's') return 'down';
  if (normalized === 'arrowleft' || normalized === 'a') return 'left';
  if (normalized === 'arrowright' || normalized === 'd') return 'right';
  return null;
}

export default function TwentyFortyEight() {
  const [board, setBoard] = useState<number[]>(() => startingBoard());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [milestoneReached, setMilestoneReached] = useState(false);
  const [message, setMessage] = useState('Begin a run, then slide tiles with the arrow keys or controls.');
  const [pendingBreak, setPendingBreak] = useState<BreakEvent | null>(null);
  const randomState = useRef(INITIAL_SEED);
  const pausedRef = useRef(false);
  const reported = useRef(false);
  const audio = useLocalArcadeAudio();

  const reset = useCallback(() => {
    setBoard(startingBoard());
    setScore(0);
    setMoves(0);
    setStarted(false);
    setGameOver(false);
    setMilestoneReached(false);
    setMessage('Begin a run, then slide tiles with the arrow keys or controls.');
    setPendingBreak(null);
    randomState.current = INITIAL_SEED;
    pausedRef.current = false;
    reported.current = false;
    setPaused(false);
  }, []);
  const start = useCallback(() => {
    reset();
    setStarted(true);
    setMessage('Run started. Slide in any direction.');
  }, [reset]);
  const pause = useCallback(() => { pausedRef.current = true; setPaused(true); audio.pause(); }, [audio.pause]);
  const resume = useCallback(() => { pausedRef.current = false; setPaused(false); audio.resume(); }, [audio.resume]);
  const runtime = useArcadeGameRuntime({ init: reset, start, pause, resume, destroy: audio.destroy });

  useEffect(() => {
    if (!pendingBreak || reported.current) return;
    reported.current = true;
    const completed = pendingBreak;
    setPendingBreak(null);
    void runtime.onGameOver({ round: completed.round, outcome: completed.outcome });
  }, [pendingBreak, runtime]);

  const slide = useCallback((direction: Direction) => {
    if (!started || pausedRef.current || gameOver) return;
    const result = moveBoard(board, direction);
    if (!result.changed) {
      setMessage(`No tiles moved ${direction}. Try another direction.`);
      return;
    }
    const spawned = addTile(result.board, randomState.current);
    randomState.current = spawned.randomState;
    const nextMoves = moves + 1;
    const nextScore = score + result.gained;
    setBoard(spawned.board);
    setMoves(nextMoves);
    setScore(nextScore);
    audio.play(260 + Math.min(12, Math.log2(Math.max(2, result.gained || 2))) * 35);

    const crossedMilestone = !milestoneReached && spawned.board.some((tile) => tile >= 2048);
    if (crossedMilestone) setMilestoneReached(true);
    if (!hasLegalMove(spawned.board)) {
      setGameOver(true);
      setMessage(`No legal moves remain. Run over with ${nextScore} points.`);
      setPendingBreak({ outcome: 'loss', round: 1 });
    } else if (crossedMilestone) {
      setMessage('2048 reached. It is a milestone, not the end; keep playing or restart.');
    } else {
      setMessage(`Moved ${direction}. ${result.gained > 0 ? `You merged tiles for ${result.gained} points.` : 'No tiles merged.'}`);
    }
  }, [audio.play, board, gameOver, milestoneReached, moves, score, started]);

  const handleBoardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = directionForKey(event.key);
    if (!direction) return;
    event.preventDefault();
    slide(direction);
  };

  const movementButtons: ReadonlyArray<{ direction: Direction; label: string; glyph: string }> = [
    { direction: 'up', label: 'Slide up', glyph: '↑' },
    { direction: 'left', label: 'Slide left', glyph: '←' },
    { direction: 'down', label: 'Slide down', glyph: '↓' },
    { direction: 'right', label: 'Slide right', glyph: '→' },
  ];

  return (
    <div className="interactive-module game-module arcade-twenty-forty-eight" data-game-state={paused ? 'paused' : gameOver ? 'game-over' : started ? 'playing' : 'idle'}>
      <div className="module-scoreboard" aria-label="Twenty Forty-Eight score">
        <div><span>Score</span><output aria-label="Score">{score}</output></div>
        <div><span>Moves</span><output aria-label="Moves">{moves}</output></div>
        <div><span>Milestone</span><output>{milestoneReached ? '2048 reached' : '2048'}</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. The board and score are unchanged.' : message}</p>
      <div className="twenty-forty-eight-layout">
        <div className="twenty-forty-eight-board" role="grid" aria-label="Twenty Forty-Eight 4 by 4 board. Focus here and use arrow keys or W A S D." tabIndex={0} onKeyDown={handleBoardKeyDown}>
          {board.map((tile, index) => (
            <div className={`twenty-forty-eight-cell${tile ? ` tile-${Math.min(tile, 2048)}` : ' is-empty'}`} role="gridcell" aria-label={`Row ${Math.floor(index / SIDE) + 1}, column ${index % SIDE + 1}, ${tile || 'empty'}`} key={index}>
              {tile > 0 ? tile : ''}
            </div>
          ))}
        </div>
        <div className="twenty-forty-eight-pad" role="group" aria-label="Slide the board">
          {movementButtons.map((item) => (
            <button className={`twenty-forty-eight-direction is-${item.direction}`} type="button" key={item.direction} aria-label={item.label} disabled={!started || paused || gameOver} onClick={() => slide(item.direction)}>
              <span aria-hidden="true">{item.glyph}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="module-actions">
        <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused}>{gameOver ? 'New run' : started ? 'Restart run' : 'Begin run'}</button>
        <button className="button button--secondary" type="button" aria-pressed={audio.enabled} onClick={audio.toggle} disabled={paused}>Sound {audio.enabled ? 'on' : 'off'}</button>
        <p>Matching tiles merge once per slide. Reaching 2048 does not stop the run; no legal moves do.</p>
      </div>
    </div>
  );
}
