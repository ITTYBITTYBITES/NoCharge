import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const storedDenial = {
  version: 1,
  analytics: false,
  advertising: false,
  updatedAt: '2026-08-15T12:00:00.000Z',
};

for (const path of [
  '/',
  '/arcade/',
  '/guides/',
  '/guides/memory-match/',
  '/guides/word-tile-rush/',
  '/guides/color-flip/',
  '/privacy/',
  '/games/memory-match/',
  '/games/word-tile-rush/',
  '/games/color-flip/',
  '/404.html',
]) {
  test(`has no automatically detectable accessibility violations: ${path}`, async ({ page }) => {
    await page.addInitScript((choice) => {
      localStorage.setItem('nocharge:consent', JSON.stringify(choice));
    }, storedDenial);
    await page.goto(path);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test('ships a restrictive document policy and sandboxed ad frames', async ({ page }) => {
  await page.addInitScript((choice) => {
    localStorage.setItem('nocharge:consent', JSON.stringify(choice));
  }, storedDenial);
  await page.goto('/games/memory-match/');

  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("frame-src 'self'");
  expect(policy).toContain("form-action 'self'");

  const frame = page.locator('.ad-slot__frame').first();
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  await expect(frame).toHaveAttribute('allow', /camera 'none'.*microphone 'none'.*payment 'none'/);
  await expect(frame).not.toHaveAttribute('src', /.+/);
});

test('publishes security contact details and the custom 404', async ({ request }) => {
  const security = await request.get('/.well-known/security.txt');
  expect(security.ok()).toBe(true);
  expect(await security.text()).toContain('Contact: mailto:hello@nocharge.net');

  const missing = await request.get('/this-page-does-not-exist/');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('That page slipped away.');
});
