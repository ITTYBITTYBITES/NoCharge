import { expect, test } from '@playwright/test';

import { blockGoogleEndpoints, denyOptionalServices } from './helpers/consent';

/**
 * Lab section behaviour.
 *
 * The separation between the Quiet Arcade and the Lab is the point of the whole
 * exercise, so it is enforced here rather than documented and hoped for:
 *
 *  - Lab pages carry no AdSense and no AdSense tag.
 *  - Lab pages are no-index, so demo pages cannot dilute the domain's content
 *    standing.
 *  - Lab pages do not request any third-party host while no advertising consent
 *    basis exists.
 *  - The Lab navigation link is invisible until the visitor opts in, and stays
 *    visible once they have.
 */

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test.describe('Lab section separation', () => {
  test('Lab pages carry no AdSense banner and no AdSense tag', async ({ page }) => {
    await blockGoogleEndpoints(page);

    for (const path of ['/lab/', '/lab/pulse-runner/']) {
      await page.goto(path);
      await expect(page.locator('[data-ad-banner]'), `${path} must not show the AdSense banner`).toHaveCount(0);
      await expect(
        page.locator('script[src*="pagead2.googlesyndication.com"]'),
        `${path} must not load the AdSense tag`,
      ).toHaveCount(0);
    }
  });

  test('Lab pages are no-index', async ({ page }) => {
    for (const path of ['/lab/', '/lab/pulse-runner/']) {
      await page.goto(path);
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots, `${path} must be no-index`).toContain('noindex');
    }
  });

  test('Lab pages make no third-party requests without an advertising basis', async ({ page }) => {
    const thirdParty: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('http') && !url.includes('localhost:4321')) thirdParty.push(url);
    });
    await blockGoogleEndpoints(page);

    await page.goto('/lab/pulse-runner/');
    // Let the mount settle: the loop, canvas stage, and ad slots all initialise.
    await page.waitForTimeout(600);

    // The Google consent platform is first-party to NoCharge's consent model and
    // is stubbed by blockGoogleEndpoints; nothing else should be contacted.
    const nonGoogle = thirdParty.filter((url) => !url.includes('google.com'));
    expect(nonGoogle, 'no non-Google third-party request without consent').toEqual([]);
  });

  test('the prototype canvas mounts and the stage fills the viewport', async ({ page }) => {
    await blockGoogleEndpoints(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/lab/pulse-runner/');

    // Wait for the deterministic mount signal rather than racing the dynamic
    // import: an unsized canvas is 300x150 by default, which would make the
    // backing-store assertion below fail intermittently on a loaded runner.
    await expect(page.locator('[data-lab-frame].is-lab-mounted')).toBeVisible();

    const canvas = page.locator('[data-pulse-canvas]');
    await expect(canvas).toBeVisible();

    // The backing store must be larger than the CSS box on a 3x device, and
    // capped at 2x so a phone does not render at native density.
    const sizing = await canvas.evaluate((element) => {
      const el = element as HTMLCanvasElement;
      const rect = el.getBoundingClientRect();
      return { cssWidth: Math.round(rect.width), backingWidth: el.width, dpr: window.devicePixelRatio };
    });
    expect(sizing.backingWidth).toBeGreaterThanOrEqual(sizing.cssWidth);
    expect(sizing.backingWidth).toBeLessThanOrEqual(Math.ceil(sizing.cssWidth * 2) + 2);
  });

  test('the HUD exit control is reachable and points back to the calm site', async ({ page }) => {
    await blockGoogleEndpoints(page);
    await page.goto('/lab/pulse-runner/');

    const exit = page.getByRole('link', { name: /return to calm/i });
    await expect(exit).toBeVisible();
    await expect(exit).toHaveAttribute('href', '/');
    // 44px minimum touch target, matching the calm site's own rule.
    const box = await exit.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe('site mode preference', () => {
  test('the Lab link is hidden until the visitor opts in', async ({ page }) => {
    await blockGoogleEndpoints(page);
    await page.goto('/');

    const lab = page.locator('[data-mode-option="lab"]');
    await expect(lab, 'Lab must be hidden by default').toBeHidden();

    const calm = page.locator('[data-mode-option="calm"]');
    await expect(calm).toBeVisible();
  });

  test('opting in persists across a reload', async ({ page }) => {
    await blockGoogleEndpoints(page);
    await page.goto('/');

    // Reveal directly through storage, as the toggle's own click would navigate
    // to /lab/ and this test is about persistence, not navigation.
    await page.evaluate(() => {
      localStorage.setItem('nocharge:pref:site-mode', JSON.stringify('lab'));
    });
    await page.reload();

    const lab = page.locator('[data-mode-option="lab"]');
    await expect(lab, 'Lab must stay visible after a reload').toBeVisible();

    // And the bootstrap must have applied it before first paint, with no flash.
    const applied = await page.evaluate(() => document.documentElement.dataset.sitePreference);
    expect(applied).toBe('lab');
  });

  test('a Lab page shows the switch, so a deep link can opt in', async ({ page }) => {
    // The switch is hidden on calm pages for visitors who never opted in, which
    // keeps the header identical to the pre-Lab markup. A Lab page is the
    // opt-in surface, so both options appear there regardless of preference.
    await blockGoogleEndpoints(page);
    await page.goto('/lab/');

    await expect(page.locator('[data-mode-switch]')).toBeVisible();
    await expect(page.locator('[data-mode-option="calm"]')).toBeVisible();
    await expect(page.locator('[data-mode-option="lab"]')).toBeVisible();
  });

  test('a malformed preference falls back to calm', async ({ page }) => {
    await blockGoogleEndpoints(page);
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('nocharge:pref:site-mode', 'not-json');
    });
    await page.reload();

    const applied = await page.evaluate(() => document.documentElement.dataset.sitePreference);
    expect(applied).toBe('calm');
    await expect(page.locator('[data-mode-option="lab"]')).toBeHidden();
  });
});
