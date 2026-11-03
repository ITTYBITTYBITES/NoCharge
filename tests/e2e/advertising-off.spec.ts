/**
 * Advertising is OFF in the shipped build.
 *
 * This file asserts the *absence* of advertising everywhere: no banner, no ad
 * placeholder, no reserved empty band, no AdSense tag, no Google Privacy &
 * messaging tag, no footer ad-choices control, and no Lab ad container.
 *
 * That is the current, intended state — see `docs/ADVERTISING_STATE.md` and
 * `src/config/adsense.ts`. These are not "skip" tests; if advertising is
 * switched back on (`PUBLIC_ADSENSE_ENABLED=true`) this file should be replaced
 * by the assertions in `adsense-enabled.spec.ts.disabled`, which encode the
 * banner's layout, id, and consent contract for that mode.
 */
import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const ADSENSE_SCRIPT_PATTERN = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const CONSENT_TAG_PATTERN = 'fundingchoicesmessages.google.com/i/pub-';
const ADS_TXT_LINE = 'google.com, pub-1566091161594729, DIRECT, f08c47fec0942fa0';

/** Pages that used to carry the banner, plus pages that never did. */
const ALL_PATHS = [
  '/',
  '/arcade/',
  '/guides/',
  '/guides/memory-match/',
  '/articles/',
  '/articles/memory-match-systematic-board-scan/',
  '/games/memory-match/',
  '/games/word-tile-rush/',
  '/games/color-flip/',
  '/games/beacon-lattice/',
  '/collections/',
  '/tools/',
  '/my-arcade/',
  '/privacy/',
  '/terms/',
  '/accessibility/',
  '/advertising/',
  '/about/',
  '/changelog/',
  '/lab/',
  '/lab/pulse-runner/',
] as const;

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test('no page renders a display ad or an empty ad placeholder', async ({ page }) => {
  for (const path of ALL_PATHS) {
    await page.goto(path);

    // No banner and no reserved slot.
    await expect(page.locator('[data-ad-banner]'), `${path} must not show a banner`).toHaveCount(0);
    await expect(page.locator('.ad-banner, .ad-banner__slot, .ad-banner__label'), `${path} must not reserve ad space`).toHaveCount(0);
    // No ad unit, anywhere.
    await expect(page.locator('ins.adsbygoogle, .adsbygoogle'), `${path} must not carry an ad unit`).toHaveCount(0);
    // An "Advertisement" label with nothing under it is the placeholder we are
    // explicitly not shipping.
    await expect(page.getByText('Advertisement', { exact: true }), `${path} must not show an ad label`).toHaveCount(0);
  }
});

test('no page loads an advertising script or advertising consent tag', async ({ page }) => {
  for (const path of ['/', '/games/memory-match/', '/privacy/', '/advertising/', '/lab/pulse-runner/']) {
    await page.goto(path);

    await expect(page.locator(`script[src*="${ADSENSE_SCRIPT_PATTERN}"]`), `${path} must not load the AdSense tag`).toHaveCount(0);
    await expect(page.locator(`script[src*="${CONSENT_TAG_PATTERN}"]`), `${path} must not load the Google consent tag`).toHaveCount(0);

    const html = (await page.content()).toLowerCase();
    for (const needle of ['adsbygoogle', 'pagead2', 'fundingchoicesmessages', 'highperformanceformat', 'atoptions', 'adsterra.com', 'dwin2.com', 'awin1.com']) {
      expect(html, `${path} must not contain ${needle}`).not.toContain(needle);
    }
    // No advertising consent state is fabricated either.
    expect(await page.evaluate(() => typeof (window as Window & { __tcfapi?: unknown }).__tcfapi)).toBe('undefined');
  }
});

test('the Lab reserves no empty advertising band around the stage', async ({ page }) => {
  for (const path of ['/lab/pulse-runner/', '/lab/barn-road-chronicles/']) {
    await page.goto(path);

    await expect(page.locator('[data-lab-ad]'), `${path} must not render ad containers`).toHaveCount(0);
    await expect(page.locator('.lab-ad, .lab-ad__label'), `${path} must not render an ad label`).toHaveCount(0);

    // The frame must be a single track: the stage fills it, with no leftover
    // band where an ad would have been.
    const areas = await page.locator('[data-lab-frame]').evaluate((el) => getComputedStyle(el).gridTemplateAreas);
    expect(areas, `${path} must not reserve an ad track`).not.toMatch(/ad-/);

    const fills = await page.evaluate(() => {
      const frame = document.querySelector('[data-lab-frame]')!.getBoundingClientRect();
      const stage = document.querySelector('.lab-stage')!.getBoundingClientRect();
      return frame.height - stage.height;
    });
    expect(fills, `${path} must give the full height to the stage`).toBeLessThanOrEqual(1);
  }
});

test('the advertising choice control is not offered when no network runs', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-google-ad-choices]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Privacy and cookie settings' })).toHaveCount(0);
  // The analytics choice is unaffected and still present.
  await expect(page.locator('[data-consent-open]').first()).toBeVisible();
});

test('trust pages tell the truth about the paused advertising', async ({ page }) => {
  await page.goto('/advertising/');
  await expect(page.getByRole('heading', { name: /No advertising network is active right now/i })).toBeVisible();
  // The AdSense description must not be shown while it is not running.
  await expect(page.locator('#ads-relationship')).toBeHidden();
  await expect(page.locator('#ads-consent')).toBeHidden();
  await expect(page.locator('#ads-data')).toBeHidden();

  await page.goto('/privacy/');
  await expect(page.locator('#advertising')).toContainText('not currently running any advertising network');
});

test('ads.txt is retained so a re-enable needs no file change', async ({ request }) => {
  const response = await request.get('/ads.txt');
  expect(response.ok()).toBe(true);
  expect((await response.text()).trim()).toBe(ADS_TXT_LINE);
});
