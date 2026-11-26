import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArcadePauseReason } from '../../content/schemas';
import { useArcadeGameRuntime } from './ArcadeRuntimeProvider';

type SimonPadId = 'ring' | 'wave' | 'peak' | 'bloom';
type SimonRunState = 'idle' | 'playing' | 'input' | 'round-end' | 'game-over';
type SimonPad = Readonly<{ id: SimonPadId; label: string; glyph: string; frequency: number }>;

const PADS: readonly SimonPad[] = [
  { id: 'ring', label: 'Ring', glyph: '◉', frequency: 329.63 },
  { id: 'wave', label: 'Wave', glyph: '≈', frequency: 392 },
  { id: 'peak', label: 'Peak', glyph: '⌃', frequency: 493.88 },
  { id: 'bloom', label: 'Bloom', glyph: '✿', frequency: 587.33 },
];
const TARGET_ROUNDS = 12;
const INITIAL_SEED = 0x4e4f4348;
const RUN_SEED_STEP = 0x9e3779b9;

/**
 * Clean-room, DOM-button Simon implementation. All timing is owned by one
 * pausable clock; no timer, audio resource, or sequence survives destroy/reset.
 */
export default function SimonSequence() {
  const [sequence, setSequence] = useState<SimonPadId[]>([]);
  const sequenceRef = useRef<SimonPadId[]>([]);
  const [runState, setRunState] = useState<SimonRunState>('idle');
  const runStateRef = useRef<SimonRunState>('idle');
  const [inputIndex, setInputIndex] = useState(0);
  const [activePad, setActivePad] = useState<SimonPadId | null>(null);
  const [round, setRound] = useState(0);
  const [bestRound, setBestRound] = useState(0);
  const [calmCues, setCalmCues] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [message, setMessage] = useState('Begin a run when you are ready. The first sequence has one cue.');
  const [pendingBreak, setPendingBreak] = useState<{
    point: 'round-end' | 'game-over';
    outcome: 'win' | 'loss';
    round: number;
  } | null>(null);

  const pauseReasons = useRef(new Set<ArcadePauseReason>());
  const timer = useRef<number | null>(null);
  const timerDeadline = useRef(0);
  const timerRemaining = useRef(0);
  const timerCallback = useRef<(() => void) | null>(null);
  const playbackGeneration = useRef(0);
  const randomState = useRef(INITIAL_SEED);
  const runNumber = useRef(0);
  const reportedRound = useRef(0);
  const dispatchedBreak = useRef<string | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const oscillator = useRef<OscillatorNode | null>(null);

  const changeRunState = useCallback((next: SimonRunState) => {
    runStateRef.current = next;
    setRunState(next);
  }, []);

  const disarmTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const armTimer = useCallback(() => {
    if (timer.current !== null || timerCallback.current === null || pauseReasons.current.size > 0) return;
    const delay = Math.max(0, timerRemaining.current);
    timerDeadline.current = performance.now() + delay;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      timerRemaining.current = 0;
      const callback = timerCallback.current;
      timerCallback.current = null;
      callback?.();
    }, delay);
  }, []);

  const schedule = useCallback((delay: number, callback: () => void) => {
    disarmTimer();
    timerRemaining.current = delay;
    timerCallback.current = callback;
    armTimer();
  }, [armTimer, disarmTimer]);

  const cancelScheduledWork = useCallback(() => {
    disarmTimer();
    timerRemaining.current = 0;
    timerCallback.current = null;
    playbackGeneration.current += 1;
  }, [disarmTimer]);

  const stopTone = useCallback(() => {
    const current = oscillator.current;
    oscillator.current = null;
    if (!current) return;
    try { current.stop(); } catch { /* An oscillator may already have ended. */ }
    try { current.disconnect(); } catch { /* Disconnected nodes are already silent. */ }
  }, []);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null;
    if (!audioContext.current) audioContext.current = new window.AudioContext();
    return audioContext.current;
  }, []);

  const playTone = useCallback((padId: SimonPadId, duration: number) => {
    if (!soundEnabledRef.current) return;
    const context = getAudioContext();
    const pad = PADS.find((item) => item.id === padId);
    if (!context || !pad) return;
    stopTone();
    void context.resume().catch(() => {});
    const tone = context.createOscillator();
    const volume = context.createGain();
    const now = context.currentTime;
    tone.type = 'sine';
    tone.frequency.setValueAtTime(pad.frequency, now);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.09, now + 0.018);
    volume.gain.setTargetAtTime(0.0001, now + Math.max(0.12, duration / 1000 - 0.07), 0.035);
    tone.connect(volume);
    volume.connect(context.destination);
    tone.onended = () => {
      if (oscillator.current === tone) oscillator.current = null;
      try { tone.disconnect(); } catch { /* Already disconnected. */ }
      try { volume.disconnect(); } catch { /* Already disconnected. */ }
    };
    oscillator.current = tone;
    tone.start(now);
    tone.stop(now + Math.max(0.16, duration / 1000));
  }, [getAudioContext, stopTone]);

  const resetRun = useCallback((preservePause = true) => {
    cancelScheduledWork();
    stopTone();
    randomState.current = (INITIAL_SEED + Math.imul(runNumber.current, RUN_SEED_STEP)) >>> 0;
    runNumber.current += 1;
    sequenceRef.current = [];
    setSequence([]);
    setInputIndex(0);
    setActivePad(null);
    setRound(0);
    reportedRound.current = 0;
    dispatchedBreak.current = null;
    changeRunState('idle');
    setMessage('Begin a run when you are ready. The first sequence has one cue.');
    setPendingBreak(null);
    if (!preservePause) {
      pauseReasons.current.clear();
      pausedRef.current = false;
      setPaused(false);
    }
  }, [cancelScheduledWork, changeRunState, stopTone]);

  const nextPad = useCallback((): SimonPadId => {
    randomState.current = (Math.imul(randomState.current, 1664525) + 1013904223) >>> 0;
    return PADS[randomState.current % PADS.length].id;
  }, []);

  const playSequence = useCallback((steps: readonly SimonPadId[]) => {
    cancelScheduledWork();
    const generation = playbackGeneration.current;
    const cueDuration = calmCues ? 430 : 270;
    const quietGap = calmCues ? 260 : 150;
    let index = 0;

    const showNextCue = () => {
      if (playbackGeneration.current !== generation) return;
      if (index >= steps.length) {
        setActivePad(null);
        setInputIndex(0);
        changeRunState('input');
        setMessage(`Your turn. Repeat all ${steps.length} ${steps.length === 1 ? 'cue' : 'cues'} in order.`);
        return;
      }
      const cue = steps[index];
      const cueLabel = PADS.find((pad) => pad.id === cue)?.label ?? 'Pad';
      setActivePad(cue);
      setMessage(`Round ${steps.length}. Cue ${index + 1}: ${cueLabel}.`);
      playTone(cue, cueDuration);
      schedule(cueDuration, () => {
        if (playbackGeneration.current !== generation) return;
        setActivePad(null);
        schedule(quietGap, () => {
          if (playbackGeneration.current !== generation) return;
          index += 1;
          showNextCue();
        });
      });
    };

    changeRunState('playing');
    setMessage(`Round ${steps.length}. Watch the pads; input begins after the final cue.`);
    showNextCue();
  }, [calmCues, cancelScheduledWork, changeRunState, playTone, schedule]);

  const start = useCallback(() => {
    if (pausedRef.current) return;
    if (runStateRef.current === 'round-end') {
      const nextSequence = [...sequenceRef.current, nextPad()];
      sequenceRef.current = nextSequence;
      setSequence(nextSequence);
      setRound(nextSequence.length);
      setInputIndex(0);
      playSequence(nextSequence);
      return;
    }
    if (runStateRef.current !== 'idle' && runStateRef.current !== 'game-over') return;

    resetRun();
    // resetRun preserves pause state; the explicit guard above guarantees this
    // start is not scheduled into a hidden tab or a pending ad-break callback.
    const firstCue = nextPad();
    sequenceRef.current = [firstCue];
    setSequence([firstCue]);
    setRound(1);
    setInputIndex(0);
    playSequence([firstCue]);
  }, [nextPad, playSequence, resetRun]);

  const pause = useCallback((reason: ArcadePauseReason) => {
    if (pauseReasons.current.has(reason)) return;
    const wasPaused = pauseReasons.current.size > 0;
    pauseReasons.current.add(reason);
    if (!wasPaused) {
      if (timer.current !== null) {
        timerRemaining.current = Math.max(0, timerDeadline.current - performance.now());
        disarmTimer();
      }
      pausedRef.current = true;
      setPaused(true);
      if (audioContext.current?.state === 'running') void audioContext.current.suspend().catch(() => {});
    }
  }, [disarmTimer]);

  const resume = useCallback(() => {
    if (pauseReasons.current.size === 0) return;
    pauseReasons.current.clear();
    pausedRef.current = false;
    setPaused(false);
    armTimer();
    if (soundEnabledRef.current && audioContext.current?.state === 'suspended') {
      void audioContext.current.resume().catch(() => {});
    }
  }, [armTimer]);

  const destroy = useCallback(() => {
    cancelScheduledWork();
    stopTone();
    if (audioContext.current) {
      const context = audioContext.current;
      audioContext.current = null;
      void context.close().catch(() => {});
    }
    pauseReasons.current.clear();
    pausedRef.current = false;
  }, [cancelScheduledWork, stopTone]);

  const runtime = useArcadeGameRuntime({
    init: () => resetRun(false),
    start,
    pause,
    resume,
    destroy,
  });

  useEffect(() => {
    if (!pendingBreak) return;
    const key = `${pendingBreak.point}:${pendingBreak.outcome}:${pendingBreak.round}`;
    if (dispatchedBreak.current === key) return;
    dispatchedBreak.current = key;
    setPendingBreak(null);
    if (pendingBreak.point === 'round-end') void runtime.onRoundEnd(pendingBreak);
    else void runtime.onGameOver(pendingBreak);
  }, [pendingBreak, runtime]);

  const selectPad = useCallback((padId: SimonPadId) => {
    if (pausedRef.current || runStateRef.current !== 'input') return;
    const steps = sequenceRef.current;
    if (steps[inputIndex] !== padId) {
      cancelScheduledWork();
      stopTone();
      setActivePad(null);
      setInputIndex(0);
      changeRunState('game-over');
      setMessage(`Run over on round ${steps.length}. The next cue did not match.`);
      setPendingBreak({ point: 'game-over', outcome: 'loss', round: steps.length });
      return;
    }

    const nextInputIndex = inputIndex + 1;
    if (nextInputIndex < steps.length) {
      setInputIndex(nextInputIndex);
      return;
    }

    setActivePad(null);
    setInputIndex(0);
    setBestRound((best) => Math.max(best, steps.length));
    if (steps.length >= TARGET_ROUNDS) {
      changeRunState('game-over');
      setMessage(`You completed all ${TARGET_ROUNDS} rounds. Pattern complete!`);
      setPendingBreak({ point: 'game-over', outcome: 'win', round: steps.length });
      return;
    }

    changeRunState('round-end');
    setMessage(`Round ${steps.length} complete. Take a breath, then choose Next sequence.`);
    if (reportedRound.current !== steps.length) {
      reportedRound.current = steps.length;
      setPendingBreak({ point: 'round-end', outcome: 'win', round: steps.length });
    }
  }, [cancelScheduledWork, changeRunState, inputIndex, stopTone]);

  const toggleSound = useCallback(() => {
    const next = !soundEnabledRef.current;
    soundEnabledRef.current = next;
    setSoundEnabled(next);
    if (!next) {
      stopTone();
      if (audioContext.current?.state === 'running') void audioContext.current.suspend().catch(() => {});
      return;
    }
    const context = getAudioContext();
    if (context && !pausedRef.current) void context.resume().catch(() => {});
  }, [getAudioContext, stopTone]);

  const canRespond = runState === 'input' && !paused;
  const activeStatus = paused
    ? 'Paused. Playback timing and optional audio will resume where they stopped.'
    : message;

  return (
    <div className="interactive-module game-module arcade-simon" data-game-state={runState} data-round={round}>
      <div className="module-scoreboard" aria-label="Simon score">
        <div><span>Sequence length</span><output aria-label="Sequence length">{round} / {TARGET_ROUNDS}</output></div>
        <div><span>Completed rounds</span><output aria-label="Completed rounds">{bestRound}</output></div>
        <div><span>Input progress</span><output aria-label="Input progress">{canRespond ? `${inputIndex} / ${sequence.length}` : '—'}</output></div>
      </div>

      <p className="module-live-status arcade-simon__status" role="status" aria-live="polite">{activeStatus}</p>

      <div className="arcade-simon__settings" aria-label="Game options">
        <label className="arcade-simon__calm">
          <input
            type="checkbox"
            checked={calmCues}
            onChange={(event) => setCalmCues(event.currentTarget.checked)}
            disabled={runState === 'playing' || paused}
          />
          <span>Calm cues</span>
        </label>
        <button
          className="button button--secondary arcade-simon__sound"
          type="button"
          aria-pressed={soundEnabled}
          onClick={toggleSound}
          disabled={paused}
        >
          Sound {soundEnabled ? 'on' : 'off'}
        </button>
        <p>Sound is optional and stays off until you enable it.</p>
      </div>

      <div className="arcade-simon__pads" role="group" aria-label="Four Simon pads">
        {PADS.map((pad) => (
          <button
            className="arcade-simon__pad"
            key={pad.id}
            type="button"
            aria-label={`Pad ${pad.label}`}
            aria-pressed={activePad === pad.id}
            disabled={!canRespond}
            data-pad={pad.id}
            data-active={activePad === pad.id ? 'true' : 'false'}
            onClick={() => selectPad(pad.id)}
          >
            <span className="arcade-simon__glyph" aria-hidden="true">{pad.glyph}</span>
            <span>{pad.label}</span>
          </button>
        ))}
      </div>

      <div className="module-actions arcade-simon__actions">
        {runState === 'round-end' ? (
          <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused}>Next sequence</button>
        ) : (
          <button className="button button--primary" type="button" onClick={() => runtime.begin()} disabled={paused}>
            {runState === 'idle' ? 'Begin run' : runState === 'game-over' ? 'Play again' : 'Restart run'}
          </button>
        )}
        <button className="button button--secondary" type="button" onClick={() => resetRun()} disabled={paused}>Reset run</button>
        <p>Four labelled pads; no countdown. Complete twelve rounds to finish.</p>
      </div>
    </div>
  );
}
