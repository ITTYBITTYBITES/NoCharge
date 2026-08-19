import { loadPref, savePref, saveScore } from '../shared/storage';
import { PUZZLES } from './puzzles';

export const PROGRESS_KEY = 'beacon-lattice-progress';
export const GAME_ID = 'beacon-lattice';

export type LatticeProgress = {
  currentId: string;
  completed: string[];
  bests: Record<string, number>;
  lastSolved: Record<string, number>;
};

export function defaultProgress(): LatticeProgress {
  return {
    currentId: PUZZLES[0]!.id,
    completed: [],
    bests: {},
    lastSolved: {},
  };
}

export function loadProgress(): LatticeProgress {
  const stored = loadPref<Partial<LatticeProgress>>(PROGRESS_KEY, {});
  const base = defaultProgress();
  return {
    currentId: typeof stored.currentId === 'string' ? stored.currentId : base.currentId,
    completed: Array.isArray(stored.completed) ? stored.completed.filter((id) => typeof id === 'string') : [],
    bests: stored.bests && typeof stored.bests === 'object' ? stored.bests : {},
    lastSolved: stored.lastSolved && typeof stored.lastSolved === 'object' ? stored.lastSolved : {},
  };
}

export function saveProgress(progress: LatticeProgress): void {
  savePref(PROGRESS_KEY, progress);
  saveScore(GAME_ID, progress.completed.length);
}

export function recordSolve(progress: LatticeProgress, puzzleId: string, beaconCount: number): LatticeProgress {
  const completed = progress.completed.includes(puzzleId) ? progress.completed : [...progress.completed, puzzleId];
  const previous = progress.bests[puzzleId];
  const bests = {
    ...progress.bests,
    [puzzleId]: previous == null ? beaconCount : Math.min(previous, beaconCount),
  };
  const next = {
    ...progress,
    completed,
    bests,
    lastSolved: { ...progress.lastSolved, [puzzleId]: beaconCount },
  };
  saveProgress(next);
  return next;
}

export function setCurrentPuzzle(progress: LatticeProgress, puzzleId: string): LatticeProgress {
  const next = { ...progress, currentId: puzzleId };
  saveProgress(next);
  return next;
}

export const PRIVACY_GAME_KEYS = [`nocharge:${GAME_ID}:high`, `nocharge:pref:${PROGRESS_KEY}`] as const;
