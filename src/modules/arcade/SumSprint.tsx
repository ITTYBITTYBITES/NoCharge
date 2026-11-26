import { useCallback, useEffect, useRef, useState } from 'react';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';

type Question = Readonly<{ prompt: string; answer: number; choices: number[] }>;

function createQuestion(): Question {
  const first = 4 + Math.floor(Math.random() * 17);
  const subtract = Math.random() > 0.55;
  const second = 1 + Math.floor(Math.random() * 12);
  const left = subtract ? Math.max(first, second) : first;
  const right = subtract ? Math.min(first, second) : second;
  const answer = subtract ? left - right : left + right;
  const candidates = new Set<number>([answer]);
  while (candidates.size < 4) {
    const offset = 1 + Math.floor(Math.random() * 9);
    candidates.add(Math.max(0, answer + (Math.random() > 0.5 ? offset : -offset)));
  }
  const choices = [...candidates];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [choices[index], choices[swap]] = [choices[swap]!, choices[index]!];
  }
  return { prompt: `${left} ${subtract ? '−' : '+'} ${right}`, answer, choices };
}

export default function SumSprint() {
  const [question, setQuestion] = useState<Question>(createQuestion);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState('Press Start to begin your one-minute round.');
  const [gameOverPending, setGameOverPending] = useState(false);
  const pausedRef = useRef(false);
  const clockTimer = useRef<number | null>(null);

  const resetRound = useCallback(() => {
    setRunning(false);
    setSeconds(60);
    setScore(0);
    setStreak(0);
    setQuestion(createQuestion());
    setMessage('Press Start to begin your one-minute round.');
    setGameOverPending(false);
    pausedRef.current = false;
    setPaused(false);
  }, []);

  const startRound = useCallback(() => {
    if (pausedRef.current) return;
    setScore(0);
    setStreak(0);
    setSeconds(60);
    setQuestion(createQuestion());
    setMessage('Round in progress. Choose an answer.');
    setGameOverPending(false);
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
    if (clockTimer.current !== null) {
      window.clearInterval(clockTimer.current);
      clockTimer.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
  }, []);

  const destroy = useCallback(() => {
    if (clockTimer.current !== null) {
      window.clearInterval(clockTimer.current);
      clockTimer.current = null;
    }
  }, []);

  const runtime = useArcadeGameRuntime({ init: resetRound, start: startRound, pause, resume, destroy });

  useEffect(() => {
    if (!running || paused) return undefined;
    clockTimer.current = window.setInterval(() => {
      setSeconds((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => {
      if (clockTimer.current !== null) {
        window.clearInterval(clockTimer.current);
        clockTimer.current = null;
      }
    };
  }, [running, paused]);

  useEffect(() => {
    if (!running || seconds !== 0) return;
    setRunning(false);
    setMessage('Time is up. Start another round whenever you are ready.');
    setGameOverPending(true);
  }, [running, seconds]);

  useEffect(() => {
    if (!gameOverPending) return;
    setGameOverPending(false);
    void runtime.onGameOver({ outcome: 'draw', round: 1 });
  }, [gameOverPending, runtime]);

  const answerQuestion = (answer: number) => {
    if (!running || pausedRef.current) return;
    if (answer === question.answer) {
      setScore((value) => value + 1);
      setStreak((value) => value + 1);
      setMessage('Correct. Next sum!');
    } else {
      setStreak(0);
      setMessage(`Not quite. ${question.prompt} equals ${question.answer}. Try the next one.`);
    }
    setQuestion(createQuestion());
  };

  return (
    <div className="interactive-module game-module sum-sprint" data-game-state={paused ? 'paused' : running ? 'playing' : seconds === 0 ? 'game-over' : 'idle'}>
      <div className="module-scoreboard" aria-label="Sum Sprint score">
        <div><span>Score</span><output aria-label="Score">{score}</output></div>
        <div><span>Streak</span><output aria-label="Current streak">{streak}</output></div>
        <div><span>Time</span><output aria-label="Time remaining">{seconds}s</output></div>
      </div>
      <div className="sum-sprint__question" aria-live="polite">
        <span className="eyebrow">Solve this sum</span>
        <strong>{question.prompt}</strong>
      </div>
      <div className="sum-sprint__choices" role="group" aria-label="Answer choices">
        {question.choices.map((choice) => (
          <button
            className="answer-choice"
            key={choice}
            type="button"
            disabled={!running || paused}
            data-correct={choice === question.answer ? 'true' : 'false'}
            onClick={() => answerQuestion(choice)}
          >{choice}</button>
        ))}
      </div>
      <p className="module-live-status" role="status" aria-live="polite">{paused ? 'Paused. The one-minute clock will resume from the displayed time.' : message}</p>
      <div className="module-actions">
        <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused}>
          {running ? 'Restart 60-second round' : seconds === 0 ? 'Play again' : 'Start 60-second round'}
        </button>
        <p>Four choices, no penalty for a wrong answer, and a new question after every try.</p>
      </div>
    </div>
  );
}
