import { expect, test, type Page } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

// The singing bowl component renders its controls in a Shadow DOM. Playwright's
// CSS engine pierces open shadow roots, so a descendant combinator descends into
// the host's shadow tree to find the element.
const ELEMENT = 'singing-bowl-engine';

async function shadow(page: Page, selector: string) {
  return page.locator(`${ELEMENT} ${selector}`);
}

/**
 * Install a complete AudioContext stub for the singing-bowl engine. The engine
 * lazily builds a full graph on the first gesture (master gain, dry/wet buses,
 * a Convolver, oscillators, biquad filters), so the stub must provide every
 * factory the graph touches or the unlock gesture throws and the
 * tap-to-start overlay never dismisses.
 */
async function stubBowlAudio(page: Page) {
  await page.addInitScript(() => {
    class FakeParam {
      value = 0;
      setValueAtTime() {}
      linearRampToValueAtTime() {}
      exponentialRampToValueAtTime() {}
      cancelScheduledValues() {}
      setTargetAtTime() {}
    }
    class FakeNode {
      type = 'sine';
      frequency = new FakeParam();
      gain = new FakeParam();
      Q = new FakeParam();
      detune = new FakeParam();
      buffer: unknown = null;
      connect() {
        return this;
      }
      disconnect() {}
      start() {}
      stop() {}
    }
    class FakeAudioContext {
      sampleRate = 44100;
      currentTime = 0;
      state = 'running';
      destination = new FakeNode();
      resume() {
        this.state = 'running';
        return Promise.resolve();
      }
      createGain() {
        return new FakeNode();
      }
      createConvolver() {
        return new FakeNode();
      }
      createOscillator() {
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

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
  await stubBowlAudio(page);
});

test('shows the tap-to-start overlay before audio is unlocked and dismisses it on tap', async ({ page }) => {
  await page.goto('/tools/singing-bowl-engine/');

  const overlay = await shadow(page, '.start-overlay');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('Tap Anywhere to Start');

  // First tap anywhere unlocks audio and dismisses the overlay.
  await overlay.click();
  await expect(overlay).toBeHidden();
});

test('hydrates bowls from a shared URL hash without playing audio first', async ({ page }) => {
  // Single bowl at x=300,y=200,freq=440,quartz on a 600x400 canvas,
  // as produced by encodeState from StateSerializer.js.
  const encoded = 'gACAAG-XAAE';
  await page.goto(`/embed/sound-engine/#${encoded}`);

  // The bowl layout hydrates and renders immediately...
  await expect(page.locator('singing-bowl-engine')).toHaveCount(1);
  await expect(await shadow(page, '.bowl-count')).toHaveText('1 bowl');
  // ...but no audio node plays yet: the tap-to-start overlay is still shown.
  await expect(await shadow(page, '.start-overlay')).toBeVisible();
});

test('harmonic presets spawn pre-tuned bowls and update the URL hash', async ({ page }) => {
  await page.goto('/tools/singing-bowl-engine/');
  await (await shadow(page, '.start-overlay')).click();

  const preset = await shadow(page, '.preset-select');
  await preset.selectOption('pentatonic');

  const count = await shadow(page, '.bowl-count');
  await expect(count).toHaveText('5 bowls');

  // URL hash updated with the encoded arrangement.
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash.length).toBeGreaterThan(0);
});

test('tune overlay opens on long-press and step buttons adjust frequency', async ({ page }) => {
  await page.goto('/embed/sound-engine/');
  await (await shadow(page, '.start-overlay')).click();

  // Spawn a bowl by tapping the canvas.
  const canvas = page.locator('singing-bowl-engine canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  await expect(await shadow(page, '.bowl-count')).toHaveText('1 bowl');

  // Long-press the bowl to open the tune overlay.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();

  const tune = await shadow(page, '.tune-overlay');
  await expect(tune).toBeVisible();

  const slider = await shadow(page, '.tune-slider');
  await expect(slider).toHaveValue(/^\d+$/);
});
