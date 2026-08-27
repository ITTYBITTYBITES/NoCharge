import { expect, test, type Page } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

/**
 * Game Mode geometry is measured, not declared.
 *
 * Live mobile QA found FreeCell and Klondike boards whose scroll height was
 * four times the visible stage, with the active tableau extending far below
 * the fold. A hidden scrollbar would not have shown that, so every assertion
 * here reads real `scrollWidth`/`clientWidth`, `scrollHeight`/`clientHeight`,
 * and `getBoundingClientRect()` values after actually entering Game Mode and
 * playing.
 */
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
] as const;

const PRIMARY_BOARD: Record<string, string> = {
  freecell: '.fc__board, .fc__tableau',
  klondike: '.kl__board, .kl__tableau',
  'tile-garden': '[data-tg="board"]',
  'twenty-forty-eight': '[data-tfe="board"]',
  'word-search': '[data-ws-board]',
};

/** Every card/tile/cell that carries game state and must stay on screen. */
const ESSENTIAL: Record<string, string> = {
  freecell: '.fc__top .fc__card, .fc__pile .fc__card, .fc__fan-cards .fc__card',
  klondike: '.kl__top .kl__card, .kl__pile .kl__card, .kl__fan-cards .kl__card',
  'tile-garden': '.tg__cell',
  'twenty-forty-eight': '.tfe__cell',
  'word-search': '.ws__cell',
};

/** Fraction of the stage the compact chrome may occupy. */
const MAX_CHROME_SHARE = 0.25;

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

/** Press Play [Game] and wait for the fixed-height Game Mode stage. */
async function enterGameMode(page: Page) {
  await page.locator('[data-game-play-btn]').click();
  await expect(page.locator('[data-game-viewport]')).toHaveClass(/is-immersive|is-fullscreen-active/);
}

/** Enter Game Mode while recording page errors and unhandled rejections. */
async function enterGameModeWatched(page: Page) {
  await page.evaluate(() => {
    const w = window as Window & { __ncRejections?: string[] };
    w.__ncRejections = [];
    window.addEventListener('unhandledrejection', (event) => {
      const reason = (event as PromiseRejectionEvent).reason;
      w.__ncRejections!.push(
        `unhandledrejection: ${reason instanceof Error ? `${reason.name}: ${reason.message}\n${reason.stack ?? ''}` : String(reason)}`,
      );
    });
  });
  await enterGameMode(page);
}

/** True when a captured error or rejection originates in first-party code. */
function firstParty(text: string, origin: string): boolean {
  return text.includes(origin) || /\/_astro\/|\/games\/|\/dist\//.test(text);
}

interface Geometry {
  docScrollWidth: number;
  innerWidth: number;
  boards: { selector: string; scrollWidth: number; clientWidth: number; scrollHeight: number; clientHeight: number }[];
  outside: { selector: string; index: number; rect: { top: number; bottom: number; left: number; right: number } }[];
  essential: number;
  chrome: { height: number; top: number; bottom: number };
  stage: { top: number; bottom: number; left: number; right: number; height: number; width: number };
}

/** Measure the stage, its primary boards, and every essential game element. */
async function measure(page: Page, gameId: string): Promise<Geometry> {
  return page.evaluate(
    ({ primary, essential }) => {
      const viewport = document.querySelector('[data-game-viewport]') as HTMLElement;
      const stage = viewport.getBoundingClientRect();

      const boards = [...viewport.querySelectorAll<HTMLElement>(primary)].map((el) => ({
        selector: el.className || el.dataset.gameRoot || el.tagName.toLowerCase(),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));

      const outside: Geometry['outside'] = [];
      const nodes = [...viewport.querySelectorAll<HTMLElement>(essential)];
      nodes.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        // Zero-size placeholders carry no state.
        if (rect.width === 0 || rect.height === 0) return;
        if (
          rect.top < stage.top - 1 ||
          rect.bottom > stage.bottom + 1 ||
          rect.left < stage.left - 1 ||
          rect.right > stage.right + 1
        ) {
          outside.push({
            selector: el.className || el.tagName.toLowerCase(),
            index,
            rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
          });
        }
      });

      const toolbar = viewport.querySelector<HTMLElement>(':scope > .game-toolbar');
      const chrome = toolbar
        ? {
            height: toolbar.getBoundingClientRect().height,
            top: toolbar.getBoundingClientRect().top,
            bottom: toolbar.getBoundingClientRect().bottom,
          }
        : { height: 0, top: stage.top, bottom: stage.top };

      return {
        docScrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        boards,
        outside,
        essential: nodes.length,
        chrome,
        stage: {
          top: stage.top,
          bottom: stage.bottom,
          left: stage.left,
          right: stage.right,
          height: stage.height,
          width: stage.width,
        },
      };
    },
    { gameId, primary: PRIMARY_BOARD[gameId] ?? '', essential: ESSENTIAL[gameId] ?? '' },
  );
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    for (const gameId of Object.keys(PRIMARY_BOARD)) {
      test(`${gameId}: Game Mode fits the stage with no scrolling`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`/games/${gameId}/`);
        await expect(page.locator('[data-game-root]')).toHaveClass(/is-game-mounted/);

        if (gameId === 'word-search') {
          // The largest grid is the one that can overflow.
          await page.locator('[data-ws-size]').selectOption('10');
          await expect(page.locator('.ws__cell')).toHaveCount(100);
        }

        const errors: string[] = [];
        await enterGameModeWatched(page);

        const geometry = await measure(page, gameId);
        const label = `${gameId} @ ${viewport.width}x${viewport.height}`;

        // The document must not scroll sideways.
        expect(
          geometry.docScrollWidth - geometry.innerWidth,
          `${label}: document scrollWidth ${geometry.docScrollWidth} > innerWidth ${geometry.innerWidth}`,
        ).toBeLessThanOrEqual(1);

        // Real game state must be present, or the assertions prove nothing.
        expect(geometry.essential, `${label}: no essential elements matched`).toBeGreaterThan(0);

        // No primary board may scroll in either axis.
        for (const board of geometry.boards) {
          expect(
            board.scrollWidth - board.clientWidth,
            `${label}: ${board.selector} scrolls horizontally (${board.scrollWidth} > ${board.clientWidth})`,
          ).toBeLessThanOrEqual(1);
          expect(
            board.scrollHeight - board.clientHeight,
            `${label}: ${board.selector} scrolls vertically (${board.scrollHeight} > ${board.clientHeight})`,
          ).toBeLessThanOrEqual(1);
        }

        // Nothing essential may sit outside the visible stage.
        expect(
          geometry.outside,
          `${label}: ${geometry.outside.length} essential elements outside the stage: ${JSON.stringify(
            geometry.outside.slice(0, 4),
          )}`,
        ).toEqual([]);

        // Compact chrome must not eat the stage.
        expect(
          geometry.chrome.height / geometry.stage.height,
          `${label}: chrome ${geometry.chrome.height.toFixed(1)}px of ${geometry.stage.height.toFixed(1)}px stage`,
        ).toBeLessThanOrEqual(MAX_CHROME_SHARE);

        // No first-party uncaught error while entering Game Mode.
        const rejections = await page.evaluate(() => (window as Window & { __ncRejections?: string[] }).__ncRejections ?? []);
        const all = [...errors, ...rejections];
        expect(
          all.filter((entry) => firstParty(entry, new URL(page.url()).origin)),
          `${label}: first-party errors: ${all.join('; ')}`,
        ).toEqual([]);
      });
    }
  });
}

test.describe('solitaire is playable inside Game Mode without scrolling', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('FreeCell: a legal move to a free cell completes without scrolling', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}\n${error.stack ?? ''}`));
    await page.goto('/games/freecell/');
    await enterGameModeWatched(page);

    const moves = page.locator('[data-fc="moves"]');
    const before = Number((await moves.textContent()) ?? '0');

    // Every dealt pile is face-up, so at least one top card can always move to
    // an empty free cell. Search for it rather than assuming a column.
    let applied = false;
    for (let col = 0; col < 8 && !applied; col += 1) {
      const card = page.locator(`[data-fc-col="${col}"] .fc__card`).last();
      if ((await card.count()) === 0) continue;
      await card.click({ force: true });
      for (let cell = 0; cell < 4 && !applied; cell += 1) {
        await page.locator(`[data-fc-cell="${cell}"]`).click({ force: true });
        applied = Number((await moves.textContent()) ?? '0') > before;
      }
    }
    expect(applied, 'no legal free-cell move could be applied').toBe(true);

    const geometry = await measure(page, 'freecell');
    expect(geometry.outside, `cards left the stage: ${JSON.stringify(geometry.outside.slice(0, 4))}`).toEqual([]);
    expect(errors.filter((entry) => firstParty(entry, new URL(page.url()).origin))).toEqual([]);
  });

  test('FreeCell: the column fan replaces the board and stays inside the stage', async ({ page }) => {
    await page.goto('/games/freecell/');
    await enterGameMode(page);

    await page.locator('[data-fc-col="0"] [data-fc-expand]').click();
    await expect(page.locator('[data-fc="fan"]')).toBeVisible();
    await expect(page.locator('[data-fc="tableau"]')).toBeHidden();

    const fanned = await page.locator('.fc__fan-cards .fc__card').count();
    expect(fanned).toBeGreaterThan(0);

    const geometry = await measure(page, 'freecell');
    expect(geometry.outside, 'fan cards left the stage').toEqual([]);
    for (const board of geometry.boards) {
      expect(board.scrollHeight - board.clientHeight, `${board.selector} scrolls`).toBeLessThanOrEqual(1);
    }

    // Escape closes the fan and returns focus to its trigger.
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-fc="fan"]')).toBeHidden();
    await expect(page.locator('[data-fc-col="0"] [data-fc-expand]')).toBeFocused();
  });

  test('Klondike: draw, move, and undo all work without scrolling', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}\n${error.stack ?? ''}`));
    await page.goto('/games/klondike/');
    await enterGameModeWatched(page);

    // Drawing from the stock is always legal.
    await page.locator('[data-kl="stock"]').click({ force: true });
    await expect(page.locator('[data-kl="moves"]')).not.toHaveText('0');

    // Move the waste card onto any tableau column that accepts it.
    const moves = page.locator('[data-kl="moves"]');
    const before = Number((await moves.textContent()) ?? '0');
    await page.locator('[data-kl="waste"]').click({ force: true });
    let applied = false;
    for (let col = 0; col < 7 && !applied; col += 1) {
      await page.locator(`[data-kl-col="${col}"]`).click({ force: true });
      applied = Number((await moves.textContent()) ?? '0') > before;
    }
    // A king may not fit anywhere; undo must still work either way.
    await page.locator('[data-kl="undo-btn"]').click();

    const geometry = await measure(page, 'klondike');
    expect(geometry.outside, `cards left the stage: ${JSON.stringify(geometry.outside.slice(0, 4))}`).toEqual([]);
    for (const board of geometry.boards) {
      expect(board.scrollHeight - board.clientHeight, `${board.selector} scrolls`).toBeLessThanOrEqual(1);
    }
    expect(errors.filter((entry) => firstParty(entry, new URL(page.url()).origin))).toEqual([]);
  });

  test('Klondike: covered and open runs both stay inside the stage', async ({ page }) => {
    await page.goto('/games/klondike/');
    await enterGameMode(page);

    const tallest = await page.locator('.kl__column').evaluateAll((columns) =>
      Math.max(...columns.map((column) => column.querySelectorAll('.kl__card').length)),
    );
    expect(tallest, 'the initial deal should have a seven-card column').toBe(7);

    const geometry = await measure(page, 'klondike');
    expect(geometry.outside, 'cards left the stage').toEqual([]);
  });

  test('Word Search 8x8 and 10x10 both fit without scrolling', async ({ page }) => {
    await page.goto('/games/word-search/');
    for (const size of ['8', '10']) {
      await page.locator('[data-ws-size]').selectOption(size);
      await expect(page.locator('.ws__cell')).toHaveCount(Number(size) ** 2);
      await enterGameMode(page);

      const geometry = await measure(page, 'word-search');
      expect(geometry.essential, `grid ${size}`).toBe(Number(size) ** 2);
      expect(geometry.outside, `grid ${size}: cells outside the stage`).toEqual([]);
      for (const board of geometry.boards) {
        expect(board.scrollWidth - board.clientWidth, `grid ${size}: horizontal scroll`).toBeLessThanOrEqual(1);
        expect(board.scrollHeight - board.clientHeight, `grid ${size}: vertical scroll`).toBeLessThanOrEqual(1);
      }

      await page.keyboard.press('Escape');
      await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-immersive|is-fullscreen-active/);
    }
  });
});

test.describe('Game Mode chrome', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('the chrome is one compact row with a focusable exit', async ({ page }) => {
    await page.goto('/games/freecell/');
    await enterGameMode(page);

    const toolbar = page.locator('[data-game-viewport] > .game-toolbar');
    const exit = page.locator('[data-game-toolbar="fullscreen"]');
    await expect(exit).toBeVisible();
    await expect(exit).toBeEnabled();

    const layout = await toolbar.evaluate((el) => {
      const buttons = [...el.querySelectorAll<HTMLButtonElement>('.btn')]
        .filter((button) => button.offsetParent !== null)
        .map((button) => button.getBoundingClientRect());
      const top = Math.min(...buttons.map((rect) => rect.top));
      const bottom = Math.max(...buttons.map((rect) => rect.bottom));
      return {
        rows: new Set(buttons.map((rect) => Math.round(rect.top))).size,
        height: el.getBoundingClientRect().height,
        span: bottom - top,
      };
    });

    // All visible controls share one row, and the bar stays compact.
    expect(layout.rows, 'controls wrapped onto multiple rows').toBe(1);
    expect(layout.height, `toolbar is ${layout.height}px tall`).toBeLessThanOrEqual(72);

    // Exit is keyboard reachable and works.
    await exit.focus();
    await expect(exit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-immersive|is-fullscreen-active/);
  });

  test('restart, volume, ambient, and status live in the settings dialog', async ({ page }) => {
    await page.goto('/games/freecell/');
    await enterGameMode(page);

    await page.locator('[data-game-toolbar="settings"]').click();
    const panel = page.locator('[data-game-settings-panel]');
    await expect(panel).toBeVisible();

    // Secondary preferences are inside the dialog, not stacked above the board.
    await expect(panel.locator('[data-game-toolbar="restart-in-menu"]')).toBeVisible();
    await expect(panel.locator('[data-game-toolbar="volume"]')).toBeVisible();
    await expect(panel.locator('[data-game-toolbar="ambient"]')).toBeVisible();

    const stage = await page.locator('[data-game-viewport]').boundingBox();
    const box = await panel.boundingBox();
    expect(stage && box, 'missing boxes').toBeTruthy();
    // The dialog overlays the stage instead of pushing the board down.
    expect(box!.y).toBeGreaterThanOrEqual(stage!.y - 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(stage!.y + stage!.height + 1);

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });

  test('pause, resume, and Escape restore focus', async ({ page }) => {
    await page.goto('/games/freecell/');
    const playButton = page.locator('[data-game-play-btn]');
    await enterGameMode(page);

    const pause = page.locator('[data-game-toolbar="pause"]');
    await pause.click();
    await expect(page.locator('[data-game-viewport]')).toHaveClass(/is-paused/);
    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    await page.locator('[data-game-pause-resume]').click();
    await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-paused/);

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-game-viewport]')).not.toHaveClass(/is-immersive|is-fullscreen-active/);
    // Focus returns to the control that launched Game Mode.
    await expect(playButton).toBeFocused();
  });
});
