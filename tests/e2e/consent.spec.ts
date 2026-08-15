import { expect, test } from '@playwright/test';

const consentKey = 'nocharge:consent';

const blockThirdParties = async (page: import('@playwright/test').Page) => {
  await page.route(/(?:googletagmanager|google-analytics|highperformanceformat)\.com/, async (route) => {
    await route.fulfill({ status: 204, contentType: 'text/javascript', body: '' });
  });
};

test('blocks optional services until the visitor chooses', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await blockThirdParties(page);

  await page.goto('/');

  await expect(page.locator('[data-consent-banner]')).toBeVisible();
  await expect(page.locator('[data-consent-ad]')).toBeHidden();
  await expect(page.locator('.ad-slot__frame[src]')).toHaveCount(0);
  expect(requests.some((url) => /googletagmanager|google-analytics|highperformanceformat/.test(url))).toBe(false);
});

test('stores granular choices and loads analytics only when allowed', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await blockThirdParties(page);

  await page.goto('/');
  await page.getByRole('button', { name: 'Customize' }).click();
  await page.getByLabel('Analytics').check();
  await page.getByLabel('Advertising').uncheck();
  await page.getByRole('button', { name: 'Save choices' }).click();

  await expect(page.locator('[data-consent-banner]')).toBeHidden();
  await expect(page.locator('[data-consent-ad]')).toBeHidden();
  await expect.poll(() => requests.some((url) => url.includes('googletagmanager.com/gtag/js'))).toBe(true);

  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), consentKey);
  expect(stored).toMatchObject({ version: 1, analytics: true, advertising: false });
});

test('loads one responsive sandboxed ad after advertising consent and unloads it on withdrawal', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await blockThirdParties(page);
  await page.goto('/');

  await page.getByRole('button', { name: 'Allow all' }).first().click();
  const loadedFrames = page.locator('.site-banner .ad-slot__frame[src]');
  await expect(loadedFrames).toHaveCount(1);
  await expect(loadedFrames).toHaveAttribute('src', '/ads/banner-728x90/');
  await expect(loadedFrames).toHaveAttribute(
    'sandbox',
    'allow-scripts allow-popups allow-popups-to-escape-sandbox',
  );

  await page.getByRole('button', { name: 'Privacy choices' }).click();
  await page.getByLabel('Advertising').uncheck();
  await page.getByRole('button', { name: 'Save choices' }).click();

  await expect(page.locator('[data-consent-ad]')).toBeHidden();
  await expect(page.locator('.ad-slot__frame[src]')).toHaveCount(0);
});

test('reveals the configured sponsored Smartlink only after an allowed banner has no fill', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await blockThirdParties(page);
  await page.goto('/');

  await expect(page.getByRole('link', { name: /Sponsored · Play more free games/ })).toBeHidden();
  await page.getByRole('button', { name: 'Allow all' }).first().click();

  const fallback = page.getByRole('link', { name: /Sponsored · Play more free games/ });
  await expect(fallback).toBeVisible({ timeout: 5_000 });
  await expect(fallback).toHaveAttribute(
    'href',
    'https://harryinspectionlucy.com/srnxu0v8?key=a88515281e2b9a060a8d095fbae6a3d7',
  );
  await expect(fallback).toHaveAttribute('rel', /noopener.*noreferrer.*sponsored/);
});

test('selects the phone banner at the mobile breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await blockThirdParties(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Allow all' }).first().click();

  const loadedFrames = page.locator('.site-banner .ad-slot__frame[src]');
  await expect(loadedFrames).toHaveCount(1);
  await expect(loadedFrames).toHaveAttribute('src', '/ads/banner-320x50/');
});
