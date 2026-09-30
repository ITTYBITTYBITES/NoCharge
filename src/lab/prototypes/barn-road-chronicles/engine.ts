/**
 * Barn Road Chronicles — Act 1 engine.
 *
 * Pure state machine and puzzle logic, independent of the DOM and Web Audio so
 * it can be verified under Vitest in a Node environment just like Pulse Runner.
 */

export const BRC_VIEWS = [
  'view-exterior',
  'view-outer-barn',
  'view-chamber',
  'view-restoration',
  'view-finale',
] as const;

export type BrcViewId = (typeof BRC_VIEWS)[number];

export interface BrcInventoryItem {
  id: string;
  name: string;
  icon: string;
}

export interface BrcUnlockedStates {
  padlockUnlocked: boolean;
  fuseInstalled: boolean;
  radioKnobInstalled: boolean;
  powerRestored: boolean;
  floorOpened: boolean;
  tarpRemoved: boolean;
  carRestored: boolean;
}

export interface BrcState {
  currentView: BrcViewId;
  inventory: BrcInventoryItem[];
  unlockedStates: BrcUnlockedStates;
  restorationProgress: number;
  playerName: string;
  arrivalSeen: boolean;
}

export const BRC_CONSTANTS = {
  STORAGE_KEY: 'brc_act1_state',
  LOCK_CODE: [1, 9, 5, 8] as const,
  TUNE_MIN: 0.62,
  TUNE_MAX: 0.74,
  CRANK_REQUIRED_TURNS: 3,
  TARP_KNOT_COUNT: 4,
  RESTORE_COMPLETE_THRESHOLD: 90,
} as const;

const NAME_BLOCK = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'cunt',
  'dick',
  'piss',
  'slut',
  'whore',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'rape',
  'porn',
  'cock',
  'pussy',
  'nazi',
  'fag',
];

export function createDefaultBrcState(): BrcState {
  return {
    currentView: 'view-exterior',
    inventory: [],
    unlockedStates: {
      padlockUnlocked: false,
      fuseInstalled: false,
      radioKnobInstalled: false,
      powerRestored: false,
      floorOpened: false,
      tarpRemoved: false,
      carRestored: false,
    },
    restorationProgress: 0,
    playerName: '',
    arrivalSeen: false,
  };
}

export function sanitizePlayerName(input: unknown): { name: string; fallback: boolean } {
  let stripped = String(input == null ? '' : input)
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length > 16) stripped = stripped.slice(0, 16).trim();
  const letters = stripped.replace(/[^a-zA-Z0-9]/g, '');
  const lower = stripped.toLowerCase();
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
  const blocked =
    tokens.some((t) => NAME_BLOCK.includes(t)) ||
    NAME_BLOCK.includes(lower.replace(/[^a-z0-9]/g, ''));
  const spam =
    !letters ||
    letters.length < 2 ||
    (stripped.length >= 3 && letters.length / stripped.length < 0.45);
  if (!stripped || blocked || spam || !/^[a-zA-Z0-9][a-zA-Z0-9 '\-]*$/.test(stripped)) {
    return { name: 'Mechanic', fallback: true };
  }
  return { name: stripped, fallback: false };
}

export interface BarnRoadEngine {
  update(step: number): void;
  state(): BrcState;
  elapsed(): number;
  restart(): void;
  switchView(viewId: BrcViewId): boolean;
  setPlayerName(raw: string, useDefault?: boolean): { name: string; fallback: boolean };
  markArrivalSeen(): void;
  hasItem(id: string): boolean;
  addItem(item: BrcInventoryItem): boolean;
  removeItem(id: string): void;
  tryUnlockPadlock(digits: readonly number[]): boolean;
  installFuse(): boolean;
  installRadioKnob(): boolean;
  tuneBreaker(freq: number): boolean;
  completeCrank(turns: number): boolean;
  releaseTarp(knotsUntied: number): boolean;
  setRestorationProgress(pct: number): boolean;
  loadSerialized(raw: unknown): void;
}

export function createBarnRoadEngine(initial?: Partial<BrcState>): BarnRoadEngine {
  let current: BrcState = createDefaultBrcState();
  let elapsedTime = 0;

  const hasItem = (id: string) => current.inventory.some((it) => it.id === id);

  const addItem = (item: BrcInventoryItem): boolean => {
    if (hasItem(item.id)) return false;
    current.inventory.push({ id: item.id, name: item.name, icon: item.icon });
    return true;
  };

  const removeItem = (id: string) => {
    current.inventory = current.inventory.filter((it) => it.id !== id);
  };

  const loadSerialized = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return;
    const parsed = raw as Record<string, unknown>;
    if (
      typeof parsed.currentView === 'string' &&
      (BRC_VIEWS as readonly string[]).includes(parsed.currentView)
    ) {
      current.currentView = parsed.currentView as BrcViewId;
    }
    if (Array.isArray(parsed.inventory)) {
      current.inventory = parsed.inventory
        .map((it: unknown) => {
          if (typeof it === 'string') return { id: it, name: it, icon: it };
          if (it && typeof it === 'object') {
            const obj = it as Record<string, unknown>;
            const id = typeof obj.id === 'string' ? obj.id : '';
            const name = typeof obj.name === 'string' && obj.name ? obj.name : id;
            const icon = typeof obj.icon === 'string' && obj.icon ? obj.icon : id;
            return { id, name, icon };
          }
          return { id: '', name: '', icon: '' };
        })
        .filter((it) => Boolean(it.id));
    }
    if (parsed.unlockedStates && typeof parsed.unlockedStates === 'object') {
      const u = parsed.unlockedStates as Record<string, unknown>;
      (Object.keys(current.unlockedStates) as (keyof BrcUnlockedStates)[]).forEach((k) => {
        if (typeof u[k] === 'boolean') {
          current.unlockedStates[k] = u[k] as boolean;
        }
      });
    }
    if (typeof parsed.restorationProgress === 'number' && Number.isFinite(parsed.restorationProgress)) {
      current.restorationProgress = Math.max(0, Math.min(100, parsed.restorationProgress));
    }
    if (typeof parsed.playerName === 'string' && parsed.playerName) {
      current.playerName = parsed.playerName;
    }
    if (parsed.arrivalSeen === true) {
      current.arrivalSeen = true;
    }
    if (current.unlockedStates.fuseInstalled) removeItem('glass-fuse');
    if (current.unlockedStates.radioKnobInstalled) removeItem('radio-knob');
  };

  if (initial) loadSerialized(initial);

  return {
    update(step: number) {
      if (step > 0) elapsedTime += step;
    },

    state() {
      return current;
    },

    elapsed() {
      return elapsedTime;
    },

    restart() {
      current = createDefaultBrcState();
      elapsedTime = 0;
    },

    switchView(viewId: BrcViewId) {
      if (!(BRC_VIEWS as readonly string[]).includes(viewId)) return false;
      current.currentView = viewId;
      return true;
    },

    setPlayerName(raw: string, useDefault = false) {
      const res = useDefault ? { name: 'Mechanic', fallback: false } : sanitizePlayerName(raw);
      current.playerName = res.name;
      return res;
    },

    markArrivalSeen() {
      current.arrivalSeen = true;
    },

    hasItem,
    addItem,
    removeItem,

    tryUnlockPadlock(digits: readonly number[]) {
      const ok =
        digits.length === 4 &&
        digits[0] === BRC_CONSTANTS.LOCK_CODE[0] &&
        digits[1] === BRC_CONSTANTS.LOCK_CODE[1] &&
        digits[2] === BRC_CONSTANTS.LOCK_CODE[2] &&
        digits[3] === BRC_CONSTANTS.LOCK_CODE[3];
      if (ok) {
        current.unlockedStates.padlockUnlocked = true;
      }
      return ok;
    },

    installFuse() {
      if (current.unlockedStates.fuseInstalled || !hasItem('glass-fuse')) return false;
      removeItem('glass-fuse');
      current.unlockedStates.fuseInstalled = true;
      return true;
    },

    installRadioKnob() {
      if (current.unlockedStates.radioKnobInstalled || !hasItem('radio-knob')) return false;
      removeItem('radio-knob');
      current.unlockedStates.radioKnobInstalled = true;
      return true;
    },

    tuneBreaker(freq: number) {
      if (!current.unlockedStates.fuseInstalled || !current.unlockedStates.radioKnobInstalled) {
        return false;
      }
      const clamped = Math.max(0, Math.min(1, freq));
      if (clamped >= BRC_CONSTANTS.TUNE_MIN && clamped <= BRC_CONSTANTS.TUNE_MAX) {
        current.unlockedStates.powerRestored = true;
        return true;
      }
      return false;
    },

    completeCrank(turns: number) {
      if (
        !current.unlockedStates.powerRestored ||
        !hasItem('crank-handle') ||
        turns < BRC_CONSTANTS.CRANK_REQUIRED_TURNS
      ) {
        return false;
      }
      current.unlockedStates.floorOpened = true;
      return true;
    },

    releaseTarp(knotsUntied: number) {
      if (knotsUntied < BRC_CONSTANTS.TARP_KNOT_COUNT) return false;
      current.unlockedStates.tarpRemoved = true;
      return true;
    },

    setRestorationProgress(pct: number) {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      current.restorationProgress = clamped;
      if (clamped >= BRC_CONSTANTS.RESTORE_COMPLETE_THRESHOLD) {
        current.restorationProgress = 100;
        current.unlockedStates.carRestored = true;
        return true;
      }
      return false;
    },

    loadSerialized,
  };
}
