import { useCallback, useEffect, useRef, useState } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';
import { useLocalArcadeAudio } from './useLocalArcadeAudio';

const WORDS = ['ORCHARD', 'PUZZLE', 'RAINBOW', 'COMPASS', 'JOURNEY', 'LANTERN', 'WHISPER', 'PLANETS'];
const MAX_MISSES = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
type BreakEvent = { outcome: 'win' | 'loss'; round: number };

export default function Hangman() {
  const [round, setRound] = useState(1);
  const [word, setWord] = useState(WORDS[0]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('Start a round and guess one letter at a time.');
  const [pendingBreak, setPendingBreak] = useState<BreakEvent | null>(null);
  const pausedRef = useRef(false);
  const reported = useRef(false);
  const audio = useLocalArcadeAudio();
  const missed = guessed.filter((letter) => !word.includes(letter)).length;
  const won = word.split('').every((letter) => guessed.includes(letter));
  const lost = missed >= MAX_MISSES && !won;
  const finished = won || lost;

  const reset = useCallback(() => {
    setWord(WORDS[(round - 1) % WORDS.length]!);
    setGuessed([]);
    setStarted(false);
    setMessage('Start a round and guess one letter at a time.');
    setPendingBreak(null);
    reported.current = false;
    pausedRef.current = false;
    setPaused(false);
  }, [round]);
  const start = useCallback(() => {
    reset();
    setStarted(true);
    setMessage('Round started. Choose a letter.');
  }, [reset]);
  const pause = useCallback(() => { pausedRef.current = true; setPaused(true); audio.pause(); }, [audio.pause]);
  const resume = useCallback(() => { pausedRef.current = false; setPaused(false); audio.resume(); }, [audio.resume]);
  const runtime = useArcadeGameRuntime({ init: reset, start, pause, resume, destroy: audio.destroy });

  useEffect(() => {
    if (!started || !finished || reported.current) return;
    reported.current = true;
    const outcome = won ? 'win' : 'loss';
    setMessage(won ? `Correct. The word was ${word}.` : `Round over. The word was ${word}.`);
    setPendingBreak({ outcome, round });
  }, [finished, round, started, won, word]);
  useEffect(() => {
    if (!pendingBreak) return;
    const completed = pendingBreak;
    setPendingBreak(null);
    void runtime.onGameOver({ round: completed.round, outcome: completed.outcome });
  }, [pendingBreak, runtime]);

  const guess = useCallback((letter: string) => {
    if (!started || pausedRef.current || finished || guessed.includes(letter)) return;
    setGuessed((current) => [...current, letter]);
    audio.play(300 + (letter.charCodeAt(0) - 65) * 12);
    setMessage(word.includes(letter) ? `${letter} is in the word.` : `${letter} is not in the word.`);
  }, [audio.play, finished, guessed, started, word]);

  useEffect(() => {
    const handlePhysicalKey = (event: KeyboardEvent) => {
      if (!started || paused || finished) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const letter = event.key.toUpperCase();
      if (!/^[A-Z]$/u.test(letter)) return;
      event.preventDefault();
      guess(letter);
    };
    window.addEventListener('keydown', handlePhysicalKey);
    return () => window.removeEventListener('keydown', handlePhysicalKey);
  }, [guess]);

  const newWord = () => {
    const nextRound = round + 1;
    setRound(nextRound);
    setWord(WORDS[(nextRound - 1) % WORDS.length]!);
    setGuessed([]);
    setStarted(false);
    setMessage('New word ready. Start when you are ready.');
    setPendingBreak(null);
    reported.current = false;
  };
  const chooseLetter = (letter: string) => guess(letter);

  return (
    <div className="interactive-module game-module arcade-hangman" data-game-state={paused ? 'paused' : finished ? 'game-over' : started ? 'playing' : 'idle'}>
      <div className="module-scoreboard" aria-label="Hangman state">
        <div><span>Mistakes</span><output aria-label="Incorrect guesses">{missed} / {MAX_MISSES}</output></div>
        <div><span>Letters</span><output aria-label="Letters guessed">{guessed.length}</output></div>
        <div><span>Length</span><output>{word.length}</output></div>
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. Your guesses are saved.' : message}</p>
      <p className="hangman-word" aria-label={`Word: ${word.split('').map((letter) => guessed.includes(letter) || finished ? letter : 'blank').join(' ')}`}>
        {word.split('').map((letter, index) => <span key={`${letter}-${index}`} aria-hidden="true">{guessed.includes(letter) || finished ? letter : '_'}</span>)}
      </p>
      <p className="hangman-missed">Missed: {guessed.filter((letter) => !word.includes(letter)).join(', ') || 'none'}</p>
      <div className="hangman-keyboard" role="group" aria-label="Choose a letter">
        {ALPHABET.map((letter) => (
          <button type="button" key={letter} disabled={!started || paused || finished || guessed.includes(letter)} aria-label={`Guess ${letter}${guessed.includes(letter) ? ', already guessed' : ''}`} onClick={() => chooseLetter(letter)}>{letter}</button>
        ))}
      </div>
      <div className="module-actions">
        <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused || (started && !finished)}>{finished ? 'Replay word' : started ? 'Round in progress' : 'Start round'}</button>
        <button className="button button--secondary" type="button" onClick={newWord} disabled={paused}>New word</button>
        <button className="button button--secondary" type="button" aria-pressed={audio.enabled} onClick={audio.toggle} disabled={paused}>Sound {audio.enabled ? 'on' : 'off'}</button>
        <p>Use the page keyboard or the letter buttons. Repeated guesses do not count as extra mistakes.</p>
      </div>
    </div>
  );
}
