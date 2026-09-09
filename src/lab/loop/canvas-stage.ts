/**
 * Canvas sizing for an edge-to-edge stage.
 *
 * A canvas has two independent sizes and getting either wrong is visible: the
 * CSS size (layout box) and the backing-store size (pixels actually rendered).
 * On a 3× phone, a canvas styled to 390×844 CSS px with a 390×844 backing store
 * is a blurry mess; capped at a sane DPR it is sharp and still renders at 60fps.
 *
 * Rules applied here:
 *  - Backing store = CSS size × devicePixelRatio, clamped to `maxDpr`.
 *  - `ResizeObserver` on the element, not `window.resize`: the stage also
 *    changes size when an ad container appears, when the mobile URL bar
 *    collapses, and when the orientation flips — none of which reliably fire a
 *    window resize event.
 *  - Integer backing-store dimensions. Fractional sizes cost a resample and can
 *    shimmer on scrolling.
 *  - The context transform is reset on every resize, so callers draw in CSS
 *    pixels and never have to think about DPR.
 */

export interface CanvasStageOptions {
  /** Upper bound for the backing-store scale. Default 2. */
  maxDpr?: number;
  /** Called after every resize with the new CSS-pixel logical size. */
  onResize?: (size: { width: number; height: number; dpr: number }) => void;
}

export interface CanvasStage {
  /** Logical (CSS pixel) size of the stage. */
  size(): { width: number; height: number; dpr: number };
  destroy(): void;
}

export function createCanvasStage(
  canvas: HTMLCanvasElement,
  options: CanvasStageOptions = {},
): CanvasStage {
  const maxDpr = options.maxDpr ?? 2;
  const context = canvas.getContext('2d');

  let last = { width: 0, height: 0, dpr: 0 };

  const measure = () => {
    const rect = canvas.getBoundingClientRect();
    // A hidden container (display:none, or a collapsed grid track) reports 0.
    // Do not resize to 0: some browsers throw, and it destroys the backing
    // store for no reason.
    const cssWidth = Math.max(1, Math.round(rect.width));
    const cssHeight = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(maxDpr, Math.max(1, window.devicePixelRatio || 1));

    if (cssWidth === last.width && cssHeight === last.height && dpr === last.dpr) return;

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    if (context) {
      // Draw in CSS pixels. Without this every drawing call would need a dpr
      // factor and every game would get it wrong at least once.
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    last = { width: cssWidth, height: cssHeight, dpr };
    options.onResize?.(last);
  };

  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          measure();
        });

  if (observer) observer.observe(canvas);
  else window.addEventListener('resize', measure);

  // Orientation change is not reliably preceded by a resize on iOS: the
  // viewport reports its new size only after the rotation animation finishes.
  window.addEventListener('orientationchange', measure);

  measure();

  return {
    size: () => ({ ...last }),
    destroy() {
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    },
  };
}

/**
 * Letterbox helper: the largest box with `aspect` that fits inside `size`.
 *
 * Fast-paced games need a stable aspect ratio so that difficulty is identical
 * on every device; letterboxing is the honest way to do that, and the bars are
 * filled with the stage background so the seam is invisible.
 */
export function fitAspect(
  size: { width: number; height: number },
  aspect: number,
): { width: number; height: number; offsetX: number; offsetY: number } {
  const targetHeight = size.width / aspect;
  if (targetHeight <= size.height) {
    const height = Math.max(1, Math.round(targetHeight));
    return {
      width: size.width,
      height,
      offsetX: 0,
      offsetY: Math.round((size.height - height) / 2),
    };
  }
  const width = Math.max(1, Math.round(size.height * aspect));
  return {
    width,
    height: size.height,
    offsetX: Math.round((size.width - width) / 2),
    offsetY: 0,
  };
}
