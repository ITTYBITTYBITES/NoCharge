import { describe, expect, test } from 'vitest';

import { createAdLifecycle } from './lifecycle';
import type { AudioGate, InputGate } from './gates';
import type { RewardedProvider, RewardOutcome } from './providers';
import type { Loop } from '../loop/raf-loop';

interface FakeLoop extends Loop {
  startCount: number;
  stopCount: number;
  setRunning(value: boolean): void;
}

function fakeLoop(running = true): FakeLoop {
  let isRunning = running;
  const fake: FakeLoop = {
    startCount: 0,
    stopCount: 0,
    start() {
      fake.startCount += 1;
      isRunning = true;
    },
    stop() {
      fake.stopCount += 1;
      isRunning = false;
    },
    isRunning: () => isRunning,
    fps: () => 60,
    destroy() {
      isRunning = false;
    },
    setRunning(value) {
      isRunning = value;
    },
  };
  return fake;
}

function fakeGates() {
  const audio: AudioGate & { log: string[] } = {
    log: [],
    suppress() {
      audio.log.push('suppress');
    },
    restore() {
      audio.log.push('restore');
    },
    isSuppressed: () => audio.log.filter((e) => e === 'suppress').length > audio.log.filter((e) => e === 'restore').length,
  };
  const input: InputGate & { log: string[] } = {
    log: [],
    suspend() {
      input.log.push('suspend');
    },
    resume() {
      input.log.push('resume');
    },
    isSuspended: () => input.log.filter((e) => e === 'suspend').length > input.log.filter((e) => e === 'resume').length,
  };
  return { audio, input };
}

function rewarded(impl: () => Promise<RewardOutcome>): RewardedProvider {
  return { id: 'test', load: async () => true, show: impl };
}

describe('ad lifecycle', () => {
  test('an ad suspends input, silences audio, and stops the loop', async () => {
    const loop = fakeLoop();
    loop.setRunning(true);
    const { audio, input } = fakeGates();
    const lifecycle = createAdLifecycle({ loop, audio, input });

    const provider = rewarded(async () => {
      // Inside the ad: everything must already be held.
      expect(lifecycle.isShowingAd()).toBe(true);
      expect(input.isSuspended()).toBe(true);
      expect(audio.isSuppressed()).toBe(true);
      expect(loop.isRunning()).toBe(false);
      return { granted: true, placement: 'extra-life' };
    });

    const outcome = await lifecycle.playRewarded(provider, 'extra-life');

    expect(outcome.granted).toBe(true);
    expect(lifecycle.isShowingAd()).toBe(false);
    expect(input.isSuspended()).toBe(false);
    expect(audio.isSuppressed()).toBe(false);
    expect(loop.isRunning()).toBe(true);
  });

  test('a pause the player already asked for is not overridden by the ad', async () => {
    const loop = fakeLoop();
    // The player paused before tapping the reward prompt: the loop is stopped.
    loop.setRunning(false);
    const { audio, input } = fakeGates();
    const lifecycle = createAdLifecycle({ loop, audio, input });

    await lifecycle.playRewarded(rewarded(async () => ({ granted: false, placement: 'p', reason: 'cancelled' })), 'p');

    // Crucially: input and audio are released, but the loop stays stopped.
    expect(loop.isRunning()).toBe(false);
    expect(input.isSuspended()).toBe(false);
    expect(audio.isSuppressed()).toBe(false);
  });

  test('a provider that throws still releases every gate', async () => {
    const loop = fakeLoop();
    loop.setRunning(true);
    const { audio, input } = fakeGates();
    const lifecycle = createAdLifecycle({ loop, audio, input });

    const outcome = await lifecycle.playRewarded(
      rewarded(async () => {
        throw new Error('network SDK exploded');
      }),
      'p',
    );

    expect(outcome).toEqual({ granted: false, placement: 'p', reason: 'error' });
    expect(input.isSuspended()).toBe(false);
    expect(audio.isSuppressed()).toBe(false);
    expect(loop.isRunning()).toBe(true);
  });

  test('a second concurrent request is refused rather than double-held', async () => {
    const loop = fakeLoop();
    loop.setRunning(true);
    const { audio, input } = fakeGates();
    const lifecycle = createAdLifecycle({ loop, audio, input });

    let releaseFirst!: () => void;
    const first = lifecycle.playRewarded(
      rewarded(
        () =>
          new Promise((resolve) => {
            releaseFirst = () => resolve({ granted: true, placement: 'a' });
          }),
      ),
      'a',
    );

    const second = await lifecycle.playRewarded(rewarded(async () => ({ granted: true, placement: 'b' })), 'b');
    expect(second).toEqual({ granted: false, placement: 'b', reason: 'unavailable' });

    releaseFirst();
    await first;
    // Only one suppress/restore pair for two requests.
    expect(audio.log).toEqual(['suppress', 'restore']);
    expect(input.log).toEqual(['suspend', 'resume']);
  });

  test('before and after hooks fire exactly once, in order', async () => {
    const loop = fakeLoop();
    loop.setRunning(true);
    const { audio, input } = fakeGates();
    const seen: string[] = [];
    const lifecycle = createAdLifecycle({
      loop,
      audio,
      input,
      onBeforeAd: () => seen.push('before'),
      onAfterAd: () => seen.push('after'),
    });

    await lifecycle.playRewarded(rewarded(async () => ({ granted: true, placement: 'p' })), 'p');
    expect(seen).toEqual(['before', 'after']);
  });

  test('hold and release can be driven manually for interstitial surfaces', () => {
    const loop = fakeLoop();
    loop.setRunning(true);
    const { audio, input } = fakeGates();
    const lifecycle = createAdLifecycle({ loop, audio, input });

    lifecycle.hold();
    expect(lifecycle.isShowingAd()).toBe(true);
    lifecycle.hold(); // idempotent
    lifecycle.release();
    lifecycle.release(); // idempotent
    expect(lifecycle.isShowingAd()).toBe(false);
    expect(audio.log).toEqual(['suppress', 'restore']);
    expect(input.log).toEqual(['suspend', 'resume']);
  });
});
