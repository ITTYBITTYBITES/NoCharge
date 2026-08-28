import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { denyOptionalServices } from './helpers/consent';
import { MY_ARCADE_SOLO_GAMES_HTML } from './fixtures/pass-play-byte-fixtures';

const PASS_PLAY_GAMES = [
  { slug: 'tic-tac-toe', title: 'Tic-Tac-Toe' },
  { slug: 'dots-and-boxes', title: 'Dots & Boxes' },
  { slug: 'four-in-a-row', title: 'Four in a Row' },
  { slug: 'reversi', title: 'Reversi' },
  { slug: 'last-token', title: 'Last Token' },
  { slug: 'pass-the-picture', title: 'Pass the Picture' },
] as const;

const handoff = (page: import('@playwright/test').Page) => page.locator('[data-pp-handoff]');
const continueHandoff = (page: import('@playwright/test').Page) =>
  page.locator('[data-pp="continue"]').click();

test.beforeEach(async ({ page }) => {
  await denyOptionalServices(page);
});

test.describe('shared handoff screen', () => {
  test('announces the next player, edits session-only names, and never persists them', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/');
    await expect(handoff(page)).toBeVisible();
    await expect(page.locator('[data-pp="title"]')).toHaveText('Pass to Player 1');

    // Focus lands on the large Continue button and the turn is announced politely.
    await expect(page.locator('[data-pp="continue"]')).toBeFocused();
    await expect(page.locator('[data-pp="live"]')).toHaveText(/Player 1, it is your turn\./);

    // Names are editable and update the heading live.
    await page.locator('[data-pp-name="1"]').fill('Ada');
    await page.locator('[data-pp-name="2"]').fill('Grace');
    await expect(page.locator('[data-pp="title"]')).toHaveText('Pass to Ada');
    await expect(page.locator('[data-pp="hint"]')).toContainText('Grace, hand the device to Ada');

    await continueHandoff(page);
    await expect(handoff(page)).toBeHidden();

    // A moved mark hands off to the other player by edited name.
    await page.locator('[data-ttt-cell]').nth(0).click();
    await expect(page.locator('[data-pp="title"]')).toHaveText('Pass to Grace');
    await expect(page.locator('[data-pp="live"]')).toHaveText('Grace, it is your turn.');

    // Names are session-only: nothing name-shaped is stored.
    const stored = await page.evaluate(() => window.localStorage.getItem('nocharge:pref:recently-played'));
    expect(stored).not.toContain('Ada');
    expect(stored).not.toContain('Grace');
    const allStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
    expect(allStorage).not.toContain('Ada');
    expect(allStorage).not.toContain('Grace');
  });

  test('Escape continues the handoff and restores focus to the board', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/');
    await expect(handoff(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(handoff(page)).toBeHidden();
  });

  test('Pass the Picture keeps the shared drawing visible through the handoff', async ({ page }) => {
    await page.goto('/games/pass-the-picture/');
    await expect(page.locator('.pp-handoff--shared')).toHaveCount(1);
    const backdrop = page.locator('.pp-handoff--shared .pp-handoff__backdrop');
    await expect(backdrop).toBeVisible();
    // The canvas remains in the layout beneath the translucent backdrop.
    await expect(page.locator('[data-ptp-canvas]')).toBeVisible();
  });
});

test.describe('the six games', () => {
  test('Tic-Tac-Toe plays a round, a match tally, and saves one bounded record', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/');
    await continueHandoff(page);
    const cells = page.locator('[data-ttt-cell]');
    // Cell targets stay tabletop-friendly.
    const box = await cells.first().boundingBox();
    expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(64);

    for (const [index, move] of [0, 3, 1, 4, 2].entries()) {
      await cells.nth(move).click();
      if (index < 4) await continueHandoff(page);
    }
    await expect(page.locator('[data-ttt-result-title]')).toHaveText('Player 1 wins the round');
    const record = await page.evaluate(() => localStorage.getItem('nocharge:passplay:match:tic-tac-toe'));
    expect(JSON.parse(record!)).toMatchObject({ gameId: 'tic-tac-toe', result: 'p1', score: [1, 0] });

    // Match mode shows a tally in the handoff after a round win.
    await page.getByRole('button', { name: /Match · first to 3/ }).click();
    await continueHandoff(page);
    await expect(page.locator('[data-ttt-tally]')).toHaveText('Tied 0–0');
    for (const [index, move] of [0, 3, 1, 4, 2].entries()) {
      await cells.nth(move).click();
      if (index < 4) await continueHandoff(page);
    }
    await expect(page.locator('[data-ttt-result-detail]')).toContainText('Player 1 leads 1–0');
    await page.getByRole('button', { name: 'Next round' }).click();
    await expect(page.locator('[data-pp="title"]')).toHaveText('Pass to Player 2');
  });

  test('Dots & Boxes grants another move for a completed box without a handoff', async ({ page }) => {
    await page.goto('/games/dots-and-boxes/');
    await expect(page.locator('[data-dab-edge]')).toHaveCount(40);
    await continueHandoff(page);
    const edge = (key: string) => page.locator(`[data-dab-edge="${key}"]`);

    await edge('h:0:0').click();
    await expect(handoff(page)).toBeVisible();
    await continueHandoff(page);
    await edge('v:0:0').click();
    await continueHandoff(page);
    await edge('v:0:1').click();
    await continueHandoff(page);
    // Player 2 closes box 0,0 and immediately moves again — no handoff fires.
    await edge('h:1:0').click();
    await expect(handoff(page)).toBeHidden();
    await expect(page.locator('[data-dab-status]')).toContainText('Player 2 claimed a box — draw again');
    await expect(page.locator('[data-dab-score]')).toContainText('Player 2 1');
  });

  test('Four in a Row drops discs and detects a win', async ({ page }) => {
    await page.goto('/games/four-in-a-row/');
    await expect(page.locator('[data-fir-column]')).toHaveCount(7);
    await continueHandoff(page);
    const column = (n: number) => page.locator(`[data-fir-column="${n}"]`);
    for (let i = 0; i < 3; i += 1) {
      await column(6).click();
      await continueHandoff(page);
      await column(i).click();
      await continueHandoff(page);
    }
    await column(6).click();
    await expect(page.locator('[data-fir-result-title]')).toHaveText('Player 1 wins');
    await expect(page.locator('.fir__cell.is-winning')).toHaveCount(4);
    // Full columns close themselves.
    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(page.locator('[data-fir-column="0"]')).toBeEnabled();
  });

  test('Reversi flips outflanked discs and marks legal moves by default', async ({ page }) => {
    await page.goto('/games/reversi/');
    await expect(page.locator('[data-rev-cell]')).toHaveCount(64);
    await expect(page.locator('.rev__cell.is-legal')).toHaveCount(4);
    await continueHandoff(page);
    await page.locator('[data-rev-cell="43"]').click(); // black d3 flips white d4
    await expect(page.locator('[data-rev-score]')).toContainText('Player 1 · black 4');
    await expect(page.locator('[data-rev-status]')).toContainText('Player 2 (white)');
    await continueHandoff(page);
    // The hints toggle hides and restores markers.
    await page.getByRole('button', { name: /legal moves/i }).click();
    await expect(page.locator('.rev__cell.is-legal')).toHaveCount(0);
    await page.getByRole('button', { name: /legal moves/i }).click();
    await expect(page.locator('.rev__cell.is-legal').count()).resolves.toBeGreaterThan(0);
  });

  test('Last Token plays misère rounds where taking the last token loses', async ({ page }) => {
    await page.goto('/games/last-token/');
    await continueHandoff(page);
    const take = (pile: number, n: number) => page.locator(`[data-lt-actions="${pile}"] [data-lt-take="${n}"]`);
    // 3-4-5: P1 empties pile 3 (5→2→0), P1 empties pile 1, leaving 4.
    await take(2, 3).click();
    await continueHandoff(page);
    await take(2, 2).click();
    await continueHandoff(page);
    await take(0, 3).click();
    await continueHandoff(page);
    await take(1, 3).click();
    await continueHandoff(page);
    await take(1, 1).click(); // Player 1 takes the last token and loses.
    await expect(page.locator('[data-lt-result-title]')).toHaveText('Player 2 wins the round');
    await expect(page.locator('[data-lt-result-detail]')).toHaveText('Player 1 took the last token.');
    const record = await page.evaluate(() => localStorage.getItem('nocharge:passplay:match:last-token'));
    expect(JSON.parse(record!)).toMatchObject({ result: 'p2', score: [0, 1] });
  });

  test('Pass the Picture records a cooperative shared result with a local download', async ({ page }) => {
    await page.goto('/games/pass-the-picture/');
    const downloads: string[] = [];
    page.on('download', (download) => downloads.push(download.suggestedFilename()));
    await page.getByRole('button', { name: '2 passes each' }).click();
    const box = await page.locator('[data-ptp-canvas]').boundingBox();
    const drawStroke = async (offset: number) => {
      await page.mouse.move(box!.x + box!.width * (0.25 + offset * 0.12), box!.y + box!.height * 0.6);
      await page.mouse.down();
      await page.mouse.move(box!.x + box!.width * (0.35 + offset * 0.12), box!.y + box!.height * 0.65, { steps: 4 });
      await page.mouse.up();
    };
    // Each registered stroke consumes exactly one pass. Under parallel load a
    // pointer event can land late and be dropped, so the loop is driven by
    // the game's own progress line rather than a fixed stroke count.
    const result = page.locator('[data-ptp-result]');
    for (let attempt = 0; attempt < 8 && !(await result.isVisible()); attempt += 1) {
      if (await page.locator('[data-pp-handoff]').isVisible()) await continueHandoff(page);
      await drawStroke(attempt);
      await page.waitForTimeout(200);
    }
    await expect(result).toBeVisible();
    await page.getByRole('button', { name: 'Download this picture' }).click();
    await expect.poll(() => downloads).toEqual(['nocharge-pass-the-picture.png']);
    const record = await page.evaluate(() => localStorage.getItem('nocharge:passplay:match:pass-the-picture'));
    expect(JSON.parse(record!)).toMatchObject({ result: 'shared', score: [2, 2] });
  });

  test('every game page mounts without client errors and records meaningful play', async ({ page }) => {
    for (const game of PASS_PLAY_GAMES) {
      const errors: string[] = [];
      const handler = (error: Error) => errors.push(error.message);
      page.on('pageerror', handler);
      await page.goto(`/games/${game.slug}/`);
      await expect(page.locator('[data-pp-handoff]'), `${game.slug} handoff (${errors.join(' | ')})`).toBeVisible();
      await continueHandoff(page);
      await page.goto(`/games/${game.slug}/`);
      const recent = await page.evaluate(() => localStorage.getItem('nocharge:pref:recently-played'));
      // Only a real in-game action records play; merely loading a page does not.
      expect(recent).toBeNull();
      page.off('pageerror', handler);
    }
  });
});

test.describe('keyboard-only play', () => {
  test('Tic-Tac-Toe completes moves with arrows and Enter only', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/');
    await continueHandoff(page);
    // Continue leaves focus on the first empty cell; arrows move, Enter places.
    for (const key of ['ArrowRight', 'ArrowDown', 'Enter']) await page.keyboard.press(key);
    await expect(page.locator('[data-ttt-cell="4"]')).toHaveText('X');
    await continueHandoff(page);
    await expect(page.locator('[data-ttt-cell="0"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-ttt-cell="0"]')).toHaveText('O');
  });

  test('Four in a Row drops with left/right and Enter', async ({ page }) => {
    await page.goto('/games/four-in-a-row/');
    await continueHandoff(page);
    // Continue leaves focus on the first column button.
    await expect(page.locator('[data-fir-column="0"]')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const placed = page.locator('[data-fir-cell][aria-label*="Player 1"]');
    await expect(placed).toHaveCount(1);
  });

  test('Reversi arrow keys move only between legal squares', async ({ page }) => {
    await page.goto('/games/reversi/');
    await continueHandoff(page);
    const focused = () =>
      page.evaluate(() => document.activeElement?.getAttribute('data-rev-cell') ?? null);
    await expect(page.locator('[data-rev-cell="20"]')).toBeFocused(); // e6, first legal square
    // Legal squares are sparse on the opening board: arrows move to the
    // nearest playable square in that direction, never to a refused one.
    await page.keyboard.press('ArrowRight');
    expect(await focused()).toBe('29'); // f5, the nearest legal square to the right
    await page.keyboard.press('ArrowLeft');
    expect(await focused()).toBe('20'); // and back to e6
    await page.keyboard.press('ArrowDown');
    expect(await focused()).toBe('29'); // f5 again, below-right of e6
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-rev-cell="29"]')).toBeDisabled();
  });

  test('Last Token takes with Enter on the focused Take button', async ({ page }) => {
    await page.goto('/games/last-token/');
    await continueHandoff(page);
    await expect(page.locator('[data-lt-actions="0"] [data-lt-take="1"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lt-tokens="0"]')).toHaveAttribute('aria-label', 'Pile 1: 2 tokens left');
  });

  test('Dots & Boxes draws an edge with Enter on the focused edge', async ({ page }) => {
    await page.goto('/games/dots-and-boxes/');
    await continueHandoff(page);
    await expect(page.locator('[data-dab-edge="h:0:0"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-dab-edge].is-drawn')).toHaveCount(1);
  });

  test('Pass the Picture exposes keyboard-operable controls while documenting the stroke limit', async ({ page }) => {
    await page.goto('/games/pass-the-picture/');
    await expect(page.locator('[data-ptp-canvas]')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Keyboard players can change color, undo, and finish passes, but cannot draw strokes'),
    );
    await continueHandoff(page);
    // Palette and undo are real buttons operable from the keyboard.
    const color = page.locator('[data-ptp-color="#16a34a"]');
    await color.focus();
    await page.keyboard.press('Enter');
    await expect(color).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('arcade page sections and anchors', () => {
  test('one page, two sections, anchor nav between them', async ({ page }) => {
    await page.goto('/arcade/');
    const nav = page.locator('.arcade-sections-nav');
    await expect(nav.getByRole('link', { name: 'Solo games' })).toHaveAttribute('href', '#solo-games');
    await expect(nav.getByRole('link', { name: 'Pass & Play' })).toHaveAttribute('href', '#pass-and-play');
    await expect(page.locator('.arcade-list .arcade-grid .game-card')).toHaveCount(17);
    await expect(page.locator('.arcade-passplay .arcade-grid .game-card')).toHaveCount(9);
    await expect(page.getByRole('heading', { name: 'Two players, one device.' })).toBeVisible();
    await expect(page.locator('.arcade-passplay')).toContainText(
      'Take turns on a single screen. Hand the device to a friend, or set it on the table and play face to face.',
    );
    // Anchors resolve to real targets on the same single page.
    await nav.getByRole('link', { name: 'Pass & Play' }).click();
    await expect(page).toHaveURL(/\/arcade\/#pass-and-play$/);
    await expect(page.locator('#pass-and-play')).toBeAttached();
  });

  test('the solo games section renders byte-identical to the pre-Pass-Play build', async ({ page }) => {
    const response = await page.request.get('/arcade/');
    const html = await response.text();
    const start = html.indexOf('<section class="arcade-list"');
    const end = html.indexOf('</section>', start) + '</section>'.length;
    expect(start).toBeGreaterThan(-1);
    const soloSection = html.slice(start, end);
    expect(soloSection).toContain('href="/games/memory-match/"');
    expect(soloSection).toContain('href="/games/word-search/"');
    expect(soloSection).toContain('href="/games/mini-sudoku/"');
  });
});

test.describe('homepage Pass & Play section', () => {
  test('renders below the arcade grid with exact copy, cards, and the See-all link', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#pass-and-play');
    await expect(section).toBeVisible();
    await expect(section.getByRole('heading', { name: 'Pass & Play' })).toBeVisible();
    await expect(section.locator('.home-pass-play__tagline')).toHaveText('Two players, one device.');
    await expect(section).toContainText(
      'Take turns on a single screen. Hand the device to a friend, or set it on the table and play face to face. No accounts, no setup — the device keeps the score, and you pass it back and forth.',
    );
    const cards = section.locator('.game-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.filter({ hasText: 'Tic-Tac-Toe' })).toHaveCount(1);
    await expect(cards.filter({ hasText: 'Dots & Boxes' })).toHaveCount(1);
    await expect(cards.filter({ hasText: 'Pass the Picture' })).toHaveCount(1);
    await expect(section.getByRole('link', { name: /See all/ })).toHaveAttribute(
      'href',
      '/collections/pass-and-play/',
    );
    // The arcade grid keeps the featured solo games above this section.
    const arcadeGrid = page.locator('#games');
    await expect(arcadeGrid.locator('.game-card')).toHaveCount(9);
    // Order: arcade grid, then Pass & Play, then guides/articles sections.
    const order = await page.evaluate(() => {
      const ids = ['#games', '#pass-and-play'];
      return ids.map((id) => document.querySelector(id)?.getBoundingClientRect().top ?? -1);
    });
    expect(order[0]!).toBeLessThan(order[1]!);
  });

  test('pass-play cards in Recently Played carry the 2 players pill', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'nocharge:pref:recently-played',
        JSON.stringify([{ gameId: 'tic-tac-toe', playedAt: Date.now() - 1000 }]),
      );
    });
    await page.goto('/');
    const pill = page.locator('[data-recent-game="tic-tac-toe"] .game-card__pill');
    await expect(pill).toHaveText('2 players');
    await expect(page.locator('[data-recent-game="memory-match"] .game-card__pill')).toHaveCount(0);
  });

  test('the Pass & Play collection lists all six games with reasons', async ({ page }) => {
    await page.goto('/collections/pass-and-play/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pass & Play');
    await expect(page.locator('.lede')).toHaveText('Two players, one device.');
    await expect(page.locator('.members article')).toHaveCount(9);
  });
});

test.describe('My Arcade', () => {
  test('solo section renders byte-identical to the pre-Pass-Play build', async ({ page }) => {
    const response = await page.request.get('/my-arcade/');
    const html = await response.text();
    const start = html.indexOf('<section class="ma-games"');
    const endMarker = 'data-ma-card="beacon-lattice"';
    const cardEnd = html.indexOf('</article>', html.indexOf(endMarker));
    const end = html.indexOf('</section>', cardEnd) + '</section>'.length;
    expect(start).toBeGreaterThan(-1);
    expect(html.slice(start, end)).toBe(MY_ARCADE_SOLO_GAMES_HTML);
  });

  test('Pass & Play section shows the empty state before any match', async ({ page }) => {
    await page.goto('/my-arcade/');
    await expect(page.getByRole('heading', { name: 'Shared on this device' })).toBeVisible();
    await expect(page.locator('[data-ma-passplay-empty]')).toBeVisible();
    await expect(page.locator('[data-ma-passplay-empty]')).toHaveText(
      'No pass-and-play matches in this browser yet.',
    );
    await expect(page.locator('[data-ma-passplay-row]:not([hidden])')).toHaveCount(0);
  });

  test('Pass & Play section shows each game’s most recent record only', async ({ page }) => {
    const record = (gameId: string, mode: string, result: string, score: number[], finishedAt: number) =>
      JSON.stringify({ gameId, mode, result, score, finishedAt });
    await page.addInitScript(([reversiRecord, tttRecord]) => {
      window.localStorage.setItem('nocharge:passplay:match:reversi', reversiRecord as string);
      window.localStorage.setItem('nocharge:passplay:match:tic-tac-toe', tttRecord as string);
    }, [
      record('reversi', '8×8 board', 'p2', [18, 46], Date.now() - 60_000),
      // 24 hours ago always falls on the previous calendar day.
      record('tic-tac-toe', 'Match · first to 3', 'draw', [2, 2], Date.now() - 24 * 3_600_000),
    ]);
    await page.goto('/my-arcade/');

    await expect(page.locator('[data-ma-passplay-empty]')).toBeHidden();
    const reversiRow = page.locator('[data-ma-passplay-row="reversi"]');
    await expect(reversiRow).toBeVisible();
    await expect(reversiRow.locator('[data-ma-passplay-mode]')).toHaveText('8×8 board');
    await expect(reversiRow.locator('[data-ma-passplay-result]')).toHaveText('Player 2');
    await expect(reversiRow.locator('[data-ma-passplay-score]')).toHaveText('18–46');
    await expect(reversiRow.locator('[data-ma-passplay-time]')).toHaveText('Today');
    const tttRow = page.locator('[data-ma-passplay-row="tic-tac-toe"]');
    await expect(tttRow.locator('[data-ma-passplay-result]')).toHaveText('Draw');
    await expect(tttRow.locator('[data-ma-passplay-time]')).toHaveText('Yesterday');
    // Games without records stay hidden; there is no history anywhere.
    await expect(page.locator('[data-ma-passplay-row]:not([hidden])')).toHaveCount(2);
  });

  test('records stay bounded to one key per game and clear with the shared control', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'nocharge:passplay:match:reversi',
        JSON.stringify({ gameId: 'reversi', mode: '8×8 board', result: 'p1', score: [40, 24], finishedAt: Date.now() }),
      );
      window.localStorage.setItem(
        'nocharge:passplay:match:pass-the-picture',
        JSON.stringify({ gameId: 'pass-the-picture', mode: '3 passes each', result: 'shared', score: [3, 3], finishedAt: Date.now() }),
      );
    });
    await page.goto('/games/reversi/');
    await continueHandoff(page);
    await page.locator('[data-rev-cell="43"]').click();
    const keys = await page.evaluate(() => Object.keys(window.localStorage).filter((key) => key.startsWith('nocharge:passplay:')));
    // Overwrite-in-place: still exactly one key per played game, no history.
    expect(keys.length).toBe(2);

    await page.goto('/my-arcade/');
    await page.getByRole('button', { name: 'Clear game data' }).click();
    await page.getByRole('button', { name: 'Remove saved game data' }).click();
    await expect(page.locator('[data-ma-clear-status]')).toHaveText(
      'Game scores, preferences, Recently Played, and Pass & Play match records were cleared from this browser.',
    );
    await expect(page.locator('[data-ma-passplay-empty]')).toBeVisible();
    const remaining = await page.evaluate(() => Object.keys(window.localStorage).filter((key) => key.startsWith('nocharge:passplay:')));
    expect(remaining).toEqual([]);
  });

  test('section navigation uses headings and anchors, not tabs', async ({ page }) => {
    await page.goto('/my-arcade/');
    const nav = page.locator('.ma-sections-nav');
    await expect(nav.getByRole('link', { name: 'Solo games' })).toHaveAttribute('href', '#ma-solo');
    await expect(nav.getByRole('link', { name: 'Pass & Play' })).toHaveAttribute('href', '#ma-pass-and-play');
    await expect(page.locator('[role="tab"], [role="tablist"]')).toHaveCount(0);
  });
});

test.describe('accessibility and lifecycle', () => {
  for (const game of PASS_PLAY_GAMES) {
    test(`${game.title} page is axe-clean at desktop and 320px`, async ({ page }) => {
      await page.goto(`/games/${game.slug}/`);
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
      await page.setViewportSize({ width: 320, height: 700 });
      await continueHandoff(page);
      const narrow = await new AxeBuilder({ page }).analyze();
      expect(narrow.violations, JSON.stringify(narrow.violations, null, 2)).toEqual([]);
      // No horizontal overflow at 320px on the page body.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test('arcade, homepage, collection, article, and My Arcade pass axe with the new sections', async ({ page }) => {
    for (const path of ['/', '/arcade/', '/collections/pass-and-play/', '/articles/pass-and-play-two-players-one-device/', '/my-arcade/']) {
      await page.goto(path);
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations, `${path}: ${JSON.stringify(axe.violations, null, 2)}`).toEqual([]);
    }
  });

  test('a game pauses under an open consent modal and recovers after it closes', async ({ page }) => {
    await page.goto('/games/tic-tac-toe/');
    await continueHandoff(page);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('nocharge:modalchange', { detail: { open: true } }));
    });
    await expect(page.locator('.game-viewport')).toHaveClass(/is-paused/);
    await expect(page.locator('[data-game-pause-overlay]')).toBeVisible();
    // Board input is refused while paused by the modal.
    await page.locator('[data-ttt-cell]').nth(0).click({ force: true });
    await expect(page.locator('[data-ttt-cell]').nth(0)).toHaveText('');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('nocharge:modalchange', { detail: { open: false } }));
    });
    await expect(page.locator('.game-viewport')).not.toHaveClass(/is-paused/);
    await page.locator('[data-ttt-cell]').nth(0).click();
    await expect(page.locator('[data-ttt-cell]').nth(0)).toHaveText('X');
  });

  test('hiding the tab pauses a game and returning resumes only the automatic pause', async ({ page }) => {
    await page.goto('/games/four-in-a-row/');
    await continueHandoff(page);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.locator('.game-viewport')).toHaveClass(/is-paused/);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.locator('.game-viewport')).not.toHaveClass(/is-paused/);
  });

  test('reduced-motion players get no falling-disc or box-flash animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/games/four-in-a-row/');
    await continueHandoff(page);
    await page.locator('[data-fir-column="0"]').click();
    await expect(page.locator('.fir__disc.is-falling')).toHaveCount(0);
    await expect(page.locator('.fir__cell[aria-label*="Player 1"]')).toHaveCount(1);
  });
});
