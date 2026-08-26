import { describe, expect, test } from 'vitest';

import { fanLayout } from './fan';
import {
  MAX_COVER_FRACTION,
  FACE_DOWN_COMFORT_PX,
  MIN_FACE_DOWN_STRIP_PX,
  MIN_READABLE_STRIP_PX,
  tableauColumnsForWidth,
  columnHeightFromSteps,
  columnLayout,
  maxPileForHeight,
  segmentHeight,
  tableauGeometry,
  tableauRowsForWidth,
} from './stage-fit';

const freecellDeal = [7, 7, 7, 7, 6, 6, 6, 6];
/** Solitaire cards are 5 wide by 7 tall. */
const CARD_ASPECT = 7 / 5;

describe('columnLayout', () => {
  test('a single card needs no overlap', () => {
    const layout = columnLayout({ cardHeight: 60, availableHeight: 400, segments: [{ count: 1, faceUp: true }] });
    expect(layout.height).toBe(60);
    expect(layout.overflows).toBe(false);
  });

  test('generous space keeps the readable overlap instead of spreading cards apart', () => {
    const layout = columnLayout({ cardHeight: 60, availableHeight: 1000, segments: [{ count: 7, faceUp: true }] });
    // 60 * (1 - MAX_COVER_FRACTION) = 27, above the 16px readable floor.
    expect(layout.segments[0]!.step).toBeCloseTo(60 * (1 - MAX_COVER_FRACTION), 5);
    expect(layout.overflows).toBe(false);
  });

  test('an impossible budget keeps cards readable and reports overflow', () => {
    // Seven 51.5px cards need 147.5px even at the readable floor, so 138px
    // cannot work. The answer is a readable layout plus the overflow flag that
    // tells the renderer to offer the in-stage fan.
    const layout = columnLayout({ cardHeight: 51.5, availableHeight: 138, segments: [{ count: 7, faceUp: true }] });
    expect(layout.segments[0]!.step).toBe(MIN_READABLE_STRIP_PX);
    expect(layout.height).toBeCloseTo(51.5 + 6 * MIN_READABLE_STRIP_PX, 5);
    expect(layout.overflows).toBe(true);
  });

  test('a solved column fits its budget or says it does not', () => {
    for (const availableHeight of [140, 180, 240, 320, 480, 900]) {
      const layout = columnLayout({
        cardHeight: 100,
        availableHeight,
        segments: [{ count: 7, faceUp: true }],
      });
      if (layout.overflows) {
        // Readability is never traded away to hit a number.
        expect(layout.segments[0]!.step).toBeGreaterThanOrEqual(MIN_READABLE_STRIP_PX);
      } else {
        expect(layout.height, `budget ${availableHeight}`).toBeLessThanOrEqual(availableHeight + 0.5);
      }
    }
    // A 100px card with seven cards is 196px at the floor, so 240 fits and 140 does not.
    expect(columnLayout({ cardHeight: 100, availableHeight: 240, segments: [{ count: 7, faceUp: true }] }).overflows).toBe(false);
    expect(columnLayout({ cardHeight: 100, availableHeight: 140, segments: [{ count: 7, faceUp: true }] }).overflows).toBe(true);
  });

  test('a pile that cannot be shown readably reports overflow instead of clipping', () => {
    const layout = columnLayout({ cardHeight: 51.5, availableHeight: 90, segments: [{ count: 7, faceUp: true }] });
    expect(layout.overflows).toBe(true);
    // The step still never drops below the readable floor.
    expect(layout.segments[0]!.step).toBeGreaterThanOrEqual(MIN_READABLE_STRIP_PX);
  });

  test('Klondike face-down runs stack tighter than open runs', () => {
    const layout = columnLayout({
      cardHeight: 59,
      availableHeight: 250,
      segments: [
        { count: 6, faceUp: false },
        { count: 1, faceUp: true },
      ],
    });
    const down = layout.segments[0]!;
    const up = layout.segments[1]!;
    expect(down.step).toBeLessThanOrEqual(FACE_DOWN_COMFORT_PX);
    expect(down.step).toBeGreaterThanOrEqual(MIN_FACE_DOWN_STRIP_PX);
    expect(up.count).toBe(1);
    expect(layout.overflows).toBe(false);
  });

  test('an open run may spread wider than a covered run in the same column', () => {
    const layout = columnLayout({
      cardHeight: 80,
      availableHeight: 4000,
      segments: [
        { count: 3, faceUp: false },
        { count: 3, faceUp: true },
      ],
    });
    expect(layout.segments[0]!.step).toBe(FACE_DOWN_COMFORT_PX);
    expect(layout.segments[1]!.step).toBeCloseTo(80 * (1 - MAX_COVER_FRACTION), 5);
  });

  test('a deep Klondike column of 10 covered and 7 open cards still fits a phone row', () => {
    const layout = columnLayout({
      cardHeight: 59,
      availableHeight: 320,
      segments: [
        { count: 10, faceUp: false },
        { count: 7, faceUp: true },
      ],
    });
    expect(layout.overflows).toBe(false);
    expect(layout.height).toBeLessThanOrEqual(320);
  });

  test('empty segments contribute no height', () => {
    const layout = columnLayout({ cardHeight: 50, availableHeight: 200, segments: [] });
    expect(layout.height).toBe(0);
    expect(layout.overflows).toBe(false);
  });
});

describe('FreeCell initial deal fits the Game Mode stage', () => {
  test.each([
    { viewport: '320x568', width: 320, height: 568 },
    { viewport: '360x800', width: 360, height: 800 },
    { viewport: '375x812', width: 375, height: 812 },
    { viewport: '390x844', width: 390, height: 844 },
    { viewport: '412x915', width: 412, height: 915 },
  ])('$viewport shows all eight columns without scrolling', ({ width, height }) => {
    const plan = {
      width: width - 24,
      availableHeight: height - 44 - 26 - 22 - 46,
      totalColumns: 8,
      maxPile: 7,
      columnGap: 4,
      rowGap: 8,
      cardAspect: CARD_ASPECT,
    };
    const rows = tableauRowsForWidth(plan);
    const columns = Math.ceil(8 / rows);
    const columnWidth = (plan.width - (columns - 1) * 4) / columns;
    const geometry = tableauGeometry({
      columnWidth,
      cardAspect: CARD_ASPECT,
      rows,
      rowGap: 8,
      // Stage minus compact chrome, HUD, and the compact top row.
      availableHeight: height - 44 - 26 - 22 - 46,
    });

    for (const pile of freecellDeal) {
      const layout = columnLayout({
        cardHeight: geometry.cardHeight,
        availableHeight: geometry.rowHeight,
        segments: [{ count: pile, faceUp: true }],
      });
      expect(
        layout.overflows,
        `${width}x${height}: pile of ${pile} overflows at cardHeight ${geometry.cardHeight.toFixed(1)} / row ${geometry.rowHeight.toFixed(1)}`,
      ).toBe(false);
    }
  });
});

describe('Klondike initial deal fits the Game Mode stage', () => {
  test.each([
    { viewport: '320x568', width: 320, height: 568 },
    { viewport: '360x800', width: 360, height: 800 },
    { viewport: '375x812', width: 375, height: 812 },
    { viewport: '390x844', width: 390, height: 844 },
    { viewport: '412x915', width: 412, height: 915 },
  ])('$viewport shows all seven columns without scrolling', ({ width, height }) => {
    const columnWidth = (width - 24 - 6 * 4) / 7;
    const geometry = tableauGeometry({
      columnWidth,
      cardAspect: CARD_ASPECT,
      rows: 1,
      rowGap: 8,
      availableHeight: height - 44 - 26 - 22 - 46,
    });

    for (let col = 0; col < 7; col += 1) {
      const layout = columnLayout({
        cardHeight: geometry.cardHeight,
        availableHeight: geometry.rowHeight,
        segments: [
          { count: col, faceUp: false },
          { count: 1, faceUp: true },
        ],
      });
      expect(
        layout.overflows,
        `${width}x${height}: column ${col + 1} overflows at cardHeight ${geometry.cardHeight.toFixed(1)} / row ${geometry.rowHeight.toFixed(1)}`,
      ).toBe(false);
    }
  });
});

describe('helpers', () => {
  test('segmentHeight shows the last card in full', () => {
    expect(segmentHeight(1, 60, 16)).toBe(60);
    expect(segmentHeight(4, 60, 16)).toBe(108);
    expect(segmentHeight(0, 60, 16)).toBe(0);
  });

  test('columnHeightFromSteps adds the top margins', () => {
    expect(columnHeightFromSteps(60, [16, 16, 16])).toBe(108);
    expect(columnHeightFromSteps(60, [])).toBe(60);
  });

  test('tableauRowsForWidth wraps only when a full pile cannot fit one row', () => {
    const plan = (width: number, availableHeight: number, totalColumns = 8) => ({
      width,
      availableHeight,
      totalColumns,
      maxPile: 7,
      columnGap: 4,
      rowGap: 8,
      cardAspect: CARD_ASPECT,
    });
    // Widths are the padded stage width, matching the renderer.
    // 320x568 leaves 143px per row; at 33.5px columns the card is 46.9px tall,
    // so a seven-card pile is 46.9 + 6 * 16 = 142.9px and one row still fits.
    expect(tableauRowsForWidth(plan(296, 294))).toBe(1);
    expect(tableauRowsForWidth(plan(336, 662))).toBe(1);
    expect(tableauRowsForWidth(plan(351, 674))).toBe(1);
    expect(tableauRowsForWidth(plan(388, 777))).toBe(1);
    expect(tableauColumnsForWidth(plan(296, 294))).toBe(8);
    expect(tableauColumnsForWidth(plan(366, 706))).toBe(8);
    // Seven columns never wrap.
    expect(tableauRowsForWidth(plan(296, 294, 7))).toBe(1);
    // A stage too short for a full-width pile wraps into two rows instead.
    expect(tableauRowsForWidth(plan(296, 100))).toBe(2);
    expect(tableauColumnsForWidth(plan(296, 100))).toBe(4);
  });

  test('maxPileForHeight reports how many cards a row can hold', () => {
    expect(maxPileForHeight(147.5, 51.5)).toBe(7);
    expect(maxPileForHeight(51.5, 51.5)).toBe(0);
    expect(maxPileForHeight(67.5, 51.5)).toBe(2);
  });
});

describe('fanLayout', () => {
  test('a short pile shows every card on one page', () => {
    const layout = fanLayout(
      { count: 7, cardHeight: 100, availableHeight: 400, availableWidth: 300, cardAspect: 5 / 7 },
      0,
    );
    expect(layout.perPage).toBeGreaterThanOrEqual(7);
    expect(layout.pages).toBe(1);
    expect(layout.startIndex).toBe(0);
    expect(layout.compressed).toBe(false);
  });

  test('a long pile paginates instead of clipping', () => {
    const layout = fanLayout(
      { count: 20, cardHeight: 100, availableHeight: 200, availableWidth: 300, cardAspect: 5 / 7 },
      1,
    );
    // 100 + 6 * 16 = 196 <= 200, so seven cards share one page.
    expect(layout.perPage).toBe(7);
    expect(layout.pages).toBe(3);
    expect(layout.startIndex).toBe(7);
  });

  test('the page index is clamped into range', () => {
    const layout = fanLayout(
      { count: 5, cardHeight: 100, availableHeight: 150, availableWidth: 300, cardAspect: 5 / 7 },
      99,
    );
    expect(layout.startIndex).toBeLessThan(5);
    expect(layout.startIndex).toBeGreaterThanOrEqual(0);
  });

  test('an empty pile is inert', () => {
    const layout = fanLayout(
      { count: 0, cardHeight: 100, availableHeight: 400, availableWidth: 300, cardAspect: 5 / 7 },
      0,
    );
    expect(layout.perPage).toBe(0);
    expect(layout.compressed).toBe(false);
  });
});
