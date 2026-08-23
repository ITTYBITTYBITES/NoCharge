import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __nochargeSounds?: string[];
  }
}

/** Stub AudioContext and record every named `play()` call. */
export async function stubGameSounds(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { __nochargeSounds?: string[] }).__nochargeSounds = [];

    class FakeParam {
      setValueAtTime() {}
      linearRampToValueAtTime() {}
      exponentialRampToValueAtTime() {}
      value = 0;
    }
    class FakeNode {
      connect() {
        return this;
      }
      disconnect() {}
      start() {}
      stop() {}
      type = 'sine';
      frequency = new FakeParam();
      gain = new FakeParam();
      Q = new FakeParam();
    }
    class FakeAudioContext {
      currentTime = 0;
      state = 'running';
      destination = new FakeNode();
      sampleRate = 44100;
      resume() {
        return Promise.resolve();
      }
      createOscillator() {
        return new FakeNode();
      }
      createGain() {
        return new FakeNode();
      }
      createBiquadFilter() {
        return new FakeNode();
      }
      createBuffer() {
        return { getChannelData: () => new Float32Array(8) };
      }
      createBufferSource() {
        return new FakeNode();
      }
    }
    Object.defineProperty(window, 'AudioContext', { configurable: true, writable: true, value: FakeAudioContext });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, writable: true, value: FakeAudioContext });
  });
}

export async function soundCalls(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as Window & { __nochargeSounds?: string[] }).__nochargeSounds ?? []);
}

export async function clearSoundCalls(page: Page) {
  await page.evaluate(() => {
    (window as Window & { __nochargeSounds?: string[] }).__nochargeSounds = [];
  });
}
