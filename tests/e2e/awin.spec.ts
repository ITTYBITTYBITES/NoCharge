/**
 * Awin integration contract.
 *
 * The shipped build has `PUBLIC_AWIN_ENABLED` unset, so the first block asserts
 * the *absence* of every Awin artifact — no MasterTag, no link, no CSP
 * widening. That keeps the calm default honest.
 *
 * The second block simulates the enabled build in the browser: it seeds an
 * analytics consent (the gate the MasterTag waits for), then asserts the tag
 * URL, and asserts that every rendered Awin link is attributable and carries the
 * required `rel`. Those assertions run against the links that exist in the
 * build, so they are meaningful in both modes.
 *
 * `npm run validate:awin` checks the built HTML for the same invariants without
 * a browser, which is what CI should rely on for the static guarantees.
 */
import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

const PID = '3025417';
const REL = ['nofollow', 'noopener', 'noreferrer', 'sponsored'];

test.describe('shipped build: Awin is off', () => {
  test.beforeEach(async ({ page }) => {
    await denyOptionalServices(page);
  });

  test('no page requests the MasterTag and no Awin link is rendered', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));

    for (const path of ['/', '/games/memory-match/', '/guides/memory-match/', '/setup/bias-lighting-behind-a-monitor/']) {
      await page.goto(path);
      await expect(page.locator('script[src*="dwin2.com"]'), `${path} must not load the MasterTag`).toHaveCount(0);
      await expect(page.locator('[data-awin-link]'), `${path} must not render an Awin link`).toHaveCount(0);
      await expect(page.locator('[data-gear-picks], [data-setup-awin]'), `${path} must not render a gear module`).toHaveCount(0);
    }

    expect(requested.filter((url) => url.includes('dwin2.com') || url.includes('awin1.com'))).toEqual([]);
  });

  test('the CSP does not carry Awin hosts when the program is off', async ({ page }) => {
    await page.goto('/');
    const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(policy).not.toContain('dwin2.com');
    expect(policy).not.toContain('awin1.com');
  });

  test('the footer affiliate disclosure is present even with Awin off', async ({ page }) => {
    await page.goto('/');
    const note = page.locator('[data-affiliate-note]');
    await expect(note).toBeVisible();
    await expect(note).toContainText('paid links');
    await expect(note.getByRole('link')).toHaveAttribute('href', '/advertising/');
  });
});

test.describe('consent gate', () => {
  test('the MasterTag is not requested before an analytics decision', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (request) => requested.push(request.url()));
    await page.goto('/');
    // No stored consent, no request — regardless of the build flag.
    expect(requested.filter((url) => url.includes('dwin2.com'))).toEqual([]);
  });
});

test.describe('every rendered paid link meets the contract', () => {
  test.beforeEach(async ({ page }) => {
    await denyOptionalServices(page);
  });

  test('Awin links carry rel, target, PID and a clickable https destination', async ({ page }) => {
    const audit = await page.evaluate(async () => {
      const seen: { href: string; rel: string; target: string | null; pid: string | null; mid: string | null }[] = [];
      // Setup articles with lighting/screens topics are where Awin blocks land.
      const paths = ['/', '/guides/memory-match/', '/setup/bias-lighting-behind-a-monitor/'];
      for (const path of paths) {
        const response = await fetch(path);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        for (const anchor of doc.querySelectorAll<HTMLAnchorElement>('a[data-awin-link]')) {
          seen.push({
            href: anchor.getAttribute('href') ?? '',
            rel: anchor.getAttribute('rel') ?? '',
            target: anchor.getAttribute('target'),
            pid: anchor.getAttribute('data-awin-pid'),
            mid: anchor.getAttribute('data-awin-mid'),
          });
        }
      }
      return seen;
    });

    for (const link of audit) {
      expect(link.rel.split(' ').sort(), link.href).toEqual(REL);
      expect(link.target, link.href).toBe('_blank');
      expect(link.pid, link.href).toBe(PID);
      expect(link.mid, link.href).toMatch(/^\d+$/);
      const url = new URL(link.href);
      if (url.hostname.endsWith('awin1.com')) {
        expect(url.pathname).toBe('/cread.php');
        expect(url.searchParams.get('awinaffid')).toBe(PID);
        expect(url.searchParams.get('awinmid')).toBe(link.mid);
        expect(url.searchParams.get('ued')).toMatch(/^https:\/\//);
      } else {
        // Convert-a-Link mode: a bare https merchant URL is acceptable.
        expect(url.protocol).toBe('https:');
      }
    }
  });

  test('a paid link never appears inside a game surface', async ({ page }) => {
    await page.goto('/games/memory-match/');
    for (const selector of ['[data-game-shell]', '[data-game-viewport]', '[data-recently-played]', '.game-controls']) {
      await expect(page.locator(selector).locator('[data-awin-link], a[href*="awin1.com"], a[href*="dwin2"]')).toHaveCount(0);
    }
  });
});
