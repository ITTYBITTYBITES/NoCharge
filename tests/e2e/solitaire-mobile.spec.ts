import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

/**
 * Mobile touch regression coverage for the solitaire card games.
 *
 * Card input is wired with native `click` (a touch that becomes a scroll must
 * never move a card), foundation piles are real tap targets, and the Klondike
 * waste fans inside its slot instead of stacking over the tableau. These tests
 * drive the board through the touch path at a phone viewport.
 */

const FOUNDATION_INDEX: Record<string, number> = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };

test.use({ viewport: { width: 360, height: 800 }, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test('FreeCell taps select a card and send it to a foundation on a phone', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/games/freecell/');
  const root = page.locator('[data-game-root]');
  await expect(root).toHaveClass(/is-game-mounted/);

  // FreeCell has no deal-time auto-move, so an ace on a column top waits for
  // the player. Re-deal until one shows up so the foundation assertion is
  // deterministic no matter the shuffle.
  const moves = page.locator('[data-fc="moves"]');
  const readAces = () =>
    page.locator('[data-fc-col]').evaluateAll((columns) => {
      const labels = columns.map((column) => column.getAttribute('aria-label') ?? '');
      const found = labels.findIndex((label) => /top: A[♠♥♦♣]/.test(label));
      return found === -1 ? null : { col: found, symbol: labels[found]!.match(/top: A([♠♥♦♣])/)![1]! };
    });

  let ace = await readAces();
  let deals = 1;
  while (!ace && deals < 25) {
    const settings = page.getByRole('button', { name: 'Game settings' });
    await settings.click();
    await page.locator('[data-game-toolbar="restart-in-menu"]').click();
    await settings.click();
    await expect(page.locator('[data-game-settings-panel]')).toBeHidden();
    ace = await readAces();
    deals += 1;
  }
  expect(ace, 'a deal with an ace on a column top').not.toBeNull();

  // Tap the ace (the bottom card of its column) — it becomes the selection.
  const aceCard = page.locator(`[data-fc-col="${ace!.col}"] .fc__card`).last();
  await aceCard.scrollIntoViewIfNeeded();
  await aceCard.tap();
  await expect(page.locator(`[data-fc-col="${ace!.col}"] .fc__card.is-selected`).last()).toBeVisible();
  await expect(moves).toHaveText('0');

  // Tap any foundation: the ace goes up and the move is counted.
  await page.locator('[data-fc-fn="0"]').tap();
  await expect(moves).toHaveText('1');
  const foundationIndex = FOUNDATION_INDEX[ace!.symbol]!;
  await expect(page.locator(`[data-fc-fn="${foundationIndex}"]`)).toHaveAttribute(
    'aria-label',
    /Foundation .+, 1 cards, top: A/,
  );

  expect(errors).toEqual([]);
});

test('Klondike taps draw, select, and leave illegal foundation moves alone', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/games/klondike/');
  const root = page.locator('[data-game-root]');
  await expect(root).toHaveClass(/is-game-mounted/);

  const moves = page.locator('[data-kl="moves"]');
  const stock = page.locator('[data-kl="stock"]');
  const waste = page.locator('[data-kl="waste"]');

  await stock.tap();
  await expect(moves).not.toHaveText('0');
  // After a draw, auto-moves may also have counted; pin the value the illegal
  // tap below must not change.
  const movesAfterDraw = await moves.textContent();

  // Select the waste top, then tap a foundation. Aces are auto-moved on every
  // draw, so the waste top can never legally go up here — the tap must be a
  // no-op that keeps the selection instead of moving a random card.
  await waste.tap();
  const wasteTop = page.locator('.kl__waste > .kl__card').last();
  await expect(wasteTop).toHaveClass(/is-selected/);
  await page.locator('[data-kl-fn="0"]').tap();
  await expect(moves).toHaveText(movesAfterDraw!);
  await expect(page.locator('.kl__waste > .kl__card.is-selected')).toHaveCount(1);

  // Draw-3 fans the waste inside its fixed slot: the under-cards stack in
  // place with a horizontal offset, never below each other over the tableau.
  await page.locator('[data-kl="draw-toggle"]').tap();
  await stock.tap();
  const fanCount = await page.locator('.kl__waste > .kl__card').count();
  if (fanCount >= 2) {
    const offsets = await page
      .locator('.kl__waste > .kl__card')
      .nth(1)
      .evaluate((el) => {
        const card = el as HTMLElement;
        return { top: card.offsetTop, left: card.offsetLeft };
      });
    expect(offsets.top).toBe(0);
    expect(offsets.left).toBeGreaterThan(0);
  }

  expect(errors).toEqual([]);
});
