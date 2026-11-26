import { useEffect, useRef, useState } from 'react';
import { twoSecondWitnessAssets } from '../../assets/twoSecondWitnessIdentityRegistry';

const DEFAULT_WINDOW_MS = 2_000;
const WINDOW_OPTIONS = [1_000, 2_000, 3_000] as const;
type Stage = 'ready' | 'observing' | 'question' | 'result';
type PropId = keyof typeof twoSecondWitnessAssets.props;
type SceneDefinition = {
  id: string;
  title: string;
  artwork: keyof typeof twoSecondWitnessAssets.scenes;
  props: readonly PropId[];
  questionType: 'position' | 'center' | 'neighbor' | 'frequency';
  prompt: string;
  choices: readonly string[];
  answer: string;
  explanation: string;
};

const PROP_LABELS: Record<PropId, string> = {
  umbrella: 'Umbrella',
  bus: 'Bus',
  mug: 'Mug',
  suitcase: 'Suitcase',
  ticket: 'Ticket',
  scarf: 'Scarf',
  book: 'Book',
  lamp: 'Lamp',
  plant: 'Plant',
  clock: 'Clock',
};

const SCENES: readonly SceneDefinition[] = [
  {
    id: 'street-corner',
    title: 'Street corner',
    artwork: 'streetCorner',
    props: ['umbrella', 'ticket', 'bus'],
    questionType: 'position',
    prompt: 'Which object was on the right?',
    choices: ['Umbrella', 'Bus', 'Ticket'],
    answer: 'Bus',
    explanation: 'The bus occupied the right-hand position.',
  },
  {
    id: 'diner-counter',
    title: 'Diner counter',
    artwork: 'dinerCounter',
    props: ['mug', 'suitcase', 'book'],
    questionType: 'center',
    prompt: 'Which object was in the center?',
    choices: ['Book', 'Suitcase', 'Mug'],
    answer: 'Suitcase',
    explanation: 'The suitcase was the center prop.',
  },
  {
    id: 'transit-platform',
    title: 'Transit platform',
    artwork: 'transitPlatform',
    props: ['ticket', 'bus', 'scarf'],
    questionType: 'neighbor',
    prompt: 'Which object was immediately to the right of the bus?',
    choices: ['Scarf', 'Ticket', 'Umbrella'],
    answer: 'Scarf',
    explanation: 'The scarf was immediately to the right of the bus.',
  },
  {
    id: 'study-desk',
    title: 'Study desk',
    artwork: 'studyDesk',
    props: ['plant', 'book', 'lamp', 'book'],
    questionType: 'frequency',
    prompt: 'Which object appeared twice?',
    choices: ['Clock', 'Book', 'Plant'],
    answer: 'Book',
    explanation: 'The book appeared in two positions.',
  },
];

function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1_000).toFixed(1)}s`;
}

function nextObservationWindow(baseWindowMs: number, escalating: boolean, streak: number): number {
  if (!escalating || streak < 2) return baseWindowMs;
  return Math.max(1_000, baseWindowMs - (streak - 1) * 200);
}

export default function TwoSecondWitnessPreview() {
  const [stage, setStage] = useState<Stage>('ready');
  const [remainingMs, setRemainingMs] = useState(DEFAULT_WINDOW_MS);
  const [activeWindowMs, setActiveWindowMs] = useState(DEFAULT_WINDOW_MS);
  const [baseWindowMs, setBaseWindowMs] = useState(DEFAULT_WINDOW_MS);
  const [escalating, setEscalating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [scene, setScene] = useState<SceneDefinition | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [status, setStatus] = useState('Choose a flash window, then start when you are ready.');
  const lastSceneId = useRef<string | null>(null);
  const deadline = useRef<number | null>(null);

  useEffect(() => {
    if (stage !== 'observing' || paused) return undefined;
    deadline.current = Date.now() + remainingMs;
    const timer = window.setInterval(() => {
      const next = Math.max(0, (deadline.current ?? Date.now()) - Date.now());
      setRemainingMs(next);
      if (next === 0) {
        window.clearInterval(timer);
        setPaused(false);
        setStage('question');
        setStatus(`Scene hidden. ${scene?.prompt ?? 'Answer the recall question.'}`);
      }
    }, 30);
    return () => window.clearInterval(timer);
  }, [stage, paused]);

  const beginRound = () => {
    const candidates = SCENES.filter((candidate) => candidate.id !== lastSceneId.current);
    const nextScene = candidates[Math.floor(Math.random() * candidates.length)] ?? SCENES[0];
    const nextWindow = nextObservationWindow(baseWindowMs, escalating, streak);
    lastSceneId.current = nextScene.id;
    deadline.current = null;
    setScene(nextScene);
    setActiveWindowMs(nextWindow);
    setRemainingMs(nextWindow);
    setAnswer(null);
    setWasCorrect(null);
    setPaused(false);
    setStage('observing');
    setStatus(`Look closely at the ${nextScene.title.toLowerCase()}. It will disappear when the flash ends.`);
  };

  const togglePause = () => {
    if (!paused && stage === 'observing') {
      setRemainingMs(Math.max(0, (deadline.current ?? Date.now()) - Date.now()));
    }
    setPaused((current) => !current);
    setStatus(paused ? 'Observation resumed.' : 'Observation paused. Resume when ready.');
  };

  const chooseAnswer = (choice: string) => {
    if (stage !== 'question' || !scene) return;
    const correct = choice === scene.answer;
    const nextStreak = correct ? streak + 1 : 0;
    setAnswer(choice);
    setWasCorrect(correct);
    setAttemptCount((count) => count + 1);
    if (correct) {
      setCorrectCount((count) => count + 1);
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setStatus(`Correct. ${scene.explanation}`);
    } else {
      setStreak(0);
      setStatus(`Not quite. ${scene.explanation}`);
    }
    setStage('result');
  };

  const reset = () => {
    deadline.current = null;
    lastSceneId.current = null;
    setStage('ready');
    setRemainingMs(DEFAULT_WINDOW_MS);
    setActiveWindowMs(DEFAULT_WINDOW_MS);
    setBaseWindowMs(DEFAULT_WINDOW_MS);
    setEscalating(false);
    setPaused(false);
    setCorrectCount(0);
    setAttemptCount(0);
    setStreak(0);
    setBestStreak(0);
    setScene(null);
    setAnswer(null);
    setWasCorrect(null);
    setStatus('Choose a flash window, then start when you are ready.');
  };

  const accuracy = attemptCount === 0 ? '—' : `${Math.round((correctCount / attemptCount) * 100)}%`;
  const sceneArtwork = scene ? twoSecondWitnessAssets.scenes[scene.artwork] : null;

  return (
    <div className="interactive-module product-demo witness-demo" data-demo="two-second-witness" data-witness-stage={stage} data-witness-window-ms={activeWindowMs}>
      <div className="product-demo__heading witness-demo__heading">
        <div>
          <p className="eyebrow">Local browser preview</p>
          <h2><span className="witness-demo__emblem" data-asset-id={twoSecondWitnessAssets.emblem.manifestAssetId} dangerouslySetInnerHTML={{ __html: twoSecondWitnessAssets.emblem.svgMarkup }} />Two-second recall lab</h2>
          <p>Catch a detail in a freshly drawn scene, then retrieve it after the flash.</p>
        </div>
        <span className="product-demo__badge">No camera or microphone</span>
      </div>

      <div className="module-scoreboard witness-demo__scoreboard" aria-label="Observation demo score">
        <div><span>Correct</span><output data-witness-score>{correctCount}</output></div>
        <div><span>Accuracy</span><output data-witness-accuracy>{accuracy}</output></div>
        <div><span>Streak</span><output data-witness-streak>{streak}</output></div>
        <div><span>Best streak</span><output data-witness-best-streak>{bestStreak}</output></div>
        <div><span>Flash window</span><output data-witness-window>{stage === 'observing' && !paused ? formatSeconds(remainingMs) : formatSeconds(activeWindowMs)}</output></div>
      </div>

      <fieldset className="witness-demo__settings" disabled={stage === 'observing' || stage === 'question'}>
        <legend>Round settings</legend>
        <label className="witness-demo__window-setting">
          Flash window
          <select aria-label="Flash window" value={baseWindowMs} onChange={(event) => setBaseWindowMs(Number(event.currentTarget.value))}>
            {WINDOW_OPTIONS.map((milliseconds) => <option key={milliseconds} value={milliseconds}>{formatSeconds(milliseconds)}</option>)}
          </select>
        </label>
        <label className="witness-demo__escalation-setting">
          <input type="checkbox" aria-label="Escalate after a correct streak" checked={escalating} onChange={(event) => setEscalating(event.currentTarget.checked)} />
          Tighten the flash after a correct streak
        </label>
        <p>Choose 1, 2, or 3 seconds. Escalation trims 0.2 seconds per answer once your streak reaches two, to a 1-second floor.</p>
      </fieldset>

      {stage === 'observing' && !paused && scene && sceneArtwork && (
        <figure className="witness-demo__scene-card" data-witness-scene={scene.id} data-witness-question-type={scene.questionType}>
          <div className="witness-demo__scene-art" data-asset-id={sceneArtwork.manifestAssetId} data-witness-scene-art dangerouslySetInnerHTML={{ __html: sceneArtwork.svgMarkup }} />
          <figcaption><strong>{scene.title}</strong><span>Look across the whole frame.</span></figcaption>
          <div className="witness-demo__props" role="list" aria-label="Objects in the scene">
            {scene.props.map((propId, index) => {
              const propArtwork = twoSecondWitnessAssets.props[propId];
              return (
                <div className="witness-demo__prop" role="listitem" key={`${propId}-${index}`} data-prop-id={propId} data-asset-id={propArtwork.manifestAssetId}>
                  <span className="witness-demo__prop-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: propArtwork.svgMarkup }} />
                  <span>{PROP_LABELS[propId]}</span>
                </div>
              );
            })}
          </div>
        </figure>
      )}
      {stage === 'observing' && paused && <p className="witness-demo__hidden" role="status">Observation paused. The scene is hidden until you resume.</p>}
      {stage === 'question' && scene && (
        <section className="witness-demo__question" aria-labelledby="witness-question" data-witness-scene={scene.id} data-witness-question-type={scene.questionType}>
          <p className="eyebrow">Recall prompt · {scene.questionType}</p>
          <h3 id="witness-question">{scene.prompt}</h3>
          <div className="witness-demo__choices">
            {scene.choices.map((choice) => <button className="button button--secondary witness-demo__choice" key={choice} type="button" onClick={() => chooseAnswer(choice)}>{choice}</button>)}
          </div>
        </section>
      )}
      {stage === 'result' && scene && answer && wasCorrect !== null && (
        <section className="witness-demo__result" data-witness-result={wasCorrect ? 'correct' : 'incorrect'} aria-live="polite">
          <p className="eyebrow">{wasCorrect ? 'Detail recovered' : 'Detail missed'}</p>
          <p>Your answer: <strong>{answer}</strong>. {scene.explanation}</p>
        </section>
      )}

      <div className="module-actions product-demo__actions witness-demo__actions">
        {stage === 'ready' || stage === 'result'
          ? <button className="button button--primary" type="button" onClick={beginRound}>{stage === 'ready' ? `Start ${formatSeconds(baseWindowMs)} look` : 'Next scene'}</button>
          : stage === 'observing'
            ? <button className="button button--primary" type="button" aria-pressed={paused} onClick={togglePause}>{paused ? 'Resume observation' : 'Pause observation'}</button>
            : <span className="witness-demo__waiting">The scene is hidden. Retrieve one detail.</span>}
        <button className="button button--secondary" type="button" onClick={reset}>Reset demo</button>
      </div>
      <p className="module-live-status" role="status" aria-live="polite" data-witness-status>{status}</p>
      <p className="module-note">This original sample rotates through four illustrated settings and four kinds of recall. Score, accuracy, and streaks stay in this page's memory; no camera, account, upload, or game-service request is used.</p>
    </div>
  );
}
