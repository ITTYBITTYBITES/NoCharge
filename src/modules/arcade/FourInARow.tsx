import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';

const ROWS = 6;
const COLUMNS = 7;
type Mark = 'X' | 'O';
type Cell = Mark | null;
type BreakEvent = { outcome: 'win' | 'draw'; round: number };

function emptyBoard(): Cell[] {
  return Array.from({ length: ROWS * COLUMNS }, () => null);
}

function hasFour(board: Cell[], row: number, column: number, mark: Mark): boolean {
  for (const [dr, dc] of [[1, 0], [0, 1], [1, 1], [1, -1]] as const) {
    let count = 1;
    for (const sign of [-1, 1]) {
      let r = row + dr * sign;
      let c = column + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLUMNS && board[r * COLUMNS + c] === mark) {
        count += 1;
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

export default function FourInARow() {
  const [board, setBoard] = useState<Cell[]>(() => emptyBoard());
  const [player, setPlayer] = useState<1 | 2>(1);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | 'draw' | null>(null);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('Start a round, then choose a column for each disc.');
  const [pendingBreak, setPendingBreak] = useState<BreakEvent | null>(null);
  const pausedRef = useRef(false);
  const reported = useRef(false);
  const columnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setPlayer(1);
    setMoves(0);
    setStarted(false);
    setWinner(null);
    setMessage('Start a round, then choose a column for each disc.');
    setPendingBreak(null);
    reported.current = false;
    pausedRef.current = false;
    setPaused(false);
  }, []);
  const start = useCallback(() => {
    reset();
    setStarted(true);
    setMessage("Player 1's Turn. Choose a column.");
  }, [reset]);
  const pause = useCallback(() => { pausedRef.current = true; setPaused(true); }, []);
  const resume = useCallback(() => { pausedRef.current = false; setPaused(false); }, []);
  const runtime = useArcadeGameRuntime({ init: reset, start, pause, resume, destroy: () => { reported.current = false; } });

  useEffect(() => {
    if (!pendingBreak || reported.current) return;
    reported.current = true;
    const completed = pendingBreak;
    setPendingBreak(null);
    void runtime.onGameOver({ round: completed.round, outcome: completed.outcome });
  }, [pendingBreak, runtime]);

  const drop = (column: number) => {
    if (!started || pausedRef.current || winner || column < 0 || column >= COLUMNS) return;
    let row = ROWS - 1;
    while (row >= 0 && board[row * COLUMNS + column] !== null) row -= 1;
    if (row < 0) return;

    const mark: Mark = player === 1 ? 'X' : 'O';
    const nextBoard = [...board];
    nextBoard[row * COLUMNS + column] = mark;
    const nextMoves = moves + 1;
    setBoard(nextBoard);
    setMoves(nextMoves);

    if (hasFour(nextBoard, row, column, mark)) {
      setWinner(player);
      setMessage(`Player ${player} connects four and wins the round.`);
      setPendingBreak({ outcome: 'win', round: 1 });
      return;
    }
    if (nextMoves === ROWS * COLUMNS) {
      setWinner('draw');
      setMessage('The board is full. The round is a draw.');
      setPendingBreak({ outcome: 'draw', round: 1 });
      return;
    }

    const nextPlayer: 1 | 2 = player === 1 ? 2 : 1;
    setPlayer(nextPlayer);
    setMessage(`Player ${nextPlayer}'s Turn. Choose a column.`);
  };

  const moveColumnFocus = (event: KeyboardEvent<HTMLButtonElement>, column: number) => {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    for (let offset = 1; offset < COLUMNS; offset += 1) {
      const next = (column + direction * offset + COLUMNS) % COLUMNS;
      const button = columnRefs.current[next];
      if (button && !button.disabled) { button.focus(); break; }
    }
  };


  return (
    <div className="interactive-module game-module arcade-pass-and-play arcade-four-in-a-row" data-game-state={paused ? 'paused' : winner ? 'game-over' : started ? 'playing' : 'idle'}>
      <div className="module-scoreboard" aria-label="Four in a Row state">
        <div><span>Moves</span><output aria-label="Moves">{moves}</output></div>
        <div><span>Turn</span><output aria-label="Current player">{started && !winner ? `Player ${player} · ${player === 1 ? 'X' : 'O'}` : '—'}</output></div>
        <div><span>Board</span><output>{COLUMNS} × {ROWS}</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. The board and player turn are unchanged.' : message}</p>
      <div className="four-in-a-row-controls" role="group" aria-label="Choose a column to drop a disc">
        {Array.from({ length: COLUMNS }, (_, column) => {
          const full = board[column] !== null;
          return (
            <button
              className="button button--secondary four-in-a-row-column"
              key={column}
              ref={(element) => { columnRefs.current[column] = element; }}
              type="button"
              aria-label={`Drop a disc in column ${column + 1}${full ? ', full' : ''}`}
              disabled={!started || paused || Boolean(winner) || full}
              onKeyDown={(event) => moveColumnFocus(event, column)}
              onClick={() => drop(column)}
            >{column + 1}</button>
          );
        })}
      </div>
      <div className="four-in-a-row-board" role="grid" aria-label={`${COLUMNS} columns by ${ROWS} rows` }>
        {Array.from({ length: ROWS }, (_, row) => (
          <div className="four-in-a-row-row" role="row" key={row}>
            {Array.from({ length: COLUMNS }, (_, column) => {
              const cell = board[row * COLUMNS + column];
              const full = board[column] !== null;
              return (
                <div className="four-in-a-row-gridcell" role="gridcell" aria-label={`Row ${row + 1}, column ${column + 1}, ${cell ? `Player ${cell === 'X' ? 1 : 2}` : 'empty'}`} key={column}>
                  <button className={`four-in-a-row-cell${cell ? ` is-${cell.toLowerCase()}` : ''}`} type="button" aria-label={`Drop a disc in column ${column + 1} from the board`} disabled={!started || paused || Boolean(winner) || full} onClick={() => drop(column)}>{cell ?? ''}</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="module-actions">
        <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused}>{winner ? 'Play again' : started ? 'Restart round' : 'Start round'}</button>
        <p>Choose one of seven columns. Discs settle at the bottom; connect four in any direction or fill the board for a draw.</p>
      </div>
    </div>
  );
}
