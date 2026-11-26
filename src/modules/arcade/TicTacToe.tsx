import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';

const MAX_ROUNDS = 5;
const WINS_TO_MATCH = 3;
type Mark = 'X' | 'O';
type Cell = Mark | null;
type BoardSize = 3 | 4;
type BreakEvent = { point: 'round-end' | 'game-over'; outcome: 'win' | 'loss' | 'draw'; round: number };

function emptyBoard(size: BoardSize): Cell[] {
  return Array.from({ length: size * size }, () => null);
}

function findBoardWinner(board: Cell[], size: BoardSize): Mark | null {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]] as const;
  const target = size;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const mark = board[row * size + column];
      if (!mark) continue;
      for (const [dr, dc] of directions) {
        let count = 1;
        for (let step = 1; step < target; step += 1) {
          const nextRow = row + dr * step;
          const nextColumn = column + dc * step;
          if (nextRow < 0 || nextRow >= size || nextColumn < 0 || nextColumn >= size
            || board[nextRow * size + nextColumn] !== mark) break;
          count += 1;
        }
        if (count >= target) return mark;
      }
    }
  }
  return null;
}

export default function TicTacToe() {
  const [size, setSize] = useState<BoardSize>(3);
  const [board, setBoard] = useState<Cell[]>(() => emptyBoard(3));
  const [player, setPlayer] = useState<1 | 2>(1);
  const [starter, setStarter] = useState<1 | 2>(1);
  const [round, setRound] = useState(1);
  const [wins, setWins] = useState<[number, number]>([0, 0]);
  const [draws, setDraws] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [matchOver, setMatchOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('Choose a board, then start a five-round pass-and-play match.');
  const [pendingBreak, setPendingBreak] = useState<BreakEvent | null>(null);
  const pausedRef = useRef(false);
  const reported = useRef(new Set<string>());
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const resetMatch = useCallback(() => {
    setBoard(emptyBoard(size));
    setPlayer(1);
    setStarter(1);
    setRound(1);
    setWins([0, 0]);
    setDraws(0);
    setStarted(false);
    setFinished(false);
    setMatchOver(false);
    setMessage('Choose a board, then start a five-round pass-and-play match.');
    setPendingBreak(null);
    reported.current.clear();
    pausedRef.current = false;
    setPaused(false);
  }, [size]);
  const start = useCallback(() => {
    resetMatch();
    setStarted(true);
    setMessage("Player 1's Turn. Place your X.");
  }, [resetMatch, size]);
  const pause = useCallback(() => { pausedRef.current = true; setPaused(true); }, []);
  const resume = useCallback(() => { pausedRef.current = false; setPaused(false); }, []);
  const runtime = useArcadeGameRuntime({ init: resetMatch, start, pause, resume, destroy: () => { reported.current.clear(); } });

  useEffect(() => {
    if (!pendingBreak) return;
    const key = `${pendingBreak.point}:${pendingBreak.outcome}:${pendingBreak.round}`;
    if (reported.current.has(key)) return;
    reported.current.add(key);
    const completed = pendingBreak;
    setPendingBreak(null);
    if (completed.point === 'round-end') {
      void runtime.onRoundEnd({ round: completed.round, outcome: completed.outcome });
    } else {
      void runtime.onGameOver({ round: completed.round, outcome: completed.outcome });
    }
  }, [pendingBreak, runtime]);

  const selectSize = (nextSize: BoardSize) => {
    if ((started && !matchOver) || pausedRef.current) return;
    setSize(nextSize);
    setBoard(emptyBoard(nextSize));
    setPlayer(1);
    setStarter(1);
    setRound(1);
    setWins([0, 0]);
    setDraws(0);
    setStarted(false);
    setFinished(false);
    setMatchOver(false);
    setPendingBreak(null);
    reported.current.clear();
    setMessage(`A ${nextSize} by ${nextSize} board is selected. Start when both players are ready.`);
  };

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const row = Math.floor(index / size);
    const column = index % size;
    let nextRow = row;
    let nextColumn = column;
    if (event.key === 'ArrowUp') nextRow -= 1;
    else if (event.key === 'ArrowDown') nextRow += 1;
    else if (event.key === 'ArrowLeft') nextColumn -= 1;
    else if (event.key === 'ArrowRight') nextColumn += 1;
    else return;
    event.preventDefault();
    while (nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size) {
      const targetIndex = nextRow * size + nextColumn;
      const target = cellRefs.current[targetIndex];
      if (target && !target.disabled) { target.focus(); return; }
      if (event.key === 'ArrowUp') nextRow -= 1;
      else if (event.key === 'ArrowDown') nextRow += 1;
      else if (event.key === 'ArrowLeft') nextColumn -= 1;
      else nextColumn += 1;
    }
  };

  const playCell = (index: number) => {
    if (!started || pausedRef.current || finished || board[index] !== null) return;
    const mark: Mark = player === 1 ? 'X' : 'O';
    const nextBoard = [...board];
    nextBoard[index] = mark;
    setBoard(nextBoard);
    const boardWinner = findBoardWinner(nextBoard, size);
    const isDraw = !boardWinner && nextBoard.every((cell) => cell !== null);
    if (boardWinner || isDraw) {
      setFinished(true);
        let nextWins: [number, number] = [wins[0], wins[1]];
      let nextDraws = draws;
      if (boardWinner) {
        nextWins = [wins[0], wins[1]];
        nextWins[boardWinner === 'X' ? 0 : 1] += 1;
        setWins(nextWins);
      } else {
        nextDraws += 1;
        setDraws(nextDraws);
      }
      const completedRound = round;
      const reachedThree = nextWins[0] >= WINS_TO_MATCH || nextWins[1] >= WINS_TO_MATCH;
      const lastBoard = completedRound >= MAX_ROUNDS;
      const terminal = reachedThree || lastBoard;
      const winnerIndex = nextWins[0] === nextWins[1] ? null : nextWins[0] > nextWins[1] ? 1 : 2;
      if (terminal) {
        setMatchOver(true);
        const outcome = winnerIndex === null ? 'draw' : 'win';
        const finalText = winnerIndex === null
          ? `Match drawn after ${completedRound} boards. Both players finished level.`
          : `Match complete. Player ${winnerIndex} wins ${nextWins[winnerIndex - 1]} to ${nextWins[winnerIndex === 1 ? 1 : 0]}, with ${nextDraws} ${nextDraws === 1 ? 'draw' : 'draws'}.`;
        setMessage(`${boardWinner ? `Player ${boardWinner === 'X' ? 1 : 2} wins this board. ` : 'This board is a draw. '}${finalText}`);
        setPendingBreak({ point: 'game-over', outcome, round: completedRound });
      } else {
        setMessage(boardWinner
          ? `Player ${boardWinner === 'X' ? 1 : 2} wins board ${completedRound}. The score is ${nextWins[0]} to ${nextWins[1]}.`
          : `Board ${completedRound} is a draw. The match continues.`);
        setPendingBreak({ point: 'round-end', outcome: boardWinner ? 'win' : 'draw', round: completedRound });
      }
      return;
    }
    const nextPlayer: 1 | 2 = player === 1 ? 2 : 1;
    setPlayer(nextPlayer);
    setMessage(`Player ${nextPlayer}'s Turn. Place your ${nextPlayer === 1 ? 'X' : 'O'}.`);
  };

  const nextBoard = () => {
    if (pausedRef.current || !finished || matchOver) return;
    const nextRound = round + 1;
    const nextStarter: 1 | 2 = starter === 1 ? 2 : 1;
    setRound(nextRound);
    setStarter(nextStarter);
    setPlayer(nextStarter);
    setBoard(emptyBoard(size));
    setFinished(false);
    setMessage(`Player ${nextStarter}'s Turn. Place your ${nextStarter === 1 ? 'X' : 'O'}.`);
  };


  return (
    <div className="interactive-module game-module arcade-pass-and-play arcade-tic-tac-toe" data-game-state={paused ? 'paused' : matchOver ? 'game-over' : finished ? 'round-end' : started ? 'playing' : 'idle'}>
      <div className="module-scoreboard" aria-label="Tic-Tac-Toe match score">
        <div><span>Player 1 · X</span><output aria-label="Player 1 wins">{wins[0]}</output></div>
        <div><span>Board</span><output aria-label="Current board">{started ? `${round} / ${MAX_ROUNDS}` : `${size} × ${size}`}</output></div>
        <div><span>Player 2 · O</span><output aria-label="Player 2 wins">{wins[1]}</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. The board and current turn are saved.' : message}</p>
      <div className="tic-tac-toe-options" role="group" aria-label="Board size">
        <span>Board size:</span>
        {[3, 4].map((boardSize) => (
          <button className="button button--secondary" key={boardSize} type="button" aria-pressed={size === boardSize} disabled={(started && !matchOver) || paused} onClick={() => selectSize(boardSize as BoardSize)}>
            {boardSize} × {boardSize} · connect {boardSize}
          </button>
        ))}
        <span className="tic-tac-toe-draws">Draws: <output aria-label="Draws">{draws}</output></span>
      </div>
      <div className={`tic-tac-toe-grid tic-tac-toe-grid--${size}`} role="group" aria-label={`${size} by ${size} Tic-Tac-Toe board`}>
        {board.map((cell, index) => (
          <button
            className={`tic-tac-toe-cell${cell ? ` is-${cell.toLocaleLowerCase()}` : ''}`}
            key={index}
            ref={(element) => { cellRefs.current[index] = element; }}
            type="button"
            aria-label={`Row ${Math.floor(index / size) + 1}, column ${index % size + 1}, ${cell ? `${cell}, Player ${cell === 'X' ? 1 : 2}` : 'empty'}`}
            disabled={!started || paused || finished || cell !== null}
            onKeyDown={(event) => moveFocus(event, index)}
            onClick={() => playCell(index)}
          >{cell ?? ''}</button>
        ))}
      </div>
      {finished && !matchOver && !paused && (
        <div className="tic-tac-toe-handoff" role="group" aria-label="Completed board controls">
          <strong>Board {round} is complete. Match score: {wins[0]}–{wins[1]}, draws {draws}.</strong>
          <button className="button button--primary" type="button" onClick={nextBoard}>Start board {round + 1}</button>
        </div>
      )}
      <div className="module-actions">
        <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused}>{matchOver ? 'New match' : started ? 'Restart match' : 'Start match'}</button>
        <p>First player to three board wins takes the match; otherwise it ends after five boards. Draws count toward that limit.</p>
      </div>
    </div>
  );
}
