import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

/**
 * Pass &amp; Play PR review captures. Runs only in the pull-request workflow
 * alongside the existing capture suite; screenshots are actual mounted-DOM
 * gameplay states, never manual rasterization. Uploaded with the same
 * `pr-visual-captures` artifact and reviewed in
 * docs/PASS_AND_PLAY_VISUAL_REVIEW.md.
 */
const captures = join(process.cwd(), 'artifacts', 'pr-captures');

const GAMES = [
  ['tic-tac-toe', 'Tic-Tac-Toe'],
  ['dots-and-boxes', 'Dots & Boxes'],
  ['four-in-a-row', 'Four in a Row'],
  ['reversi', 'Reversi'],
  ['last-token', 'Last Token'],
  ['pass-the-picture', 'Pass the Picture'],
] as const;

test.skip(!process.env.CAPTURE_PR, 'PR review capture artifact is generated only when requested.');
test.describe.configure({ mode: 'serial' });

/** Put one real game into a visible mid-play state for the capture. */
async function playAWhile(
  page: import('@playwright/test').Page,
  slug: string,
  onMid?: () => Promise<void>,
) {
  const continueHandoff = () => page.locator('[data-pp="continue"]').click();
  await continueHandoff();
  if (slug === 'tic-tac-toe') {
    for (const index of [0, 4, 8, 2]) {
      await page.locator('[data-ttt-cell]').nth(index).click();
      if (index !== 2) await continueHandoff();
    }
  } else if (slug === 'dots-and-boxes') {
    for (const key of ['h:0:0', 'v:0:0', 'h:1:0', 'v:0:1']) {
      await page.locator(`[data-dab-edge="${key}"]`).click();
      if (key !== 'v:0:1') await continueHandoff();
    }
  } else if (slug === 'four-in-a-row') {
    for (const column of [3, 3, 2, 2, 4]) {
      await page.locator(`[data-fir-column="${column}"]`).click();
      if (column !== 4) await continueHandoff();
    }
  } else if (slug === 'reversi') {
    await page.locator('[data-rev-cell="43"]').click();
    await continueHandoff();
    await page.locator('[data-rev-cell="26"]').click();
    // Close the resulting handoff so the board, not the dialog, is captured.
    await continueHandoff();
  } else if (slug === 'last-token') {
    await page.locator('[data-lt-actions="2"] [data-lt-take="3"]').click();
    await continueHandoff();
    await page.locator('[data-lt-actions="1"] [data-lt-take="2"]').click();
    // Close the resulting handoff so the board, not the dialog, is captured.
    await continueHandoff();
  } else if (slug === 'pass-the-picture') {
    await page.getByRole('button', { name: '2 passes each' }).click();
    await continueHandoff();
    const box = await page.locator('[data-ptp-canvas]').boundingBox();
    for (let stroke = 0; stroke < 4; stroke += 1) {
      await page.mouse.move(box!.x + box!.width * (0.28 + stroke * 0.12), box!.y + box!.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box!.x + box!.width * (0.52 + stroke * 0.1), box!.y + box!.height * 0.62, { steps: 4 });
      await page.mouse.up();
      if (stroke === 1 && onMid) await onMid();
      if (stroke < 3) await continueHandoff();
    }
  }
}

test('captures Pass & Play games, handoff, and site sections', async ({ page }) => {
  test.setTimeout(9 * 60_000);
  await mkdir(captures, { recursive: true });
  await denyOptionalServices(page);

  const shot = async (name: string, fullPage = false) => {
    await page.screenshot({ path: join(captures, `${name}.jpg`), type: 'jpeg', quality: 78, fullPage });
  };

  // Desktop gameplay: mounted boards mid-play.
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [slug] of GAMES) {
    await page.goto(`/games/${slug}/`);
    await expect(page.locator('[data-pp-handoff]')).toBeVisible();
    await shot(`desktop-${slug}-handoff`);
    // Pass the Picture: after two strokes, the shared drawing is captured
    // showing through its translucent handoff, then again at its end screen.
    await playAWhile(page, slug, () => shot('desktop-pass-the-picture-midplay-shared'));
    await shot(`desktop-${slug}-midplay`);
  }

  // The shared handoff with edited names and a live tally.
  await page.goto('/games/tic-tac-toe/');
  await page.getByRole('button', { name: /Match · first to 3/ }).click();
  await page.locator('[data-pp-name="1"]').fill('Ada');
  await page.locator('[data-pp-name="2"]').fill('Grace');
  await shot('desktop-handoff-names');

  // Site surfaces: arcade sections, homepage section, collection, article.
  await page.goto('/arcade/');
  await shot('desktop-arcade-both-sections', true);
  await page.goto('/');
  await shot('desktop-home-pass-and-play', true);
  await page.goto('/collections/pass-and-play/');
  await shot('desktop-collection-pass-and-play', true);
  await page.goto('/articles/pass-and-play-two-players-one-device/');
  await shot('desktop-article-pass-and-play', true);

  // My Arcade: both sections, empty then with representative local records.
  await page.goto('/my-arcade/');
  await shot('desktop-my-arcade-passplay-empty', true);
  await page.evaluate(() => {
    window.localStorage.setItem('nocharge:memory-match:high', '860');
    window.localStorage.setItem('nocharge:passplay:match:tic-tac-toe', JSON.stringify({ gameId: 'tic-tac-toe', mode: 'Match · first to 3', result: 'p1', score: [3, 2], finishedAt: Date.now() - 90_000 }));
    window.localStorage.setItem('nocharge:passplay:match:reversi', JSON.stringify({ gameId: 'reversi', mode: '8×8 board', result: 'draw', score: [32, 32], finishedAt: Date.now() - 86_400_000 }));
    window.localStorage.setItem('nocharge:passplay:match:pass-the-picture', JSON.stringify({ gameId: 'pass-the-picture', mode: '3 passes each', result: 'shared', score: [3, 3], finishedAt: Date.now() - 172_800_000 }));
  });
  await page.reload();
  await shot('desktop-my-arcade-both-sections-populated', true);

  // Mobile and narrow-mobile reflow.
  for (const [prefix, width, height] of [
    ['mobile', 390, 844],
    ['mobile-320', 320, 760],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/arcade/');
    await shot(`${prefix}-arcade-both-sections`, true);
    await page.goto('/games/tic-tac-toe/');
    await expect(page.locator('[data-pp-handoff]')).toBeVisible();
    await shot(`${prefix}-tic-tac-toe-handoff`);
    await playAWhile(page, 'tic-tac-toe');
    await shot(`${prefix}-tic-tac-toe-midplay`);
    await page.goto('/games/dots-and-boxes/');
    await page.getByRole('button', { name: '6×6 · 36 boxes' }).click();
    await expect(page.locator('[data-pp-handoff]')).toBeVisible();
    await shot(`${prefix}-dots-and-boxes-6x6-handoff`);
    await page.goto('/games/pass-the-picture/');
    await shot(`${prefix}-pass-the-picture-handoff-shared`);
    await page.goto('/my-arcade/');
    await shot(`${prefix}-my-arcade-passplay-records`, true);
  }

  // 200%-equivalent reflow (viewport halved) and reduced motion.
  await page.setViewportSize({ width: 640, height: 512 });
  await page.goto('/games/four-in-a-row/');
  await expect(page.locator('[data-pp-handoff]')).toBeVisible();
  await shot('zoom-200-four-in-a-row-handoff');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/games/reversi/');
  await expect(page.locator('[data-pp-handoff]')).toBeVisible();
  await shot('reduced-motion-reversi');
});
