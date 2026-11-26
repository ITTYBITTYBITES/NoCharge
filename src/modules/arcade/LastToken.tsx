import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';
import { useLocalArcadeAudio } from './useLocalArcadeAudio';

const STARTING_PILES = [15, 21, 27] as const;
const TAKE_OPTIONS = [1, 2, 3] as const;
type PileSize = (typeof STARTING_PILES)[number];
type BreakEvent = { outcome: 'win'; round: number };

export default function LastToken() {
  const [pileSize, setPileSize] = useState<PileSize>(21);
  const [pile, setPile] = useState(21);
  const [player, setPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('Choose a pile size, then take turns removing tokens.');
  const [pendingBreak, setPendingBreak] = useState<BreakEvent | null>(null);
  const pausedRef = useRef(false);
  const reported = useRef(false);
  const takeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const audio = useLocalArcadeAudio();

  const reset = useCallback(() => {
    setPile(pileSize);
    setPlayer(1);
    setWinner(null);
    setStarted(false);
    setMessage('Choose a pile size, then take turns removing tokens.');
    setPendingBreak(null);
    reported.current = false;
    pausedRef.current = false;
    setPaused(false);
  }, [pileSize]);
  const start = useCallback(() => {
    reset();
    setStarted(true);
    setMessage("Player 1's Turn. Take one, two, or three tokens.");
  }, [pileSize, reset]);
  const pause = useCallback(() => { pausedRef.current = true; setPaused(true); audio.pause(); }, [audio.pause]);
  const resume = useCallback(() => { pausedRef.current = false; setPaused(false); audio.resume(); }, [audio.resume]);
  const runtime = useArcadeGameRuntime({ init: reset, start, pause, resume, destroy: audio.destroy });

  useEffect(() => {
    if (!pendingBreak || reported.current) return;
    reported.current = true;
    const completed = pendingBreak;
    setPendingBreak(null);
    void runtime.onGameOver(completed);
  }, [pendingBreak, runtime]);

  const choosePile = (nextSize: PileSize) => {
    if ((started && !winner) || pausedRef.current) return;
    setPileSize(nextSize);
    setPile(nextSize);
    setPlayer(1);
    setWinner(null);
    setStarted(false);
    setPendingBreak(null);
    reported.current = false;
    setMessage(`${nextSize} tokens selected. Start when both players are ready.`);
  };

  const take = (amount: number) => {
    if (!started || pausedRef.current || winner || amount > pile) return;
    const remaining = pile - amount;
    setPile(remaining);
    audio.play(280 + amount * 85);
    if (remaining === 0) {
      const winningPlayer: 1 | 2 = player === 1 ? 2 : 1;
      setWinner(winningPlayer);
      setMessage(`Player ${player} took the last token. Player ${winningPlayer} wins.`);
      setPendingBreak({ outcome: 'win', round: 1 });
      return;
    }
    const nextPlayer: 1 | 2 = player === 1 ? 2 : 1;
    setPlayer(nextPlayer);
    setMessage(`Player ${nextPlayer}'s Turn. Take one, two, or three tokens.`);
  };

  const moveTakeFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    for (let offset = 1; offset < TAKE_OPTIONS.length; offset += 1) {
      const next = (index + direction * offset + TAKE_OPTIONS.length) % TAKE_OPTIONS.length;
      const button = takeRefs.current[next];
      if (button && !button.disabled) { button.focus(); break; }
    }
  };


  return (
    <div className="interactive-module game-module arcade-pass-and-play arcade-last-token" data-game-state={paused ? 'paused' : winner ? 'game-over' : started ? 'playing' : 'idle'}>
      <div className="module-scoreboard" aria-label="Last Token state">
        <div><span>Tokens left</span><output aria-label="Tokens remaining">{pile}</output></div>
        <div><span>Turn</span><output aria-label="Current player">{started && !winner ? `Player ${player}` : '—'}</output></div>
        <div><span>Last token</span><output>Lose</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. The pile and current turn are unchanged.' : message}</p>
      <div className="last-token-pile-options" role="group" aria-label="Choose starting pile">
        <span>Starting pile:</span>
        {STARTING_PILES.map((amount) => (
          <button className="button button--secondary" key={amount} type="button" aria-pressed={pileSize === amount} disabled={(started && !winner) || paused} onClick={() => choosePile(amount)}>{amount} tokens</button>
        ))}
      </div>
      <ol className="last-token-pile" aria-label={`${pile} tokens remain`}>
        {Array.from({ length: pile }, (_, index) => <li key={index} aria-hidden="true">●</li>)}
      </ol>
      <div className="last-token-actions" role="group" aria-label="Take tokens">
        {TAKE_OPTIONS.map((amount, index) => (
          <button
            className="button button--primary"
            key={amount}
            ref={(element) => { takeRefs.current[index] = element; }}
            type="button"
            aria-label={`Take ${amount} token${amount === 1 ? '' : 's'}`}
            disabled={!started || paused || Boolean(winner) || amount > pile}
            onKeyDown={(event) => moveTakeFocus(event, index)}
            onClick={() => take(amount)}
          >Take {amount}</button>
        ))}
      </div>
      <div className="module-actions">
        <button className="button button--secondary" type="button" onClick={() => runtime.begin()} disabled={paused}>{winner ? 'Play again' : started ? 'Restart round' : 'Start round'}</button>
        <button className="button button--secondary" type="button" aria-pressed={audio.enabled} onClick={audio.toggle} disabled={paused}>Sound {audio.enabled ? 'on' : 'off'}</button>
        <p>There is no countdown. The current player chooses one to three; taking the final token loses.</p>
      </div>
    </div>
  );
}
