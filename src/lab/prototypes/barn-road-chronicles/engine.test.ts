import { describe, expect, test } from 'vitest';

import {
  BRC_CONSTANTS,
  createBarnRoadEngine,
  sanitizePlayerName,
} from './engine';

describe('Barn Road Chronicles engine', () => {
  test('a fresh engine starts at Barn Gate with empty inventory', () => {
    const engine = createBarnRoadEngine();
    const state = engine.state();
    expect(state.currentView).toBe('view-exterior');
    expect(state.inventory).toHaveLength(0);
    expect(state.restorationProgress).toBe(0);
    expect(state.unlockedStates.padlockUnlocked).toBe(false);
  });

  test('player call sign is sanitized and falls back to Mechanic when invalid', () => {
    expect(sanitizePlayerName('Maya').name).toBe('Maya');
    expect(sanitizePlayerName('<b>Silas</b>').name).toBe('Silas');
    expect(sanitizePlayerName('').name).toBe('Mechanic');
    expect(sanitizePlayerName('!!!').fallback).toBe(true);
    expect(sanitizePlayerName('fuck').name).toBe('Mechanic');
  });

  test('padlock unlocks only on 1-9-5-8', () => {
    const engine = createBarnRoadEngine();
    expect(engine.tryUnlockPadlock([0, 0, 0, 0])).toBe(false);
    expect(engine.state().unlockedStates.padlockUnlocked).toBe(false);

    expect(engine.tryUnlockPadlock(BRC_CONSTANTS.LOCK_CODE)).toBe(true);
    expect(engine.state().unlockedStates.padlockUnlocked).toBe(true);
  });

  test('breaker requires fuse and radio knob before tuning into the green band', () => {
    const engine = createBarnRoadEngine();
    expect(engine.tuneBreaker(0.68)).toBe(false);

    engine.addItem({ id: 'glass-fuse', name: '30A Fuse', icon: 'glass-fuse' });
    engine.addItem({ id: 'radio-knob', name: 'Radio Knob', icon: 'radio-knob' });
    expect(engine.installFuse()).toBe(true);
    expect(engine.hasItem('glass-fuse')).toBe(false);
    expect(engine.installRadioKnob()).toBe(true);
    expect(engine.hasItem('radio-knob')).toBe(false);

    expect(engine.tuneBreaker(0.2)).toBe(false);
    expect(engine.tuneBreaker(0.68)).toBe(true);
    expect(engine.state().unlockedStates.powerRestored).toBe(true);
  });

  test('tractor flywheel requires power, crank handle, and three clockwise turns', () => {
    const engine = createBarnRoadEngine();
    engine.addItem({ id: 'glass-fuse', name: '30A Fuse', icon: 'glass-fuse' });
    engine.addItem({ id: 'radio-knob', name: 'Radio Knob', icon: 'radio-knob' });
    engine.installFuse();
    engine.installRadioKnob();
    engine.tuneBreaker(0.68);

    expect(engine.completeCrank(3)).toBe(false);
    engine.addItem({ id: 'crank-handle', name: 'Crank Handle', icon: 'crank-handle' });
    expect(engine.completeCrank(2)).toBe(false);
    expect(engine.completeCrank(3)).toBe(true);
    expect(engine.state().unlockedStates.floorOpened).toBe(true);
  });

  test('tarp releases when all four knots are untied and restoration completes at 90%+', () => {
    const engine = createBarnRoadEngine();
    expect(engine.releaseTarp(3)).toBe(false);
    expect(engine.releaseTarp(4)).toBe(true);
    expect(engine.state().unlockedStates.tarpRemoved).toBe(true);

    expect(engine.setRestorationProgress(55)).toBe(false);
    expect(engine.state().restorationProgress).toBe(55);
    expect(engine.setRestorationProgress(92)).toBe(true);
    expect(engine.state().restorationProgress).toBe(100);
    expect(engine.state().unlockedStates.carRestored).toBe(true);
  });

  test('restart clears progress and returns to Barn Gate', () => {
    const engine = createBarnRoadEngine();
    engine.switchView('view-chamber');
    engine.tryUnlockPadlock([1, 9, 5, 8]);
    engine.setRestorationProgress(95);
    engine.restart();

    const state = engine.state();
    expect(state.currentView).toBe('view-exterior');
    expect(state.restorationProgress).toBe(0);
    expect(state.unlockedStates.padlockUnlocked).toBe(false);
    expect(state.unlockedStates.carRestored).toBe(false);
  });
});
