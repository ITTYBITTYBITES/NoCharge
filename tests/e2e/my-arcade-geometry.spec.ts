import { expect, test, type Page } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

/**
 * Geometry checks for My Arcade.
 *
 * These read real `getBoundingClientRect()` values from the mounted DOM and
 * fail on positive-area overlap between blocks that must stay apart, on text
 * escaping its panel, and on artwork losing its aspect ratio. No fixed-height
 * clipping is used to make anything pass.
 */

const RECENT_KEY = 'nocharge:pref:recently-played';

const POPULATED_FIXTURE: Record<string, string> = {
  [RECENT_KEY]: JSON.stringify([
    { gameId: 'beacon-lattice', playedAt: 1_755_000_000_000 },
    { gameId: 'color-flip', playedAt: 1_754_900_000_000 },
    { gameId: 'word-tile-rush', playedAt: 1_754_800_000_000 },
    { gameId: 'memory-match', playedAt: 1_754_700_000_000 },
  ]),
  'nocharge:memory-match:best-moves': '14',
  'nocharge:word-tile-rush:high': '4200',
  'nocharge:color-flip:high': '12',
  'nocharge:color-flip-turn-based:high': '7',
  'nocharge:beacon-lattice:high': '2',
  'nocharge:pref:beacon-lattice-progress': JSON.stringify({
    currentId: 'bl-02-long-plus',
    completed: ['bl-01-first-plus', 'bl-02-long-plus'],
    bests: { 'bl-01-first-plus': 1, 'bl-02-long-plus': 3 },
  }),
};

/** Sub-pixel layout rounding only. Anything larger is a real collision. */
const OVERLAP_TOLERANCE_PX = 0.75;
/** Antialiasing / outline bleed allowance for containment checks. */
const CONTAINMENT_TOLERANCE_PX = 1.5;

type Box = { label: string; x: number; y: number; width: number; height: number };

async function boxes(page: Page, selector: string, root = ':root'): Promise<Box[]> {
  return page.evaluate(
    ([sel, rootSel]) =>
      [...(document.querySelector(rootSel as string)?.querySelectorAll(sel as string) ?? [])]
        .filter((el) => {
          const style = getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            label: `${el.tagName.toLowerCase()}.${el.className || '-'}: ${(el.textContent ?? '').trim().slice(0, 42)}`,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          };
        }),
    [selector, root] as const,
  );
}

function overlapArea(a: Box, b: Box): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (w <= OVERLAP_TOLERANCE_PX || h <= OVERLAP_TOLERANCE_PX) return 0;
  return w * h;
}

function expectNoPairwiseOverlap(items: Box[], context: string) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const area = overlapArea(items[i]!, items[j]!);
      expect(
        area,
        `${context}: "${items[i]!.label}" overlaps "${items[j]!.label}" by ${area.toFixed(1)}px²`,
      ).toBe(0);
    }
  }
}

function expectContained(child: Box, parent: Box, context: string) {
  expect(child.x, `${context}: "${child.label}" starts left of its panel`).toBeGreaterThanOrEqual(
    parent.x - CONTAINMENT_TOLERANCE_PX,
  );
  expect(child.y, `${context}: "${child.label}" starts above its panel`).toBeGreaterThanOrEqual(
    parent.y - CONTAINMENT_TOLERANCE_PX,
  );
  expect(child.x + child.width, `${context}: "${child.label}" runs past the panel's right edge`).toBeLessThanOrEqual(
    parent.x + parent.width + CONTAINMENT_TOLERANCE_PX,
  );
  expect(child.y + child.height, `${context}: "${child.label}" runs past the panel's bottom edge`).toBeLessThanOrEqual(
    parent.y + parent.height + CONTAINMENT_TOLERANCE_PX,
  );
}

async function loadAllImages(page: Page) {
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img')) img.loading = 'eager';
    await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))));
  });
}

async function openPopulatedDashboard(page: Page) {
  await page.goto('/my-arcade/');
  await page.evaluate((values) => {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  }, POPULATED_FIXTURE);
  await page.reload();
  await expect(page.locator('[data-my-arcade]')).toHaveAttribute('aria-busy', 'false');
  await loadAllImages(page);
}

test.beforeEach(async ({ page }) => denyOptionalServices(page));

for (const width of [1440, 1024, 768, 390, 360, 320]) {
  test(`My Arcade cards keep headings, metrics and links apart at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openPopulatedDashboard(page);

    for (const gameId of ['memory-match', 'word-tile-rush', 'color-flip', 'beacon-lattice']) {
      const root = `[data-ma-card="${gameId}"]`;
      const [card] = await boxes(page, root);
      expect(card, `${gameId} card is missing`).toBeDefined();

      const parts = await boxes(
        page,
        '.ma-card__title, .ma-card__meta, .ma-card__played, .ma-card__metrics, .ma-card__links',
        root,
      );
      expectNoPairwiseOverlap(parts, `${gameId} card at ${width}px`);
      for (const part of parts) expectContained(part, card!, `${gameId} card at ${width}px`);

      // Metric label and value groups never collide with each other.
      expectNoPairwiseOverlap(await boxes(page, '.ma-metric', root), `${gameId} metrics at ${width}px`);

      // Play and Guide wrap instead of stacking on top of one another.
      expectNoPairwiseOverlap(await boxes(page, '.ma-card__links a', root), `${gameId} links at ${width}px`);

      // Artwork keeps its square aspect ratio.
      const [art] = await boxes(page, '.ma-card__art', root);
      if (art) {
        expect(
          Math.abs(art.width - art.height),
          `${gameId} artwork is ${art.width}x${art.height} at ${width}px`,
        ).toBeLessThanOrEqual(1.5);
        expectContained(art, card!, `${gameId} artwork at ${width}px`);
      }
    }
  });

  test(`Continue playing rows keep dates and controls apart at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openPopulatedDashboard(page);

    const items = await boxes(page, '[data-ma-continue-list] [data-ma-recent]:not([hidden])');
    expect(items).toHaveLength(4);
    expectNoPairwiseOverlap(items, `continue rows at ${width}px`);

    for (const gameId of ['memory-match', 'color-flip']) {
      const root = `[data-ma-recent="${gameId}"]`;
      const [row] = await boxes(page, root);
      const parts = await boxes(page, '.ma-continue__title, .ma-continue__meta, .ma-continue__when, .ma-continue__cta', root);
      expectNoPairwiseOverlap(parts, `${gameId} continue row at ${width}px`);
      for (const part of parts) expectContained(part, row!, `${gameId} continue row at ${width}px`);

      const [art] = await boxes(page, '.ma-continue__art', root);
      if (art) {
        expect(Math.abs(art.width - art.height)).toBeLessThanOrEqual(1.5);
      }
    }
  });
}

test('empty-state text stays inside its panel at every reviewed width', async ({ page }) => {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/my-arcade/');
    await expect(page.locator('[data-my-arcade]')).toHaveAttribute('aria-busy', 'false');

    const [panel] = await boxes(page, '[data-ma-empty]');
    expect(panel, `empty panel missing at ${width}px`).toBeDefined();
    for (const part of await boxes(page, 'h2, p', '[data-ma-empty]')) {
      expectContained(part, panel!, `empty state at ${width}px`);
    }
  }
});

test('the local-data notice and controls never cover dashboard content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPopulatedDashboard(page);

  const sections = await boxes(
    page,
    '[data-ma-continue], .ma-games, .ma-explain, .ma-controls',
    '[data-my-arcade]',
  );
  expectNoPairwiseOverlap(sections, 'dashboard sections');

  // The clear confirmation sits below the trigger instead of over it.
  await page.getByRole('button', { name: 'Clear game data' }).click();
  const controlParts = await boxes(page, ':scope > h2, :scope > p, :scope > .ma-confirm', '.ma-controls');
  expectNoPairwiseOverlap(controlParts, 'clear confirmation');
  const [controls] = await boxes(page, '.ma-controls');
  const [confirm] = await boxes(page, '.ma-confirm');
  expectContained(confirm!, controls!, 'clear confirmation');
});

test('nothing paints below the site shell and the footer stays separate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPopulatedDashboard(page);

  const [shell] = await boxes(page, '.site-shell');
  const [main] = await boxes(page, '.site-main');
  const [footer] = await boxes(page, '.site-footer');
  expect(main!.y + main!.height).toBeLessThanOrEqual(shell!.y + shell!.height + CONTAINMENT_TOLERANCE_PX);
  expect(overlapArea(main!, footer!)).toBe(0);

  const consentControls = await boxes(page, '.footer-controls button');
  for (const control of consentControls) expect(overlapArea(control, main!)).toBe(0);
});

test('no card hides meaningful text behind overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await openPopulatedDashboard(page);

  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll('[data-ma-card], [data-ma-recent]:not([hidden])')]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.overflow === 'visible') return false;
        return element.scrollHeight - element.clientHeight > 2 || element.scrollWidth - element.clientWidth > 2;
      })
      .map((element) => element.getAttribute('data-ma-card') ?? element.getAttribute('data-ma-recent')),
  );
  expect(clipped).toEqual([]);
});

test('inline picture markup cannot recreate the oversized-image regression', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPopulatedDashboard(page);

  const oversized = await page.evaluate(() =>
    [...document.querySelectorAll('main img')]
      .map((image) => {
        const rect = image.getBoundingClientRect();
        return { src: image.getAttribute('src') ?? '', width: rect.width, height: rect.height };
      })
      .filter((image) => image.width > window.innerWidth + 1 || image.height > 240),
  );
  expect(oversized).toEqual([]);

  // Every dashboard image is inside the shared GameArtwork wrapper, not a bare
  // inline <picture> that can escape its column.
  const bare = await page.evaluate(
    () => [...document.querySelectorAll('main picture')].filter((p) => !p.closest('.game-artwork')).length,
  );
  expect(bare).toBe(0);
});

test('focus outlines are not clipped by a card boundary', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPopulatedDashboard(page);

  const link = page.locator('[data-ma-card="memory-match"]').getByRole('link', { name: /^Play/ });
  await link.focus();
  const clipped = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return 'no focus';
    const rect = active.getBoundingClientRect();
    const card = active.closest('[data-ma-card]');
    if (!card) return 'no card';
    const cardRect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    // A focus ring is drawn 3px outside the element; the card must not clip it.
    if (style.overflow !== 'visible') return `card overflow is ${style.overflow}`;
    return rect.width > 0 && rect.height > 0 && cardRect.width > 0 ? '' : 'zero-size focus target';
  });
  expect(clipped).toBe('');
});
