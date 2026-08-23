import { expect, test } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

/**
 * Tests that the existing 8 PR #20 Quiet Setup articles have the new-tab fix applied:
 * target="_blank", rel="sponsored nofollow noopener noreferrer",
 * visible "(opens in a new tab)" cue, disclosure visible.
 */

const EXISTING_SETUP_ARTICLES = [
  'a-low-noise-desk-setup',
  'browser-zoom-versus-a-larger-display',
  'choosing-a-compact-keyboard-layout',
  'choosing-a-tablet-or-phone-stand',
  'choosing-an-offline-logic-puzzle-book',
  'mouse-trackpad-trackball-or-touch',
  'quiet-keyboard-switches-explained',
  'what-quiet-setup-means',
] as const;

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

for (const slug of EXISTING_SETUP_ARTICLES) {
  test.describe(`Existing setup article: ${slug}`, () => {
    test('affiliate links open in new tab with correct rel', async ({ page }) => {
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

    test('"(opens in a new tab)" cue present after affiliate links', async ({ page }) => {
      await page.goto(`/setup/${slug}/`);

      const affiliateLinks = page.locator('a[data-amazon-paid-link]');
      const count = await affiliateLinks.count();

      if (count > 0) {
        const newTabCues = page.locator('.new-tab-cue, :text-is("(opens in a new tab)")');
        const cueCount = await newTabCues.count();
        expect(cueCount).toBeGreaterThanOrEqual(count);
      }
    });

    test('disclosure visible when affiliate links present', async ({ page }) => {
      await page.goto(`/setup/${slug}/`);

      const affiliateLinks = page.locator('a[data-amazon-paid-link]');
      const count = await affiliateLinks.count();

      if (count > 0) {
        const disclosure = page.locator('[data-affiliate-disclosure]');
        await expect(disclosure).toBeVisible();
      }
    });
  });
}
