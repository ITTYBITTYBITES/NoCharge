/**
 * Responsive banner mounting for the Lab.
 *
 * One banner per page, chosen by viewport — never both, and none at all in
 * short landscape where there is no room for one.
 *
 *   portrait / narrow          → 320×50  in `.lab-ad--bottom`
 *   landscape, ≥64rem          → 300×600 in `.lab-ad--rail`
 *   landscape, <30rem tall     → none (both containers hidden by CSS)
 *
 * The placement is recomputed on orientation change but only re-mounted when
 * the *placement* actually changes. Remounting on every resize would re-request
 * a creative and burn impressions.
 */

import { createAdsterraBannerProvider } from './providers/adsterra-banner';
import { nullBannerProvider } from './providers';
import { hasAdvertisingConsent } from './consent-gate';
import type { BannerPlacement, BannerProvider, BannerSlotSpec } from './providers';

const RAIL_QUERY = '(orientation: landscape) and (min-width: 64rem)';
const SHORT_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 30rem)';

export interface SlotElements {
  bottom: HTMLElement | null;
  rail: HTMLElement | null;
}

function resolvePlacement(): BannerPlacement | null {
  if (typeof window === 'undefined') return null;
  if (window.matchMedia(SHORT_LANDSCAPE_QUERY).matches) return null;
  return window.matchMedia(RAIL_QUERY).matches ? 'side-rail' : 'mobile-banner';
}

function provider(): BannerProvider {
  // No consent or no configuration → the null provider, which injects nothing.
  return createAdsterraBannerProvider({ hasConsent: hasAdvertisingConsent });
}

export interface SlotController {
  destroy(): void;
}

export function mountLabAdSlots(elements: SlotElements): SlotController {
  let current: BannerPlacement | null = null;
  let mounted: BannerProvider | null = null;

  const clear = (container: HTMLElement | null) => {
    if (container) container.replaceChildren();
  };

  const sync = () => {
    const next = resolvePlacement();
    if (next === current) return;
    current = next;

    // Tear down the previous slot before starting the next so there is never
    // more than one banner on the page.
    clear(elements.bottom);
    clear(elements.rail);
    mounted?.destroy();
    mounted = null;

    if (!next) return;

    const container = next === 'side-rail' ? elements.rail : elements.bottom;
    if (!container) return;

    const spec: BannerSlotSpec = {
      placement: next,
      reserve: next === 'side-rail' ? { width: 300, height: 600 } : { width: 320, height: 50 },
    };

    const instance = provider();
    mounted = instance;
    void instance.mount(container, spec).catch(() => {
      /* A failed mount leaves an empty reserved container. Never fatal. */
    });
  };

  sync();

  const onChange = () => sync();
  window.addEventListener('orientationchange', onChange);
  window.addEventListener('resize', onChange);

  return {
    destroy() {
      window.removeEventListener('orientationchange', onChange);
      window.removeEventListener('resize', onChange);
      clear(elements.bottom);
      clear(elements.rail);
      mounted?.destroy();
      mounted = null;
    },
  };
}

/** Exported for tests: the placement decision, independent of the DOM. */
export function placementFor(params: {
  landscape: boolean;
  wide: boolean;
  short: boolean;
}): BannerPlacement | null {
  if (params.landscape && params.short) return null;
  if (params.landscape && params.wide) return 'side-rail';
  return 'mobile-banner';
}

export { nullBannerProvider };
