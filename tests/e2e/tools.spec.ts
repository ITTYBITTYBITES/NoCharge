import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { denyOptionalServices } from './helpers/consent';

const toolPaths = [
  '/tools/',
  '/tools/discovery-wheel/',
  '/tools/ambient-mixer/',
  '/tools/zoom-visualizer/',
  '/tools/game-finder/',
  '/tools/session-planner/',
  '/tools/random-activity/',
  '/tools/storage-inspector/',
  '/tools/contrast-checker/',
  '/tools/reduced-motion-tester/',
  '/tools/touch-target-checker/',
  '/tools/nonogram-clue-calculator/',
  '/tools/solitaire-comparator/',
  '/tools/sudoku-helper/',
  '/tools/focus-order-demo/',
  '/tools/word-scoring/',
] as const;

test.beforeEach(async ({ page }) => denyOptionalServices(page));

test('tools index links to the three current utilities', async ({ page }) => {
  await page.goto('/tools/');
  await expect(page.locator('.tool-card')).toHaveCount(15);
  for (const path of toolPaths.slice(1)) await expect(page.locator(`a[href="${path}"]`)).toHaveCount(1);
});

test('discovery wheel reads all published games and honors an impossible filter', async ({ page }) => {
  await page.goto('/tools/discovery-wheel/');
  const encodedGames = await page.locator('#results').getAttribute('data-games');
  expect(JSON.parse(encodedGames ?? '[]')).toHaveLength(26);
  await expect(page.locator('.result-card')).toHaveCount(3);

  await page.locator('#time').selectOption('2');
  await page.locator('#input').selectOption('touch');
  await page.locator('#pressure').selectOption('timed');
  await page.locator('#players').selectOption('passplay');
  await expect(page.locator('#results')).toContainText('No exact match');
  await expect(page.locator('.result-card')).toHaveCount(0);
});

test('ambient mixer exposes every texture and starts musical ambient from a user action', async ({ page }) => {
  await page.goto('/tools/ambient-mixer/');
  await expect(page.locator('#ambient-select option')).toHaveCount(11); // None plus ten textures.
  await page.locator('#ambient-select').selectOption('lofi');
  await page.getByRole('button', { name: 'Play ambient' }).click();
  await expect(page.locator('#status')).toContainText('lofi playing');
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.locator('#status')).toHaveText('Status: stopped.');
});

test('game settings save all ambient choices, including the new musical choices', async ({ page }) => {
  await page.goto('/games/memory-match/');
  await page.getByRole('button', { name: 'Game settings' }).click();
  const ambient = page.locator('[data-game-toolbar="ambient"]');
  await expect(ambient.locator('option')).toHaveCount(11);
  await ambient.selectOption('drone');
  expect(await page.evaluate(() => localStorage.getItem('nocharge:pref:ambient-sound'))).toBe('"drone"');
  await page.reload();
  await page.getByRole('button', { name: 'Game settings' }).click();
  await expect(page.locator('[data-game-toolbar="ambient"]')).toHaveValue('drone');
});

test('zoom calculator updates dimensions and all tool pages pass axe', async ({ page }) => {
  await page.goto('/tools/zoom-visualizer/');
  await page.locator('#screenW').fill('1440');
  await page.locator('#screenH').fill('900');
  await page.locator('#zoom').selectOption('400');
  await page.getByRole('button', { name: 'Calculate equivalent' }).click();
  await expect(page.locator('#result')).toHaveText('Equivalent viewport: 360 × 225 CSS pixels at 400% zoom.');

  for (const path of toolPaths) {
    await page.goto(path);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations, `${path}: ${JSON.stringify(result.violations)}`).toEqual([]);
  }
});
