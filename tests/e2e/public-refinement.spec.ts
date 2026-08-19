import { expect, test } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

test.beforeEach(async ({ page }) => denyOptionalServices(page));

test('homepage keeps the real labeled ad while omitting ad-promotion copy', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-ad-banner]')).toHaveCount(1);
  await expect(page.locator('[data-ad-banner]').getByText('Advertisement', { exact: true })).toBeVisible();
  await expect(page.getByText(/one labeled banner Google manages|restrained advertising|no interstitials/i)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'A growing play library' })).toBeVisible();
});

test('footer exposes durable grouped destinations without repeated links', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer.getByRole('navigation', { name: 'Explore' })).toBeVisible();
  await expect(footer.getByRole('navigation', { name: 'NoCharge' })).toBeVisible();
  await expect(footer.getByRole('navigation', { name: 'Policies' })).toBeVisible();
  const hrefs = await footer.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(hrefs.length);
  expect(hrefs).toEqual(expect.arrayContaining(['/arcade/', '/guides/', '/articles/', '/collections/', '/help/', '/privacy/', '/terms/', '/advertising/']));
  expect(hrefs.filter((href) => href?.startsWith('/games/'))).toHaveLength(0);
  expect(hrefs.filter((href) => href?.startsWith('/articles/')).length).toBe(1);
  expect(hrefs.filter((href) => href === 'mailto:hello@nocharge.net')).toHaveLength(1);
});

test('public changelog uses visitor language and keeps reverse chronology', async ({ page }) => {
  await page.goto('/changelog/');
  const dates = await page.locator('.changelog-entry time').evaluateAll((times) => times.map((time) => time.getAttribute('datetime')));
  expect(dates).toEqual([...dates].sort().reverse());
  await expect(page.getByText(/commit|pull request|CI run|package version|local-storage key|CSP syntax/i)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Beacon Lattice joined the Quiet Arcade' })).toBeVisible();
});

test('help is linked, crawlable, and distinguishes local data from analytics', async ({ page, request }) => {
  await page.goto('/help/');
  expect((await request.get('/help/')).status()).toBe(200);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://nocharge.net/help/');
  await expect(page.getByText(/Clearing game data does not change your separate analytics consent/i)).toBeVisible();
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('https://nocharge.net/help/');
});

test('editorial images use responsive width descriptors and decorative alt text', async ({ page }) => {
  for (const path of ['/articles/', '/articles/how-nocharge-tests-browser-games/', '/collections/', '/help/']) {
    await page.goto(path);
    const pictures = page.locator('picture:has(source[src*="editorial-art"])');
    const count = await pictures.count();
    expect(count, path).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const picture = pictures.nth(index);
      const source = picture.locator('source[type="image/webp"]');
      await expect(source).toHaveAttribute('srcset', /800w/);
      await expect(source).toHaveAttribute('srcset', /1200w/);
      await expect(source).toHaveAttribute('srcset', /1600w/);
      await expect(source).toHaveAttribute('sizes', /vw|rem/);
      await expect(picture.locator('img')).toHaveAttribute('alt', '');
    }
  }
});
