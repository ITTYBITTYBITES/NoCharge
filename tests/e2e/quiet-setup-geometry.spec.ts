import { expect, test, type Page } from '@playwright/test';

import { denyOptionalServices } from './helpers/consent';

/**
 * Geometry-based Quiet Setup regression checks.
 *
 * The previous suite only asserted that `document.scrollWidth` never exceeded
 * `clientWidth`. A page can satisfy that while badges overlap each other,
 * metadata runs into a heading, a value column collapses to one word per line,
 * or a card clips its own focus ring. These tests read real
 * `getBoundingClientRect()` values from the mounted DOM and fail on positive
 * overlap area between separate visual blocks.
 *
 * Tolerances are deliberate and documented rather than pixel-perfect:
 * sub-pixel layout rounding is ignored, and containment allows a small
 * outward bleed for antialiasing.
 */

const SLUGS = [
  'what-quiet-setup-means',
  'mouse-trackpad-trackball-or-touch',
  'choosing-a-compact-keyboard-layout',
  'quiet-keyboard-switches-explained',
  'choosing-a-tablet-or-phone-stand',
  'browser-zoom-versus-a-larger-display',
  'choosing-an-offline-logic-puzzle-book',
  'a-low-noise-desk-setup',
] as const;

const AFFILIATE_SLUGS = [
  'mouse-trackpad-trackball-or-touch',
  'choosing-a-compact-keyboard-layout',
  'quiet-keyboard-switches-explained',
  'choosing-a-tablet-or-phone-stand',
  'choosing-an-offline-logic-puzzle-book',
] as const;

/** Sub-pixel layout rounding only. Anything larger is a real collision. */
const OVERLAP_TOLERANCE_PX = 0.75;
/** Antialiasing / outline bleed allowance for containment checks. */
const CONTAINMENT_TOLERANCE_PX = 1.5;

type Box = { label: string; x: number; y: number; width: number; height: number };

/** Read labelled boxes for every match of a selector inside an optional root. */
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

/** Fail when two separate visual blocks share a positive-area intersection. */
function expectNoPairwiseOverlap(items: Box[], context: string) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const area = overlapArea(items[i], items[j]);
      expect(
        area,
        `${context}: "${items[i].label}" overlaps "${items[j].label}" by ${area.toFixed(1)}px²`,
      ).toBe(0);
    }
  }
}

/** Fail when a child escapes the panel that is supposed to contain it. */
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

/**
 * Emulate a zoom level the way a reflow reviewer would: the reference screen
 * size divided by the zoom factor, as an equivalent CSS-pixel viewport.
 * 1280x1024 at 400% is the WCAG 1.4.10 reference condition (320x256 CSS px).
 *
 * The CSS `zoom` property is deliberately NOT used as the gate here. Media
 * queries are evaluated against the viewport and are unaffected by `zoom`, so
 * `documentElement.style.zoom = '4'` renders a scaled *desktop* layout instead
 * of reflowing — measured on this page it keeps the >=52rem two-column
 * `.method` and hero rules active inside a 288px column. That is exactly the
 * "larger clipped desktop layout" this suite has to rule out, so reflow is
 * asserted at the equivalent viewport, where the breakpoints really fire.
 */
async function setZoomEquivalentViewport(page: Page, screenWidth: number, screenHeight: number, factor: number) {
  await page.setViewportSize({
    width: Math.round(screenWidth / factor),
    height: Math.round(screenHeight / factor),
  });
}

async function loadAllImages(page: Page) {
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll('img')) img.loading = 'eager';
    await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))));
  });
}

test.beforeEach(async ({ page }) => denyOptionalServices(page));

test.describe('Quiet Setup card geometry', () => {
  for (const width of [1440, 1024, 768, 390, 360, 320]) {
    test(`setup cards keep metadata, badges and dates apart at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/setup/');
      await loadAllImages(page);

      const cardCount = await page.locator('[data-setup-card]').count();
      expect(cardCount).toBeGreaterThanOrEqual(30);

      for (let index = 0; index < cardCount; index += 1) {
        const root = `[data-setup-card]:nth-of-type(${index + 1})`;
        const context = `${width}px card ${index + 1}`;
        const card = (await boxes(page, '[data-setup-card]'))[index];

        // Evidence label vs. "Contains paid links", and both vs. the dates.
        const chips = await boxes(page, '.setup-card__labels > *', root);
        expectNoPairwiseOverlap(chips, `${context} badges`);

        const dates = await boxes(page, '.setup-card__dates > span', root);
        expectNoPairwiseOverlap(dates, `${context} dates`);
        expectNoPairwiseOverlap([...chips, ...dates], `${context} badges vs dates`);

        // Topic label vs. heading vs. description vs. badge row vs. date row.
        const blocks = await boxes(
          page,
          '.setup-card__topic, .setup-card__title, .setup-card__description, .setup-card__labels, .setup-card__dates',
          root,
        );
        expectNoPairwiseOverlap(blocks, `${context} stacked blocks`);

        // Heading must not sit on top of the artwork.
        const art = await boxes(page, '.setup-artwork', root);
        expectNoPairwiseOverlap([...art, ...blocks], `${context} artwork vs text`);

        // Every visible text block stays inside its own card.
        for (const block of [...blocks, ...chips, ...dates]) expectContained(block, card, context);

        // Cards never collapse below a usable content width.
        expect(card.width, `${context}: card is only ${card.width.toFixed(0)}px wide`).toBeGreaterThanOrEqual(272);

        // No description column narrow enough to produce one-word lines.
        const description = blocks.find((b) => b.label.includes('setup-card__description'));
        expect(description!.width, `${context}: description column is ${description!.width.toFixed(0)}px`)
          .toBeGreaterThanOrEqual(200);
      }
    });
  }

  test('setup cards never clip their own content or focus ring', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/setup/');

    // `overflow: hidden` on a card crops the title link's focus outline.
    const clipping = await page.evaluate(() =>
      [...document.querySelectorAll('[data-setup-card]')].filter((card) => {
        const style = getComputedStyle(card);
        return style.overflowX === 'hidden' || style.overflowY === 'hidden';
      }).length,
    );
    expect(clipping, 'a setup card clips overflow, which crops focus outlines').toBe(0);

    // Nothing inside a card is scrolled out of view by a hidden overflow box.
    const hiddenText = await page.evaluate(() =>
      [...document.querySelectorAll('[data-setup-card]')].filter(
        (card) => card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1,
      ).length,
    );
    expect(hiddenText, 'a setup card hides text behind its own overflow box').toBe(0);

    // The focused title link's outline stays inside the visible page.
    const link = page.locator('[data-setup-card] .setup-card__title a').first();
    await link.focus();
    const visible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const ring = parseFloat(style.outlineWidth || '0') + parseFloat(style.outlineOffset || '0');
      return { left: r.left - ring, right: r.right + ring, docWidth: document.documentElement.clientWidth };
    });
    expect(visible.left).toBeGreaterThanOrEqual(-CONTAINMENT_TOLERANCE_PX);
    expect(visible.right).toBeLessThanOrEqual(visible.docWidth + CONTAINMENT_TOLERANCE_PX);
  });

  test('cards expose exactly one honest link target and never fake a clickable badge', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/setup/');

    // No full-card pseudo-element overlay: the point at the centre of the
    // evidence chip must resolve to the chip, not to the card's link.
    const hits = await page.evaluate(() =>
      [...document.querySelectorAll('[data-setup-card]')].map((card) => {
        card.scrollIntoView({ block: 'center' });
        const hitLink = (target: Element | null) => {
          if (!target) return 'missing';
          const r = target.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          if (!hit) return 'offscreen';
          return hit.closest('a') ? 'link' : 'not-a-link';
        };
        return {
          chip: hitLink(card.querySelector('[data-evidence-label]')),
          dates: hitLink(card.querySelector('.setup-card__dates')),
          links: card.querySelectorAll('a').length,
        };
      }),
    );
    for (const hit of hits) {
      expect(hit.chip, 'the evidence badge is covered by a card link overlay').toBe('not-a-link');
      expect(hit.dates, 'the published/reviewed dates are covered by a card link overlay').toBe('not-a-link');
      expect(hit.links, 'a setup card should expose exactly one link').toBe(1);
    }
  });
});

test.describe('Quiet Setup article geometry', () => {
  for (const slug of SLUGS) {
    test(`${slug} keeps header metadata, hero and navigation apart`, async ({ page }) => {
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/setup/${slug}/`);
        await loadAllImages(page);
        const context = `${slug} @ ${width}px`;

        // Published vs. reviewed date, evidence label vs. paid-link label,
        // and dates vs. badges.
        const dates = await boxes(page, '.article-meta__dates > span');
        const labels = await boxes(page, '.article-meta__labels > *');
        expectNoPairwiseOverlap(dates, `${context} dates`);
        expectNoPairwiseOverlap(labels, `${context} badges`);
        expectNoPairwiseOverlap([...dates, ...labels], `${context} dates vs badges`);

        // Eyebrow / heading / lede / metadata / hero artwork.
        const header = await boxes(
          page,
          '.setup-article > header .eyebrow, .setup-article > header h1, .setup-article > header .lede, .article-meta',
        );
        expectNoPairwiseOverlap(header, `${context} header stack`);

        const hero = await boxes(page, '.setup-article > .setup-artwork');
        expect(hero).toHaveLength(1);
        expectNoPairwiseOverlap([...header, ...hero], `${context} header vs hero`);

        // The hero keeps a real 16:9 box — the ratio a mis-styled inline
        // <picture> silently loses.
        expect(hero[0].width / hero[0].height).toBeCloseTo(16 / 9, 1);

        // Bottom navigation links never touch each other.
        const next = await boxes(page, '.article-next a');
        expectNoPairwiseOverlap(next, `${context} article-next links`);

        // Footer navigation and consent controls stay clear of setup content.
        const article = (await boxes(page, '.setup-article'))[0];
        const footerParts = await boxes(page, '.site-footer__identity, .footer-groups, .footer-controls');
        expectNoPairwiseOverlap(footerParts, `${context} footer blocks`);
        for (const part of footerParts) {
          expect(overlapArea(article, part), `${context}: footer overlaps setup content`).toBe(0);
        }

        // No display advertisement anywhere on a Setup route.
        await expect(page.locator('[data-ad-banner]')).toHaveCount(0);
      }
    });
  }

  for (const slug of AFFILIATE_SLUGS) {
    test(`${slug} keeps its disclosure and paid recommendation legible`, async ({ page }) => {
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/setup/${slug}/`);
        await loadAllImages(page);
        const context = `${slug} @ ${width}px`;

        // The disclosure is visible and physically above the first paid link.
        const disclosure = (await boxes(page, '[data-affiliate-disclosure]'))[0];
        const firstPaid = (await boxes(page, '[data-amazon-paid-link]'))[0];
        expect(disclosure, `${context}: no affiliate disclosure`).toBeTruthy();
        expect(
          disclosure.y + disclosure.height,
          `${context}: disclosure does not appear above the first paid link`,
        ).toBeLessThanOrEqual(firstPaid.y + CONTAINMENT_TOLERANCE_PX);

        // The disclosure is a separate block: it may not intersect the hero,
        // the prose, or the paid-links section.
        const neighbours = await boxes(page, '.setup-article > .setup-artwork, .setup-prose, .paid-links');
        for (const neighbour of neighbours) {
          expect(overlapArea(disclosure, neighbour), `${context}: disclosure overlaps a neighbouring section`).toBe(0);
        }

        // Its paragraphs stay inside the bordered panel and clear of the edge.
        const paragraphs = await boxes(page, '[data-affiliate-disclosure] p');
        expect(paragraphs.length).toBe(3);
        expectNoPairwiseOverlap(paragraphs, `${context} disclosure paragraphs`);
        for (const paragraph of paragraphs) {
          expectContained(paragraph, disclosure, `${context} disclosure`);
          expect(paragraph.x - disclosure.x, `${context}: disclosure text touches its border`).toBeGreaterThanOrEqual(8);
        }

        // Paid recommendation: button, terms and descriptions all separate.
        const blockCount = await page.locator('[data-paid-recommendation]').count();
        for (let index = 0; index < blockCount; index += 1) {
          const root = `[data-paid-recommendation]:nth-of-type(${index + 1})`;
          const block = (await boxes(page, '[data-paid-recommendation]'))[index];
          const link = await boxes(page, '[data-amazon-paid-link]', root);
          const rows = await boxes(page, 'dl > div', root);
          expectNoPairwiseOverlap([...link, ...rows], `${context} paid block ${index + 1}`);

          for (let row = 0; row < rows.length; row += 1) {
            const term = (await boxes(page, `dl > div:nth-of-type(${row + 1}) dt`, root))[0];
            const value = (await boxes(page, `dl > div:nth-of-type(${row + 1}) dd`, root))[0];
            expect(overlapArea(term, value), `${context}: "${term.label}" overlaps its description`).toBe(0);

            const stacked = value.y >= term.y + term.height - CONTAINMENT_TOLERANCE_PX;
            if (stacked) {
              // Narrow layout: the term sits above its description.
              expect(value.y - (term.y + term.height), `${context}: stacked term/value have no gap`)
                .toBeGreaterThanOrEqual(0);
            } else {
              // Wide layout: a clear column gap, and a readable value column.
              expect(value.x - (term.x + term.width), `${context}: term and value run together`)
                .toBeGreaterThanOrEqual(12);
              expect(value.width, `${context}: value column is only ${value.width.toFixed(0)}px`)
                .toBeGreaterThanOrEqual(200);
            }
            expectContained(term, block, `${context} paid block`);
            expectContained(value, block, `${context} paid block`);
          }
        }
      }
    });
  }
});

test.describe('Quiet Setup reflow', () => {
  test('no horizontal overflow at 320px, 390px, 200% and 400%', async ({ page }) => {
    const routes = ['/setup/', '/setup/mouse-trackpad-trackball-or-touch/', '/setup/what-quiet-setup-means/'];
    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      for (const route of routes) {
        await page.goto(route);
        await loadAllImages(page);
        expect(await overflow(), `${route} overflows at ${width}px`).toBeLessThanOrEqual(0);
      }
    }

    // 1280x1024 at 200% => 640x512 CSS px, at 400% => 320x256 (WCAG 1.4.10).
    for (const [factor, label] of [
      [2, '200%'],
      [4, '400%'],
    ] as const) {
      await setZoomEquivalentViewport(page, 1280, 1024, factor);
      for (const route of routes) {
        await page.goto(route);
        await loadAllImages(page);
        expect(await overflow(), `${route} overflows at ${label} zoom`).toBeLessThanOrEqual(0);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      }
    }
  });

  test('the card grid becomes a single column at 200% zoom before content is cramped', async ({ page }) => {
    await setZoomEquivalentViewport(page, 1280, 1024, 2);
    await page.goto('/setup/');
    await loadAllImages(page);

    const cards = await boxes(page, '[data-setup-card]');
    const columns = new Set(cards.map((card) => Math.round(card.x)));
    expect(columns.size, 'setup cards should reflow to one column at 200% zoom').toBe(1);
    for (const card of cards) expect(card.width).toBeGreaterThanOrEqual(272);
  });

  test('every article heading and metadata row stays visible at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const slug of SLUGS) {
      await page.goto(`/setup/${slug}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.article-meta__dates')).toBeVisible();
      await expect(page.locator('[data-evidence-label]')).toBeVisible();
    }
  });
});

test.describe('Quiet Setup content accuracy', () => {
  test('topic counts report primary-topic guides with correct singular and plural wording', async ({ page }) => {
    await page.goto('/setup/');

    // Derived from the committed content collection via the rendered cards, so
    // the assertion tracks content rather than a hard-coded table.
    const expected = await page.evaluate(() => {
      const counts: Record<string, number> = {};
      for (const card of document.querySelectorAll('[data-setup-card] .setup-artwork')) {
        const topic = card.getAttribute('data-setup-topic')!;
        counts[topic] = (counts[topic] ?? 0) + 1;
      }
      return counts;
    });

    const total = Object.values(expected).reduce((sum, n) => sum + n, 0);
    const cardCount = await page.locator('[data-setup-card]').count();
    expect(total, 'every published article must be counted exactly once').toBe(cardCount);

    for (const [topic, count] of Object.entries(expected)) {
      const label = page.locator(`[data-setup-topic-count="${topic}"]`);
      await expect(label).toHaveText(`${count} ${count === 1 ? 'guide' : 'guides'}`);
    }
    // The old wording summed secondary tags and implied dedicated guides.
    await expect(page.locator('.topic-grid')).not.toContainText('launch guides in the feed');
  });

  test('each article shows exactly one paid indicator and eight distinct illustrations', async ({ page }) => {
    await page.goto('/setup/');
    const artwork = await page.locator('[data-setup-card] [data-setup-artwork]').evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute('data-setup-artwork')),
    );
    const cardCount = await page.locator('[data-setup-card]').count();
    expect(artwork).toHaveLength(cardCount);
    expect(new Set(artwork).size, 'original illustrations must still be present').toBeGreaterThanOrEqual(8);

    for (const slug of SLUGS) {
      await page.goto(`/setup/${slug}/`);
      const declared = await page.locator('[data-setup-article]').getAttribute('data-has-affiliate-links');
      await expect(page.locator('[data-paid-indicator]')).toHaveCount(declared === 'true' ? 1 : 0);
    }
  });
});

test.describe('Quiet Setup responsive image selection', () => {
  const currentSrc = (page: Page, selector: string) =>
    page.locator(selector).first().evaluate((img) => (img as HTMLImageElement).currentSrc.split('/').pop() ?? '');

  test('the browser picks a source matched to the rendered width', async ({ page }) => {
    // Mobile card: a 358px-wide slot must not pull the 1600px asset.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/setup/');
    await loadAllImages(page);
    const mobileCard = await currentSrc(page, '[data-setup-card] img');
    expect(mobileCard, `mobile card chose ${mobileCard}`).toMatch(/-(800|1200)\.(webp|jpg)$/);

    // Desktop card: ~370px slot at DPR 1 still stays off the largest asset.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/setup/');
    await loadAllImages(page);
    const desktopCard = await currentSrc(page, '[data-setup-card] img');
    expect(desktopCard, `desktop card chose ${desktopCard}`).toMatch(/-(800|1200|1600)\.(webp|jpg)$/);

    // Article hero: a full-width mobile hero must stay below 1600px…
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/setup/mouse-trackpad-trackball-or-touch/');
    await loadAllImages(page);
    const mobileHero = await currentSrc(page, '.setup-article > .setup-artwork img');
    expect(mobileHero, `mobile hero chose ${mobileHero}`).toMatch(/-(800|1200)\.(webp|jpg)$/);

    // …and an 832px desktop hero must not fall back to the blurry 800px file.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/setup/mouse-trackpad-trackball-or-touch/');
    await loadAllImages(page);
    const desktopHero = await currentSrc(page, '.setup-article > .setup-artwork img');
    expect(desktopHero, `desktop hero chose ${desktopHero}`).toMatch(/-(1200|1600)\.(webp|jpg)$/);
  });

  test('every setup illustration keeps a 16:9 box and reserves its space', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/setup/');
    await loadAllImages(page);

    const frames = await page.locator('[data-setup-artwork]').evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        const img = node.querySelector('img')!;
        return {
          ratio: r.width / r.height,
          display: getComputedStyle(node).display,
          attrRatio: Number(img.getAttribute('width')) / Number(img.getAttribute('height')),
          alt: img.getAttribute('alt'),
        };
      }),
    );

    for (const frame of frames) {
      // A <picture> left inline silently drops aspect-ratio and overflow.
      expect(frame.display, 'setup artwork must be a block box').not.toBe('inline');
      expect(frame.ratio).toBeCloseTo(16 / 9, 1);
      expect(frame.attrRatio).toBeCloseTo(16 / 9, 2);
      // Visual search: alt should be descriptive for image indexing, not empty.
      expect(frame.alt, 'setup artwork alt should be descriptive for visual search').toBeTruthy();
      expect((frame.alt ?? '').length).toBeGreaterThan(10);
    }
  });
});
