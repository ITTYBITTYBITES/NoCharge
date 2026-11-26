import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';
import { useLocalArcadeAudio } from './useLocalArcadeAudio';

const SIZE = 5;
type BreakEvent = { outcome: 'win'; round: number };

function toggleAt(board: boolean[], row: number, column: number): boolean[] {
  const next = [...board];
  for (const [dr, dc] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const r = row + dr;
    const c = column + dc;
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
      const index = r * SIZE + c;
      next[index] = !next[index];
    }
  }
  return next;
}

/** A seeded scramble of reversible moves guarantees that every board is solvable. */
function makePuzzle(seed: number): boolean[] {
  let state = seed >>> 0;
  let board = Array.from({ length: SIZE * SIZE }, () => false);
  for (let move = 0; move < 13; move += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    board = toggleAt(board, (state >>> 8) % SIZE, state % SIZE);
  }
  return board;
}

export default function LightsOut() {
  const [board, setBoard] = useState<boolean[]>(() => makePuzzle(1));
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('Begin the puzzle, then switch every light off.');
  const [pendingBreak, setPendingBreak] = useState<BreakEvent | null>(null);
  const pausedRef = useRef(false);
  const puzzleNumber = useRef(0);
  const reported = useRef(false);
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const audio = useLocalArcadeAudio();
  const solved = board.every((light) => !light);

  const resetState = useCallback((seed: number) => {
    setBoard(makePuzzle(seed));
    setMoves(0);
    setStarted(false);
    setMessage('Begin the puzzle, then switch every light off.');
    setPendingBreak(null);
    reported.current = false;
    pausedRef.current = false;
    setPaused(false);
  }, []);
  const init = useCallback(() => {
    puzzleNumber.current = 1;
    resetState(1);
  }, [resetState]);
  const newPuzzle = useCallback(() => {
    puzzleNumber.current += 1;
    resetState(puzzleNumber.current);
  }, [resetState]);
  const start = useCallback(() => setStarted(true), []);
  const pause = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
    audio.pause();
  }, [audio.pause]);
  const resume = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
    audio.resume();
  }, [audio.resume]);
  const runtime = useArcadeGameRuntime({ init, start, pause, resume, destroy: audio.destroy });

  useEffect(() => {
    if (!pendingBreak || reported.current) return;
    reported.current = true;
    const completed = pendingBreak;
    setPendingBreak(null);
    void runtime.onGameOver(completed);
  }, [pendingBreak, runtime]);

  const pressCell = (index: number) => {
    if (pausedRef.current || solved) return;
    if (!started) runtime.begin();
    const next = toggleAt(board, Math.floor(index / SIZE), index % SIZE);
    setBoard(next);
    setMoves((count) => count + 1);
    audio.play(330 + (index % SIZE) * 55);
    if (next.every((light) => !light)) {
      setMessage('All lights are off. Puzzle solved.');
      setPendingBreak({ outcome: 'win', round: 1 });
    } else {
      setMessage('Board updated. Keep switching neighboring lights.');
    }
  };

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const row = Math.floor(index / SIZE);
    const column = index % SIZE;
    const next = event.key === 'ArrowUp' && row > 0 ? index - SIZE
      : event.key === 'ArrowDown' && row < SIZE - 1 ? index + SIZE
        : event.key === 'ArrowLeft' && column > 0 ? index - 1
          : event.key === 'ArrowRight' && column < SIZE - 1 ? index + 1 : -1;
    if (next >= 0) {
      event.preventDefault();
      cellRefs.current[next]?.focus();
    }
  };

  return (
    <div className="interactive-module game-module arcade-lights-out" data-game-state={paused ? 'paused' : solved ? 'game-over' : started ? 'playing' : 'idle'}>
      <div className="module-scoreboard" aria-label="Lights Out score">
        <div><span>Moves</span><output aria-label="Moves">{moves}</output></div>
        <div><span>Board</span><output aria-label="Board size">5 × 5</output></div>
        <div><span>Goal</span><output>All off</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. The board is unchanged.' : message}</p>
      <div className="lights-out-grid" role="group" aria-label="Lights Out 5 by 5 board">
        {board.map((light, index) => (
          <button
            className={`lights-out-cell${light ? ' is-on' : ''}`}
            key={index}
            ref={(element) => { cellRefs.current[index] = element; }}
            type="button"
            aria-label={`Row ${Math.floor(index / SIZE) + 1}, column ${index % SIZE + 1}, ${light ? 'on' : 'off'}`}
            aria-pressed={light}
            disabled={paused || solved}
            onKeyDown={(event) => moveFocus(event, index)}
            onClick={() => pressCell(index)}
          ><span aria-hidden="true">{light ? 'On' : 'Off'}</span></button>
        ))}
      </div>
      <div className="module-actions">
        <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused || started || solved}>Begin puzzle</button>
        <button className="button button--secondary" type="button" onClick={newPuzzle} disabled={paused}>New puzzle</button>
        <button className="button button--secondary" type="button" aria-pressed={audio.enabled} onClick={audio.toggle} disabled={paused}>Sound {audio.enabled ? 'on' : 'off'}</button>
        <p>The board is built from reversible cross-shaped moves, so every generated layout has a solution.</p>
      </div>
    </div>
  );
}
