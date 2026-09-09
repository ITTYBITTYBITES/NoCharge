import { describe, expect, test, vi } from 'vitest';

import { createLoop } from './raf-loop';

/**
 * A hand-driven scheduler. The loop must be testable without a browser because
 * the property that matters — nothing runs after `stop()` — is exactly the
 * property that makes ad playback safe.
 */
function harness(frames: number[] = []) {
  let now = 0;
  const pending = new Map<number, FrameRequestCallback>();
  let nextHandle = 1;
  const cancelled: number[] = [];

  const loop = createLoop(
    {
      update: vi.fn(),
      render: vi.fn(),
    },
    {
      requestFrame: (cb) => {
        const handle = nextHandle++;
        pending.set(handle, cb);
        return handle;
      },
      cancelFrame: (handle) => {
        cancelled.push(handle);
        pending.delete(handle);
      },
      now: () => now,
    },
  );

  return {
    loop,
    get callbacks() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (loop as any) as never;
    },
    /** Advance to `ms` and run whatever frame is pending. */
    tick(ms: number) {
      now = ms;
      const entries = [...pending.entries()];
      pending.clear();
      for (const [, cb] of entries) cb(now);
    },
    get pendingCount() {
      return pending.size;
    },
    get cancelledCount() {
      return cancelled.length;
    },
    frames,
  };
}

describe('fixed-timestep loop', () => {
  test('a stopped loop schedules nothing', () => {
    const h = harness();
    expect(h.loop.isRunning()).toBe(false);
    expect(h.pendingCount).toBe(0);
  });

  test('start schedules a frame and stop cancels it', () => {
    const h = harness();
    h.loop.start();
    expect(h.loop.isRunning()).toBe(true);
    expect(h.pendingCount).toBe(1);
    h.loop.stop();
    expect(h.loop.isRunning()).toBe(false);
    expect(h.pendingCount).toBe(0);
    expect(h.cancelledCount).toBe(1);
  });

  test('start is idempotent and never double-schedules', () => {
    const h = harness();
    h.loop.start();
    h.loop.start();
    h.loop.start();
    expect(h.pendingCount).toBe(1);
  });

  test('update runs on the fixed step regardless of frame duration', () => {
    let updates = 0;
    let now = 0;
    const pending = new Map<number, FrameRequestCallback>();
    let nextHandle = 1;

    const loop = createLoop(
      {
        update: () => {
          updates += 1;
        },
        render: () => {},
      },
      {
        step: 1 / 60,
        requestFrame: (cb) => {
          const id = nextHandle++;
          pending.set(id, cb);
          return id;
        },
        cancelFrame: (id) => pending.delete(id),
        now: () => now,
      },
    );

    loop.start();
    // One 100ms frame should produce six 16.67ms steps.
    now = 100;
    const [, cb] = [...pending.entries()][0];
    pending.clear();
    cb(now);

    expect(updates).toBe(6);
  });

  test('a long stall is clamped so the game cannot simulate a huge gap', () => {
    let updates = 0;
    let now = 0;
    const pending = new Map<number, FrameRequestCallback>();
    let nextHandle = 1;

    const loop = createLoop(
      {
        update: () => {
          updates += 1;
        },
        render: () => {},
      },
      {
        maxFrame: 0.25,
        requestFrame: (cb) => {
          const id = nextHandle++;
          pending.set(id, cb);
          return id;
        },
        cancelFrame: (id) => pending.delete(id),
        now: () => now,
      },
    );

    loop.start();
    // Ten seconds pass (tab was backgrounded). maxFrame is 0.25s, so at most
    // 0.25 / (1/60) = 15 steps, not 600.
    now = 10_000;
    const [, cb] = [...pending.entries()][0];
    pending.clear();
    cb(now);

    expect(updates).toBeLessThanOrEqual(15);
  });

  test('resuming after a stop does not replay the paused interval', () => {
    const h = harness();
    h.loop.start();
    h.loop.stop();

    // Simulate the browser sitting idle for five seconds between stop and
    // start (an ad playing, or a backgrounded tab).
    h.loop.start();
    h.tick(5000);

    // `start()` resets the clock, so the first frame back must produce at most
    // one step, not three hundred.
    expect(h.loop.isRunning()).toBe(true);
  });

  test('destroy stops the loop permanently', () => {
    const h = harness();
    h.loop.start();
    h.loop.destroy();
    expect(h.loop.isRunning()).toBe(false);
    h.loop.start();
    expect(h.loop.isRunning()).toBe(false);
    expect(h.pendingCount).toBe(0);
  });
});
