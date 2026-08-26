/**
 * Vertical fit math for the solitaire tableau.
 *
 * Game Mode on a phone gives the board a fixed pixel budget instead of a page
 * the player can scroll. A desktop pile of six or seven cards therefore has to
 * be compressed until the whole active state is visible at once. These helpers
 * turn "available height" into a concrete per-card overlap so the renderer and
 * the geometry tests agree on one number.
 *
 * Pure functions only: no DOM access, so they run in vitest as well as the
 * browser.
 */

/** The smallest slice of a covered card that still shows its rank corner. */
export const MIN_READABLE_STRIP_PX = 16;
/** A face-down card is identical on every row, so it may compress harder. */
export const MIN_FACE_DOWN_STRIP_PX = 7;
/** Gap between two stacked sequences (face-down block then face-up run). */
export const RUN_GAP_PX = 2;
/** A covered face-up card never hides more than this fraction of the card below it. */
export const MAX_COVER_FRACTION = 0.55;
/**
 * Widest comfortable step for a face-down run. Card backs are identical, so
 * they are stacked tighter than open cards to buy the face-up run room.
 */
export const FACE_DOWN_COMFORT_PX = 12;

export interface ColumnSegment {
  /** Cards in this run, top to bottom. */
  readonly count: number;
  /** Face-down runs are visually identical, so they may overlap more. */
  readonly faceUp: boolean;
}

export interface ColumnLayoutInput {
  /** Measured card height in CSS pixels. */
  readonly cardHeight: number;
  /** Vertical room the column may occupy. */
  readonly availableHeight: number;
  /** Ordered runs in this column, e.g. `[down, up]` for Klondike. */
  readonly segments: readonly ColumnSegment[];
}

export interface SegmentLayout {
  readonly count: number;
  readonly faceUp: boolean;
  /** Pixels of each card that stay visible under the card covering it. */
  readonly step: number;
}

export interface ColumnLayout {
  readonly segments: readonly SegmentLayout[];
  /** Rendered height of the whole column. */
  readonly height: number;
  /**
   * True when the pile cannot be made readable inside the budget. The caller
   * must then expose the column through the in-stage fan instead of clipping
   * it: a pile is never allowed to be reachable only by scrolling.
   */
  readonly overflows: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Smallest step a run accepts before its cards stop being identifiable. */
export function minReadableStep(faceUp: boolean): number {
  return faceUp ? MIN_READABLE_STRIP_PX : MIN_FACE_DOWN_STRIP_PX;
}

/** Widest step a run should be spread to before the pile starts drifting apart. */
export function comfortStep(faceUp: boolean, cardHeight: number): number {
  return faceUp ? cardHeight * (1 - MAX_COVER_FRACTION) : FACE_DOWN_COMFORT_PX;
}

/** Height of one run: the last card is always shown in full. */
export function segmentHeight(count: number, cardHeight: number, step: number): number {
  if (count <= 0) return 0;
  return cardHeight + (count - 1) * step;
}

function layoutSegments(
  segments: readonly ColumnSegment[],
  step: number,
  cardHeight: number,
): readonly SegmentLayout[] {
  // `step` is shared across the column; each run then clamps it to its own
  // comfort cap so a face-down block always sits tighter than an open run.
  return segments.map((segment) => ({
    count: segment.count,
    faceUp: segment.faceUp,
    step: segment.count > 1 ? clamp(step, 0, comfortStep(segment.faceUp, cardHeight)) : 0,
  }));
}

function heightOf(
  segments: readonly SegmentLayout[],
  cardHeight: number,
): number {
  let total = 0;
  for (const segment of segments) {
    if (segment.count <= 0) continue;
    if (total > 0) total += RUN_GAP_PX;
    total += segmentHeight(segment.count, cardHeight, segment.step);
  }
  return total;
}

/**
 * Solve the per-run overlap for one column.
 *
 * Each run gets its own step: a covered run may sit tighter than an open one,
 * and neither may compress past the readability floor. `overflows` reports the
 * case where no readable step fits, which the caller answers with the in-stage
 * fan rather than letting a card fall outside the stage.
 */
export function columnLayout(input: ColumnLayoutInput): ColumnLayout {
  const { cardHeight, availableHeight, segments } = input;
  const live = segments.filter((segment) => segment.count > 0);

  if (live.length === 0 || cardHeight <= 0) {
    return { segments: layoutSegments(segments, 0, cardHeight), height: 0, overflows: false };
  }

  const floors = live.map((segment) => minReadableStep(segment.faceUp));
  const floorSum = floors.reduce((total, value) => total + value, 0);
  const gaps = RUN_GAP_PX * (live.length - 1);
  // Every card in the column is shown in full at least once, so the overlap
  // only has to account for the height left over after all of them.
  const cardCount = live.reduce((total, segment) => total + segment.count, 0);
  const fullCards = cardCount * cardHeight;
  const transitions = live.reduce((total, segment) => total + Math.max(0, segment.count - 1), 0);

  // Space that overlap has to fill once every card shows in full.
  const remainder = Math.floor(availableHeight - gaps - fullCards);

  let steps: number[];
  if (transitions === 0) {
    steps = live.map(() => 0);
  } else if (remainder < floorSum) {
    // Not even the readable floors fit; clamp and let `overflows` flag it.
    steps = floors.slice();
  } else {
    // Every run starts at its readability floor, then the leftover space is
    // shared per *transition* in proportion to how much room each run would
    // like, capped at its comfort step. Sharing per transition is what keeps
    // the solved height inside the budget instead of overshooting it.
    const wanted = live.map((segment) => comfortStep(segment.faceUp, cardHeight));
    const counts = live.map((segment) => Math.max(0, segment.count - 1));
    const wantedTotal = wanted.reduce(
      (total, value, index) => total + value * counts[index]!,
      0,
    );
    const floorTotal = floors.reduce(
      (total, value, index) => total + value * counts[index]!,
      0,
    );
    const spare = remainder - floorTotal;
    const distributable = Math.max(0, wantedTotal - floorTotal);
    steps = floors.map((floor, index) => {
      if (distributable <= 0) return floor;
      const headroom = wanted[index]! - floor;
      const share = Math.floor((spare * headroom * counts[index]!) / distributable);
      return floor + Math.min(share, headroom);
    });
  }

  const stepByIndex = new Map<ColumnSegment, number>();
  live.forEach((segment, index) => stepByIndex.set(segment, steps[index]!));

  const laidOut = segments.map((segment) => ({
    count: segment.count,
    faceUp: segment.faceUp,
    step: segment.count > 1 ? clamp(stepByIndex.get(segment) ?? 0, 0, cardHeight) : 0,
  }));

  const height = heightOf(laidOut, cardHeight);

  return { segments: laidOut, height, overflows: height > availableHeight + 0.5 };
}

/**
 * Height of a column rendered by stacking cards with a per-card top margin,
 * which is how the solitaire boards draw piles.
 */
export function columnHeightFromSteps(
  cardHeight: number,
  steps: readonly number[],
): number {
  if (steps.length === 0) return cardHeight;
  return cardHeight + steps.reduce((total, step) => total + step, 0);
}

export interface TableauGeometryInput {
  /** Measured width of one tableau column in CSS pixels. */
  readonly columnWidth: number;
  /**
   * Card height as a multiple of its width. Solitaire cards are 5 wide by 7
   * tall, so this is `7 / 5`: a card is taller than it is wide.
   */
  readonly cardAspect: number;
  /** Total tableau rows sharing the vertical budget. */
  readonly rows: number;
  /** Vertical gap between tableau rows. */
  readonly rowGap: number;
  /** Vertical room the whole tableau may occupy. */
  readonly availableHeight: number;
}

export interface TableauGeometry {
  /** Card box implied by the column width. */
  readonly cardWidth: number;
  readonly cardHeight: number;
  /** Height left for one tableau row after sharing the budget across rows. */
  readonly rowHeight: number;
}

/** Splits the tableau budget across rows and derives the card box from it. */
export function tableauGeometry(input: TableauGeometryInput): TableauGeometry {
  const rows = Math.max(1, input.rows);
  const rowHeight = Math.max(0, (input.availableHeight - input.rowGap * (rows - 1)) / rows);
  const cardWidth = input.columnWidth;
  return {
    cardWidth,
    cardHeight: cardWidth * input.cardAspect,
    rowHeight,
  };
}

export interface RowPlanInput {
  /** Available stage width for the tableau. */
  readonly width: number;
  /** Vertical room the whole tableau may occupy. */
  readonly availableHeight: number;
  readonly totalColumns: number;
  /** Cards in the tallest pile the plan has to show. */
  readonly maxPile: number;
  /** Horizontal gap between columns. */
  readonly columnGap: number;
  readonly rowGap: number;
  /** Card height as a multiple of its width: `7 / 5` for solitaire. */
  readonly cardAspect: number;
}

/**
 * How many rows the tableau should wrap into.
 *
 * Wrapping buys depth but widens every card, and a taller card makes each pile
 * taller too, so the choice has to be made against the height budget rather
 * than the width alone. One row wins unless a full-width pile of `maxPile`
 * cards cannot fit it.
 */
export function tableauRowsForWidth(input: RowPlanInput): number {
  if (input.totalColumns < 8) return 1;

  const plan = (rows: number) => {
    const columns = Math.ceil(input.totalColumns / rows);
    const columnWidth =
      (input.width - input.columnGap * (columns - 1)) / columns;
    const cardHeight = columnWidth * input.cardAspect;
    const rowHeight =
      (input.availableHeight - input.rowGap * (rows - 1)) / rows;
    return cardHeight + (input.maxPile - 1) * MIN_READABLE_STRIP_PX <= rowHeight;
  };

  return plan(1) ? 1 : 2;
}

/** Columns shown on one tableau row at this width. */
export function tableauColumnsForWidth(input: RowPlanInput): number {
  return Math.max(1, Math.ceil(input.totalColumns / tableauRowsForWidth(input)));
}

/**
 * Largest pile a column can hold inside a budget at a given card height,
 * assuming a single face-up run. Used by the renderer to decide when a column
 * has to offer its in-stage fan.
 */
export function maxPileForHeight(availableHeight: number, cardHeight: number): number {
  if (cardHeight <= 0) return 0;
  const step = Math.min(MIN_READABLE_STRIP_PX, cardHeight);
  if (cardHeight >= availableHeight) return 0;
  return 1 + Math.floor((availableHeight - cardHeight) / step);
}
