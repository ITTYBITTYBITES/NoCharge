import { describe, expect, test } from 'vitest';

import { PULSE_RUNNER_CONSTANTS, createPulseRunnerEngine } from './engine';

const STEP = 1 / 60;

function run(engine: ReturnType<typeof createPulseRunnerEngine>, seconds: number) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) engine.update(STEP);
}

describe('Pulse Runner engine', () => {
  test('a fresh engine is playable and unscored', () => {
    const engine = createPulseRunnerEngine();
    const state = engine.state();
    expect(state.over).toBe(false);
    expect(state.score).toBe(0);
    expect(state.playerX).toBeCloseTo(0.5, 5);
  });

  test('score accumulates with survived time', () => {
    const engine = createPulseRunnerEngine();
    run(engine, 2);
    const state = engine.state();
    // Elapsed time is an accumulation of 1/60 steps, so it lands on
    // 1.9999999999999998 rather than exactly 2. Assert the relationship rather
    // than a boundary value the test would only pass by luck.
    expect(state.elapsed).toBeCloseTo(2, 5);
    expect(state.score).toBe(Math.floor(state.elapsed * 10));
    expect(state.score).toBeGreaterThanOrEqual(19);
    expect(state.score).toBeLessThanOrEqual(20);
  });

  test('hazards spawn over time and fall downward', () => {
    const engine = createPulseRunnerEngine(7);
    run(engine, 3);
    const { hazards } = engine.state();
    expect(hazards.length).toBeGreaterThan(0);
    expect(hazards.every((hazard) => hazard.vy > 0)).toBe(true);
  });

  test('the player stays inside the stage', () => {
    const engine = createPulseRunnerEngine();
    engine.setDirection(-1);
    run(engine, 5);
    expect(engine.state().playerX).toBeGreaterThanOrEqual(PULSE_RUNNER_CONSTANTS.PLAYER_RADIUS);

    engine.setDirection(1);
    run(engine, 5);
    expect(engine.state().playerX).toBeLessThanOrEqual(1 - PULSE_RUNNER_CONSTANTS.PLAYER_RADIUS);
  });

  test('a stationary player eventually dies', () => {
    const engine = createPulseRunnerEngine(3);
    run(engine, 60);
    expect(engine.state().over).toBe(true);
  });

  test('a finished game stops accumulating score', () => {
    const engine = createPulseRunnerEngine(3);
    run(engine, 60);
    const scoreAtDeath = engine.state().score;
    run(engine, 5);
    expect(engine.state().score).toBe(scoreAtDeath);
  });

  test('a continue is offered on game over and revives the run', () => {
    const engine = createPulseRunnerEngine(3);
    run(engine, 60);
    expect(engine.canContinue()).toBe(true);

    engine.grantContinue();
    const state = engine.state();
    expect(state.over).toBe(false);
    expect(state.continues).toBe(1);
    // The field is cleared so the reward is not a trap.
    expect(state.hazards).toHaveLength(0);
  });

  test('a continue is refused when the game is still running', () => {
    const engine = createPulseRunnerEngine(3);
    run(engine, 0.5);
    expect(engine.canContinue()).toBe(false);
    engine.grantContinue();
    expect(engine.state().continues).toBe(0);
  });

  test('continues are capped', () => {
    const engine = createPulseRunnerEngine(3);
    for (let i = 0; i < PULSE_RUNNER_CONSTANTS.MAX_CONTINUES; i += 1) {
      run(engine, 60);
      expect(engine.canContinue()).toBe(true);
      engine.grantContinue();
    }
    run(engine, 60);
    expect(engine.canContinue()).toBe(false);
    engine.grantContinue();
    expect(engine.state().over).toBe(true);
    expect(engine.state().continues).toBe(PULSE_RUNNER_CONSTANTS.MAX_CONTINUES);
  });

  test('restart clears everything', () => {
    const engine = createPulseRunnerEngine(3);
    run(engine, 60);
    engine.grantContinue();
    engine.restart();
    const state = engine.state();
    expect(state.over).toBe(false);
    expect(state.elapsed).toBe(0);
    expect(state.continues).toBe(0);
    expect(state.hazards).toHaveLength(0);
  });

  test('the same seed replays identically', () => {
    const a = createPulseRunnerEngine(42);
    const b = createPulseRunnerEngine(42);
    run(a, 4);
    run(b, 4);
    expect(a.state().hazards).toEqual(b.state().hazards);
  });
});
