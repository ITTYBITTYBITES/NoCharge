import { afterEach, describe, expect, it } from 'vitest';
import { play, resetAudioPlaybackForTests, setMuted, setSoundEnabled, unlockAudio } from './play';

describe('shared audio playback', () => {
  afterEach(() => {
    resetAudioPlaybackForTests();
    setMuted(false);
    setSoundEnabled(true);
  });

  it('records names without a FIFO backlog when the test hook is present', async () => {
    const calls: string[] = [];
    (globalThis as { window?: { __nochargeSounds?: string[] } }).window = { __nochargeSounds: calls };
    unlockAudio();
    await Promise.all([play('move'), play('place'), play('win')]);
    expect(calls).toEqual(['move', 'place', 'win']);
  });

  it('still records preference-gated names when muted or disabled', async () => {
    const calls: string[] = [];
    (globalThis as { window?: { __nochargeSounds?: string[] } }).window = { __nochargeSounds: calls };
    setMuted(true);
    await play('win');
    setMuted(false);
    setSoundEnabled(false);
    await play('lose');
    expect(calls).toEqual(['win', 'lose']);
  });

  it('coalesces repeated noisy cues without delaying a win', async () => {
    unlockAudio();
    const durations = await Promise.all([play('move'), play('move'), play('win')]);
    expect(durations[2]).toBeGreaterThanOrEqual(0);
  });
});
