import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';
import { clearSoundCalls, soundCalls, stubGameSounds } from './helpers/sounds';

const continueHandoff = (page: import('@playwright/test').Page) =>
  page.locator('[data-pp="continue"]').click();

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
  await stubGameSounds(page);
});

test('Memory Match records flip then match on a pair', async ({ page }) => {
  await page.goto('/games/memory-match/');
  const cards = page.locator('.mm__card');
  const symbols = await cards.evaluateAll((elements) =>
    elements.map((element) => element.querySelector('.mm__face--front')?.textContent ?? ''),
  );
  const first = symbols[0]!;
  const matchIndex = symbols.findIndex((symbol, index) => index > 0 && symbol === first);
  await cards.nth(0).click();
  await cards.nth(matchIndex).click();
  expect(await soundCalls(page)).toEqual(['flip', 'flip', 'match']);
});

test('Word Tile Rush records place when a word is committed', async ({ page }) => {
  await page.goto('/games/word-tile-rush/');
  const firstLetter = page.locator('.wtr__cell:not(:disabled)').first();
  await firstLetter.click();
  const submit = page.getByRole('button', { name: 'Submit' });
  if (await submit.isEnabled()) await submit.click();
  const calls = await soundCalls(page);
  expect(calls.some((name) => name === 'place' || name === 'move')).toBe(true);
});

test('Color Flip records step after Start and a color pick', async ({ page }) => {
  await page.goto('/games/color-flip/');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Pick Amber' }).click();
  const calls = await soundCalls(page);
  expect(calls).toContain('step');
});

test('Beacon Lattice records place or error on a cell press', async ({ page }) => {
  await page.goto('/games/beacon-lattice/');
  await page.locator('[data-type]').first().click();
  await page.locator('.bl__cell:not([disabled])').first().click();
  const calls = await soundCalls(page);
  expect(calls.some((name) => name === 'place' || name === 'error')).toBeTruthy();
});

test('Klondike records flip on a stock draw', async ({ page }) => {
  await page.goto('/games/klondike/');
  await page.locator('[data-kl="stock"]').click();
  expect(await soundCalls(page)).toContain('flip');
});

test('FreeCell records flip on the first successful move', async ({ page }) => {
  await page.goto('/games/freecell/');
  const column = page.locator('[data-fc-col="0"] .fc__card--up').last();
  await column.click();
  const cell = page.locator('[data-fc-cell="0"]');
  await cell.click();
  expect(await soundCalls(page)).toContain('flip');
});

test('Nonogram records place on a mark', async ({ page }) => {
  await page.goto('/games/nonogram/');
  await page.locator('.ng__cell').first().click();
  expect(await soundCalls(page)).toContain('place');
});

test('2048 records merge only when tiles combine', async ({ page }) => {
  await page.goto('/games/twenty-forty-eight/');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  const calls = await soundCalls(page);
  expect(calls.every((name) => name === 'merge' || name === 'win')).toBe(true);
});

test('Tile Garden records place on an empty cell', async ({ page }) => {
  await page.goto('/games/tile-garden/');
  await page.locator('.tg__cell').first().click();
  expect(await soundCalls(page)).toContain('place');
});

test('Word Search records hint from the hint control', async ({ page }) => {
  await page.goto('/games/word-search/');
  await page.getByRole('button', { name: 'Hint' }).click();
  expect(await soundCalls(page)).toContain('hint');
});

test('Mini Sudoku records place or error on a digit', async ({ page }) => {
  await page.goto('/games/mini-sudoku/');
  const empty = page.locator('.ms__cell').filter({ hasNotText: /^[1-6]$/ }).first();
  await empty.click();
  await page.keyboard.press('1');
  const calls = await soundCalls(page);
  expect(calls.some((name) => name === 'place' || name === 'error')).toBe(true);
});

test('Tic-Tac-Toe records place then win on a completed line', async ({ page }) => {
  await page.goto('/games/tic-tac-toe/');
  await continueHandoff(page);
  const cells = page.locator('[data-ttt-cell]');
  for (const [index, move] of [0, 3, 1, 4, 2].entries()) {
    await cells.nth(move).click();
    if (index < 4) await continueHandoff(page);
  }
  const calls = await soundCalls(page);
  expect(calls.filter((name) => name === 'place')).toHaveLength(5);
  expect(calls.at(-1)).toBe('win');
});

test('Dots & Boxes records place, then claim when a box closes', async ({ page }) => {
  await page.goto('/games/dots-and-boxes/');
  await continueHandoff(page);
  const edge = (key: string) => page.locator(`[data-dab-edge="${key}"]`);
  await edge('h:0:0').click();
  expect(await soundCalls(page)).toEqual(['place']);
  await continueHandoff(page);
  await clearSoundCalls(page);
  await edge('v:0:0').click();
  await continueHandoff(page);
  await edge('v:0:1').click();
  await continueHandoff(page);
  await clearSoundCalls(page);
  await edge('h:1:0').click();
  expect(await soundCalls(page)).toEqual(['place', 'claim']);
});

test('Four in a Row records place on a disc drop', async ({ page }) => {
  await page.goto('/games/four-in-a-row/');
  await continueHandoff(page);
  await page.locator('[data-fir-column="0"]').click();
  expect(await soundCalls(page)).toEqual(['place']);
});

test('Reversi records place and flip when discs turn', async ({ page }) => {
  await page.goto('/games/reversi/');
  await continueHandoff(page);
  await page.locator('[data-rev-cell="43"]').click();
  expect(await soundCalls(page)).toEqual(['place', 'flip']);
});

test('Last Token records place, then error and win on the last token', async ({ page }) => {
  await page.goto('/games/last-token/');
  await continueHandoff(page);
  const take = (pile: number, n: number) => page.locator(`[data-lt-actions="${pile}"] [data-lt-take="${n}"]`);
  await take(2, 3).click();
  expect(await soundCalls(page)).toEqual(['place']);
  await continueHandoff(page);
  await take(2, 2).click();
  await continueHandoff(page);
  await take(0, 3).click();
  await continueHandoff(page);
  await take(1, 3).click();
  await continueHandoff(page);
  await clearSoundCalls(page);
  await take(1, 1).click();
  expect(await soundCalls(page)).toEqual(['place', 'error', 'win']);
});

test('Pass the Picture records place on a stroke', async ({ page }) => {
  await page.goto('/games/pass-the-picture/');
  await continueHandoff(page);
  const box = await page.locator('[data-ptp-canvas]').boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.3, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.45, box!.y + box!.height * 0.6, { steps: 4 });
  await page.mouse.up();
  expect(await soundCalls(page)).toContain('place');
});
