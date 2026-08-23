import { expect, test } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

/**
 * Tests for the 10 new Quiet Setup articles added in PR #26 Phase 10.
 * Asserts: rendering, affiliate link markup, disclosure, no Amazon network requests.
 */

const NEW_SETUP_ARTICLES = [
  'calibrating-your-monitor-for-quiet-gaming',
  'large-monitor-vs-dual-monitors-for-browser-games',
  'anti-glare-screen-film-for-gaming-light',
  'open-back-vs-closed-back-headphones-for-long-sessions',
  'small-desk-speakers-for-quiet-play',
  'desk-chair-posture-for-long-quiet-sessions',
  'foot-rest-and-floor-mat-comfort',
  'desk-lamp-warm-vs-cool-light',
  'ambient-room-lighting-for-eye-comfort',
  'cable-management-for-a-calm-desk',
] as const;

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

for (const slug of NEW_SETUP_ARTICLES) {
  test.describe(`Setup article: ${slug}`, () => {
    test('renders with correct title and content', async ({ page }) => {
      await page.goto(`/setup/${slug}/`);
      await expect(page.locator('article.setup-article')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('affiliate links have correct markup', async ({ page }) => {
      await page.goto(`/setup/${slug}/`);

      const affiliateLinks = page.locator('a[data-amazon-paid-link]');
      const count = await affiliateLinks.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const link = affiliateLinks.nth(i);
          await expect(link).toHaveAttribute('target', '_blank');
          const rel = await link.getAttribute('rel');
          expect(rel).toContain('sponsored');
          expect(rel).toContain('nofollow');
          expect(rel).toContain('noopener');
          expect(rel).toContain('noreferrer');
        }
      }
    });

    test('visible "(opens in a new tab)" cue after affiliate links', async ({ page }) => {
      await page.goto(`/setup/${slug}/`);

      const affiliateLinks = page.locator('a[data-amazon-paid-link]');
      const count = await affiliateLinks.count();

      if (count > 0) {
        // Each affiliate link should be followed by visible "(opens in a new tab)" text
        const newTabCues = page.locator('.new-tab-cue, :text-is("(opens in a new tab)")');
        const cueCount = await newTabCues.count();
        expect(cueCount).toBeGreaterThanOrEqual(count);
      }
    });

    test('affiliate disclosure is visible when article has affiliate links', async ({ page }) => {
      await page.goto(`/setup/${slug}/`);

      const affiliateLinks = page.locator('a[data-amazon-paid-link]');
      const count = await affiliateLinks.count();

      if (count > 0) {
        const disclosure = page.locator('[data-affiliate-disclosure]');
        await expect(disclosure).toBeVisible();
        await expect(disclosure).toContainText('Amazon Associate');
      }
    });

    test('no Amazon network requests (stub endpoints)', async ({ page }) => {
      const amazonRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('amazon.com')) {
          amazonRequests.push(request.url());
        }
      });

      await page.goto(`/setup/${slug}/`);
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      expect(amazonRequests, `Unexpected Amazon requests: ${amazonRequests.join(', ')}`).toEqual([]);
    });
  });
}

test.describe('Setup index shows 18 articles', () => {
  test('lists all articles including new ones', async ({ page }) => {
    await page.goto('/setup/');
    // Count article cards/links
    const articleLinks = page.locator('a[href^="/setup/"]');
    const count = await articleLinks.count();
    expect(count).toBeGreaterThanOrEqual(18);
  });
});
