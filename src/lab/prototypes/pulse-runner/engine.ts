/**
 * Pulse Runner — engine.
 *
 * Pure simulation, no DOM and no `requestAnimationFrame`. The render layer
 * (`main.ts`) owns the loop; this file only advances state, which is what makes
 * it testable in Node under `vitest` with `environment: 'node'`.
 *
 * Coordinates are normalised: x and y are 0–1 fractions of the stage, so the
 * same difficulty curve holds on a 375px phone and a 2560px monitor. The
 * renderer multiplies out.
 */

export interface Hazard {
  x: number;
  y: number;
  vy: number;
  radius: number;
}

export interface PulseRunnerState {
  playerX: number;
  playerRadius: number;
  hazards: Hazard[];
  /** Survived time in seconds. */
  elapsed: number;
  /** Whole-point score: one point per tenth of a second survived. */
  score: number;
  over: boolean;
  continues: number;
}

export interface PulseRunnerEngine {
  update(step: number): void;
  /** -1 left, 0 hold, 1 right. */
  setDirection(direction: -1 | 0 | 1): void;
  state(): PulseRunnerState;
  restart(): void;
  /** Grant a rewarded continue: clears the field and resumes. */
  grantContinue(): void;
  /** True when a continue is currently meaningful to offer. */
  canContinue(): boolean;
}

const PLAYER_Y = 0.88;
const PLAYER_RADIUS = 0.028;
const PLAYER_SPEED = 0.85;
const HAZARD_RADIUS = 0.035;
const BASE_SPAWN_INTERVAL = 0.72;
const MIN_SPAWN_INTERVAL = 0.2;
const BASE_FALL_SPEED = 0.42;
const MAX_FALL_SPEED = 1.05;
const DIFFICULTY_RAMP_SECONDS = 75;
const MAX_CONTINUES = 3;

/** Deterministic RNG so tests and replays agree. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function difficulty(t: number): number {
  return Math.min(1, t / DIFFICULTY_RAMP_SECONDS);
}

export function createPulseRunnerEngine(seed = 1): PulseRunnerEngine {
  const random = mulberry32(seed);

  let playerX = 0.5;
  let direction: -1 | 0 | 1 = 0;
  let hazards: Hazard[] = [];
  let elapsed = 0;
  let over = false;
  let continues = 0;
  let spawnTimer = 0;

  const spawn = () => {
    const ramp = difficulty(elapsed);
    const speed = BASE_FALL_SPEED + (MAX_FALL_SPEED - BASE_FALL_SPEED) * ramp;
    hazards.push({
      x: 0.06 + random() * 0.88,
      y: -0.06,
      vy: speed * (0.85 + random() * 0.3),
      radius: HAZARD_RADIUS,
    });
  };

  return {
    update(step: number) {
      if (over) return;
      elapsed += step;

      playerX = Math.min(1 - PLAYER_RADIUS, Math.max(PLAYER_RADIUS, playerX + direction * PLAYER_SPEED * step));

      const ramp = difficulty(elapsed);
      const interval = BASE_SPAWN_INTERVAL + (MIN_SPAWN_INTERVAL - BASE_SPAWN_INTERVAL) * ramp;
      spawnTimer += step;
      while (spawnTimer >= interval) {
        spawnTimer -= interval;
        spawn();
      }

      for (const hazard of hazards) hazard.y += hazard.vy * step;
      hazards = hazards.filter((hazard) => hazard.y < 1.15);

      // Circle overlap in normalised space.
      for (const hazard of hazards) {
        const dx = hazard.x - playerX;
        const dy = hazard.y - PLAYER_Y;
        const reach = hazard.radius + PLAYER_RADIUS;
        if (dx * dx + dy * dy <= reach * reach) {
          over = true;
          return;
        }
      }
    },

    setDirection(next) {
      direction = next;
    },

    state() {
      return {
        playerX,
        playerRadius: PLAYER_RADIUS,
        hazards,
        elapsed,
        score: Math.floor(elapsed * 10),
        over,
        continues,
      };
    },

    restart() {
      playerX = 0.5;
      direction = 0;
      hazards = [];
      elapsed = 0;
      over = false;
      continues = 0;
      spawnTimer = 0;
    },

    canContinue() {
      return over && continues < MAX_CONTINUES;
    },

    grantContinue() {
      if (!over || continues >= MAX_CONTINUES) return;
      continues += 1;
      over = false;
      // Clear the field rather than dropping the player back into a wall of
      // hazards, which would make the reward feel like a punishment.
      hazards = [];
      spawnTimer = 0;
    },
  };
}

export const PULSE_RUNNER_CONSTANTS = {
  PLAYER_Y,
  PLAYER_RADIUS,
  HAZARD_RADIUS,
  MAX_CONTINUES,
} as const;
