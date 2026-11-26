import { useCallback, useEffect, useRef, useState } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';

const SYMBOLS = ['◆', '●', '▲', '■', '✦', '⬟', '♥', '✿'] as const;
type Tile = Readonly<{ id: string; symbol: (typeof SYMBOLS)[number] }>;

function shuffledDeck(): Tile[] {
  const deck = SYMBOLS.flatMap((symbol, index) => [
    { id: `${index}-a`, symbol },
    { id: `${index}-b`, symbol },
  ]);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swap]] = [deck[swap]!, deck[index]!];
  }
  return deck;
}

export default function PatternPairs() {
  const [deck, setDeck] = useState<Tile[]>(shuffledDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const locked = useRef(false);
  const pausedRef = useRef(false);
  const clockTimer = useRef<number | null>(null);
  const mismatchTimer = useRef<number | null>(null);
  const mismatchDeadline = useRef(0);
  const mismatchRemaining = useRef(650);
  const gameOverReported = useRef(false);
  const complete = matched.length === SYMBOLS.length;

  const clearMismatchTimer = useCallback(() => {
    if (mismatchTimer.current !== null) {
      window.clearTimeout(mismatchTimer.current);
      mismatchTimer.current = null;
    }
  }, []);

  const scheduleMismatch = useCallback((delay: number) => {
    clearMismatchTimer();
    mismatchRemaining.current = delay;
    mismatchDeadline.current = performance.now() + delay;
    mismatchTimer.current = window.setTimeout(() => {
      setFlipped([]);
      locked.current = false;
      mismatchTimer.current = null;
      mismatchRemaining.current = 650;
    }, delay);
  }, [clearMismatchTimer]);

  const resetRound = useCallback(() => {
    clearMismatchTimer();
    mismatchRemaining.current = 650;
    locked.current = false;
    gameOverReported.current = false;
    setDeck(shuffledDeck());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
    pausedRef.current = false;
    setPaused(false);
  }, [clearMismatchTimer]);

  const startClock = useCallback(() => setStarted(true), []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
    if (clockTimer.current !== null) {
      window.clearInterval(clockTimer.current);
      clockTimer.current = null;
    }
    if (mismatchTimer.current !== null) {
      mismatchRemaining.current = Math.max(0, mismatchDeadline.current - performance.now());
      clearMismatchTimer();
    }
  }, [clearMismatchTimer]);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    if (locked.current && mismatchTimer.current === null) scheduleMismatch(mismatchRemaining.current);
  }, [scheduleMismatch]);

  const destroy = useCallback(() => {
    clearMismatchTimer();
    if (clockTimer.current !== null) {
      window.clearInterval(clockTimer.current);
      clockTimer.current = null;
    }
    locked.current = false;
  }, [clearMismatchTimer]);

  const runtime = useArcadeGameRuntime({ init: resetRound, start: startClock, pause, resume, destroy });

  useEffect(() => {
    if (!started || complete || paused) return undefined;
    clockTimer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => {
      if (clockTimer.current !== null) {
        window.clearInterval(clockTimer.current);
        clockTimer.current = null;
      }
    };
  }, [started, complete, paused]);

  useEffect(() => {
    if (!complete || gameOverReported.current) return;
    gameOverReported.current = true;
    void runtime.onGameOver({ outcome: 'win', round: 1 });
  }, [complete, runtime]);

  const reveal = (index: number) => {
    const tile = deck[index];
    if (!tile || pausedRef.current || locked.current || flipped.includes(index) || matched.includes(tile.symbol)) return;
    if (!started) runtime.begin();
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length !== 2) return;

    setMoves((value) => value + 1);
    const [first, second] = next;
    if (deck[first]!.symbol === deck[second]!.symbol) {
      const nextMatched = [...matched, tile.symbol];
      setMatched(nextMatched);
      setFlipped([]);
      return;
    }

    locked.current = true;
    scheduleMismatch(650);
  };

  const formattedTime = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="interactive-module game-module pattern-pairs">
      <div className="module-scoreboard" aria-label="Game score">
        <div><span>Moves</span><output aria-label="Moves">{moves}</output></div>
        <div><span>Matched</span><output aria-label="Pairs matched">{matched.length} / {SYMBOLS.length}</output></div>
        <div><span>Time</span><output aria-label="Elapsed time">{formattedTime}</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">
        {paused ? 'Paused. The clock and mismatch reveal will resume where they stopped.' : complete ? `Board cleared in ${moves} moves and ${formattedTime}. Nice work.` : started ? `${matched.length} of ${SYMBOLS.length} pairs found.` : 'Choose any tile to begin the clock.'}
      </p>
      <div className="pair-grid" role="group" aria-label="Pattern Pairs tiles">
        {deck.map((tile, index) => {
          const isMatched = matched.includes(tile.symbol);
          const isRevealed = isMatched || flipped.includes(index);
          return (
            <button
              className={`pair-tile${isRevealed ? ' is-revealed' : ''}${isMatched ? ' is-matched' : ''}`}
              key={tile.id}
              type="button"
              aria-label={`Tile ${index + 1}, ${isRevealed ? tile.symbol : 'covered'}`}
              aria-pressed={isRevealed}
              disabled={paused || isMatched}
              onClick={() => reveal(index)}
            >
              <span aria-hidden="true">{isRevealed ? tile.symbol : '?'}</span>
            </button>
          );
        })}
      </div>
      <div className="module-actions">
        <button className="button button--primary" type="button" onClick={resetRound} disabled={paused}>New round</button>
        <p>Match all eight pairs. A mismatch stays visible briefly so you can remember the positions.</p>
      </div>
    </div>
  );
}
