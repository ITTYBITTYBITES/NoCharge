import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';

type Feedback = 'correct' | 'present' | 'absent';
type Guess = { word: string; feedback: Feedback[] };
type Mode = 'daily' | 'practice';
type BreakEvent = { outcome: 'win' | 'loss'; round: number };

const ANSWERS = [
  'APPLE', 'BRAIN', 'CHARM', 'CLOUD', 'CRANE', 'DREAM', 'FLAME', 'GLASS',
  'GRAPE', 'HOUSE', 'LIGHT', 'MANGO', 'NIGHT', 'OCEAN', 'PIANO', 'PLANT',
  'QUILT', 'RIVER', 'SMILE', 'STONE', 'TIGER', 'WATER', 'WHEAT', 'WORLD',
  'ZEBRA', 'TOKEN', 'FROST', 'PATCH', 'CHESS', 'WATCH', 'BRAVE', 'CANDY',
] as const;
const EXTRA_GUESSES = ['PUPPY', 'EERIE', 'ALLEY', 'PLEAD', 'STARE', 'SLATE', 'TRAIN', 'ROAST', 'PRIDE', 'SHARE', 'SHEEP', 'SPEED', 'CRISP', 'TRACE', 'CLOSE', 'AUDIO', 'ADIEU', 'RAISE'];
const VALID_GUESSES = new Set<string>([...ANSWERS, ...EXTRA_GUESSES]);
const MAX_GUESSES = 6;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Exact-position letters consume their answer copies before misplaced letters are scored. */
export function scoreWordGuess(answer: string, guess: string): Feedback[] {
  const result: Feedback[] = Array.from({ length: answer.length }, () => 'absent');
  const remaining = new Map<string, number>();
  for (let index = 0; index < answer.length; index += 1) {
    if (guess[index] === answer[index]) result[index] = 'correct';
    else remaining.set(answer[index]!, (remaining.get(answer[index]!) ?? 0) + 1);
  }
  for (let index = 0; index < answer.length; index += 1) {
    if (result[index] === 'correct') continue;
    const count = remaining.get(guess[index]!) ?? 0;
    if (count > 0) {
      result[index] = 'present';
      remaining.set(guess[index]!, count - 1);
    }
  }
  return result;
}

function dailyAnswer(): string {
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let hash = 2166136261;
  for (const character of day) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return ANSWERS[hash % ANSWERS.length]!;
}

export default function WordLoom() {
  const [mode, setMode] = useState<Mode>('daily');
  const [answer, setAnswer] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('Choose a mode and start a round.');
  const [pendingBreak, setPendingBreak] = useState<BreakEvent | null>(null);
  const practiceIndex = useRef(-1);
  const pausedRef = useRef(false);
  const reported = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    setAnswer('');
    setGuessInput('');
    setGuesses([]);
    setStarted(false);
    setFinished(false);
    setMessage('Choose a mode and start a round.');
    setPendingBreak(null);
    reported.current = false;
    pausedRef.current = false;
    setPaused(false);
  }, []);
  const start = useCallback(() => {
    reset();
    if (mode === 'daily') {
      setAnswer(dailyAnswer());
      setMessage('Daily puzzle started. Find the word in six accepted guesses.');
    } else {
      practiceIndex.current = (practiceIndex.current + 1) % ANSWERS.length;
      setAnswer(ANSWERS[practiceIndex.current]!);
      setMessage('Practice round started. Find the word in six accepted guesses.');
    }
    setStarted(true);
  }, [mode, reset]);
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

  const submitGuess = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!started || finished || pausedRef.current) return;
    const candidate = guessInput.trim().toUpperCase();
    if (!/^[A-Z]{5}$/u.test(candidate)) {
      setMessage('Enter exactly five letters before submitting.');
      inputRef.current?.focus();
      return;
    }
    if (!VALID_GUESSES.has(candidate)) {
      setMessage('That word is outside this small local word list. It does not use a guess.');
      inputRef.current?.focus();
      return;
    }
    const feedback = scoreWordGuess(answer, candidate);
    const nextGuesses = [...guesses, { word: candidate, feedback }];
    setGuesses(nextGuesses);
    setGuessInput('');
    if (candidate === answer) {
      setFinished(true);
      setMessage(`Solved in ${nextGuesses.length} ${nextGuesses.length === 1 ? 'guess' : 'guesses'}. The word was ${answer}.`);
      setPendingBreak({ outcome: 'win', round: 1 });
    } else if (nextGuesses.length >= MAX_GUESSES) {
      setFinished(true);
      setMessage(`No guesses remain. The word was ${answer}.`);
      setPendingBreak({ outcome: 'loss', round: 1 });
    } else {
      setMessage(`Guess ${nextGuesses.length} recorded. ${MAX_GUESSES - nextGuesses.length} ${MAX_GUESSES - nextGuesses.length === 1 ? 'guess remains' : 'guesses remain'}.`);
    }
  };

  const setLetter = (letter: string) => {
    if (!started || finished || paused || guessInput.length >= 5) return;
    setGuessInput((current) => `${current}${letter}`.slice(0, 5));
    inputRef.current?.focus();
  };
  const backspace = () => {
    if (!started || finished || paused) return;
    setGuessInput((current) => current.slice(0, -1));
    inputRef.current?.focus();
  };
  const controlsDisabled = !started || finished || paused;

  return (
    <div className="interactive-module game-module arcade-word-loom" data-game-state={paused ? 'paused' : finished ? 'game-over' : started ? 'playing' : 'idle'}>
      <div className="module-scoreboard" aria-label="Word Loom state">
        <div><span>Accepted guesses</span><output aria-label="Accepted guesses">{guesses.length} / {MAX_GUESSES}</output></div>
        <div><span>Mode</span><output>{mode === 'daily' ? 'Daily' : 'Practice'}</output></div>
        <div><span>Word length</span><output>5 letters</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. Your accepted guesses are saved.' : message}</p>
      <div className="word-loom-modes" role="group" aria-label="Word Loom mode">
        <button className="button button--secondary" type="button" aria-pressed={mode === 'daily'} disabled={started && !finished || paused} onClick={() => setMode('daily')}>Daily</button>
        <button className="button button--secondary" type="button" aria-pressed={mode === 'practice'} disabled={started && !finished || paused} onClick={() => setMode('practice')}>Practice</button>
      </div>
      <ol className="word-loom-board" aria-label="Guess history">
        {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
          const guess = guesses[rowIndex];
          return (
            <li className="word-loom-row" key={rowIndex} aria-label={guess ? `Guess ${rowIndex + 1}: ${guess.word}. ${guess.feedback.map((state, index) => `${guess.word[index]} ${state}`).join(', ')}.` : `Guess ${rowIndex + 1}: empty`}>
              {Array.from({ length: 5 }, (_, letterIndex) => {
                const letter = guess?.word[letterIndex] ?? '';
                const state = guess?.feedback[letterIndex];
                return <span className={`word-loom-tile${state ? ` is-${state}` : ''}`} key={letterIndex} aria-hidden="true">{letter}{state && <small>{state === 'correct' ? '✓' : state === 'present' ? '↔' : '×'}</small>}</span>;
              })}
            </li>
          );
        })}
      </ol>
      <form className="word-loom-form" onSubmit={(event) => submitGuess(event)}>
        <label className="module-field" htmlFor="word-loom-input">Your five-letter guess
          <input
            ref={inputRef}
            id="word-loom-input"
            type="text"
            name="guess"
            value={guessInput}
            maxLength={5}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            disabled={controlsDisabled}
            onChange={(event) => setGuessInput(event.currentTarget.value.toUpperCase().replace(/[^A-Z]/gu, '').slice(0, 5))}
          />
        </label>
        <button className="button button--primary" type="submit" disabled={controlsDisabled}>Submit guess</button>
      </form>
      <div className="word-loom-keyboard" role="group" aria-label="On-screen letter keyboard">
        {LETTERS.map((letter) => <button type="button" key={letter} disabled={controlsDisabled} onClick={() => setLetter(letter)}>{letter}</button>)}
        <button type="button" className="word-loom-key-wide" disabled={controlsDisabled || guessInput.length === 0} onClick={backspace}>Backspace</button>
        <button type="button" className="word-loom-key-wide" disabled={controlsDisabled} onClick={() => submitGuess()}>Enter guess</button>
      </div>
      <p className="word-loom-legend"><span>✓</span> correct position <span>↔</span> in the word elsewhere <span>×</span> not available in the answer</p>
      <div className="module-actions">
        <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused}>{finished ? mode === 'daily' ? 'Replay daily puzzle' : 'Next practice word' : started ? 'Round in progress' : 'Start round'}</button>
        <p>Daily words use a local calendar seed; practice rounds cycle a local list. No word service or account is contacted.</p>
      </div>
    </div>
  );
}
