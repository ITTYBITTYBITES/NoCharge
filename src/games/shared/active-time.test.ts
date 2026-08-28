import { describe, expect, it } from 'vitest';
import { ActiveTimeTracker } from './active-time';

describe('ActiveTimeTracker', () => {
  it('excludes every paused interval and resumes without resetting elapsed time', () => {
    let now = 100;
    const tracker = new ActiveTimeTracker(() => now);

    tracker.start();
    now = 1_100;
    expect(tracker.elapsedMs()).toBe(1_000);

    tracker.pause();
    now = 11_100;
    expect(tracker.elapsedMs()).toBe(1_000);

    tracker.start();
    now = 12_600;
    expect(tracker.elapsedMs()).toBe(2_500);
  });

  it('makes duplicate start and pause calls idempotent', () => {
    let now = 0;
    const tracker = new ActiveTimeTracker(() => now);
    tracker.start();
    now = 500;
    tracker.start();
    now = 1_000;
    tracker.pause();
    now = 2_000;
    tracker.pause();
    expect(tracker.elapsedMs()).toBe(1_000);
  });

  it('resets active and accumulated time', () => {
    let now = 0;
    const tracker = new ActiveTimeTracker(() => now);
    tracker.start();
    now = 900;
    tracker.reset();
    now = 2_000;
    expect(tracker.elapsedMs()).toBe(0);
    expect(tracker.isActive()).toBe(false);
  });
});
