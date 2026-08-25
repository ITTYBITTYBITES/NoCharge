/**
 * Shared in-stage fan for solitaire columns.
 *
 * When a pile is taller than the Game Mode stage can show readably, the board
 * does not grow a scrollbar. Instead the column is opened as a fan that
 * *replaces* the tableau inside the same fixed stage, paginated when even the
 * fan cannot show every card at a readable overlap. Nothing in here touches
 * game rules: it only decides how many cards fit and which page to show.
 */

import { MIN_READABLE_STRIP_PX } from './stage-fit';

export interface FanLayoutInput {
  /** Cards in the pile being inspected. */
  readonly count: number;
  /** Height of one card in the fan. */
  readonly cardHeight: number;
  /** Vertical room the fan may occupy. */
  readonly availableHeight: number;
  /** Horizontal room the fan may occupy. */
  readonly availableWidth: number;
  /** Card aspect ratio, width / height. */
  readonly cardAspect: number;
}

export interface FanLayout {
  /** Vertical step between consecutive cards in the fan. */
  readonly step: number;
  /** Cards shown on one page. */
  readonly perPage: number;
  /** Index of the first card on the requested page. */
  readonly startIndex: number;
  readonly pages: number;
  /** True when the fan had to shrink cards to stay inside the stage. */
  readonly compressed: boolean;
}

/**
 * Layout one fan page. The step is the largest value that still shows every
 * card's rank corner; if the pile is longer than the stage allows, the cards
 * are split across pages rather than clipped or scrolled.
 */
export function fanLayout(input: FanLayoutInput, page: number): FanLayout {
  const { count, cardHeight, availableHeight, availableWidth, cardAspect } = input;

  if (count <= 0 || cardHeight <= 0 || availableHeight <= 0) {
    return { step: 0, perPage: 0, startIndex: 0, pages: 1, compressed: false };
  }

  const step = Math.min(MIN_READABLE_STRIP_PX, cardHeight);
  // Cards that fit when every covered card shows `step` pixels.
  const perPage = Math.max(1, 1 + Math.floor((availableHeight - cardHeight) / step));
  const pages = Math.max(1, Math.ceil(count / perPage));
  const safePage = Math.min(Math.max(0, page), pages - 1);
  const startIndex = safePage * perPage;

  const shown = Math.min(perPage, count - startIndex);
  const renderedHeight = cardHeight + Math.max(0, shown - 1) * step;
  const cardWidth = cardHeight * cardAspect;

  return {
    step,
    perPage,
    startIndex,
    pages,
    compressed: renderedHeight > availableHeight + 0.5 || cardWidth > availableWidth + 0.5,
  };
}
