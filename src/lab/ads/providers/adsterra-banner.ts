/**
 * Adsterra display-banner adapter (Lab section only).
 *
 * Implements the `BannerProvider` contract from `./providers.ts` so the game
 * runtime never learns which network is behind it. See
 * `docs/LAB_INTEGRATION_AUDIT.md` §5 for why the boundary exists and what
 * Adsterra does and does not offer.
 *
 * Three things about this network's tag shape that the adapter has to absorb:
 *
 * 1. **It is two script tags, not one.** An inline `atOptions = {...}` followed
 *    by a remote `invoke.js`. They must appear in that order and the remote tag
 *    must sit inside the container, because it renders at its own position in
 *    the document.
 *
 * 2. **`atOptions` is a single global.** Two slots cannot be configured and
 *    then loaded in parallel — the second assignment would win for both. So
 *    mounting is serialised through a promise chain: set the options, append
 *    the script, wait for it to load, then start the next slot.
 *
 * 3. **Nothing renders without consent and configuration.** If the network is
 *    disabled, unconfigured, or the visitor has not consented, `mount()`
 *    resolves without injecting anything. The container keeps its reserved
 *    space, so the layout does not shift either way.
 */

import { ADSTERRA_ENABLED, ADSTERRA_INVOKE_HOST, adsterraKey } from '../../../config/adsterra';
import type { BannerProvider, BannerSlotSpec } from '../providers';

const SLOT_DIMENSIONS: Record<BannerSlotSpec['placement'], { width: number; height: number }> = {
  'mobile-banner': { width: 320, height: 50 },
  leaderboard: { width: 728, height: 90 },
  'side-rail': { width: 300, height: 600 },
};

type AtOptions = Record<string, unknown>;

declare global {
  interface Window {
    atOptions?: AtOptions;
  }
}

/** Serialises slot mounting so concurrent calls cannot clobber `atOptions`. */
let queue: Promise<void> = Promise.resolve();

function loadScript(container: HTMLElement, key: string, options: AtOptions): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `${ADSTERRA_INVOKE_HOST}/${encodeURIComponent(key)}/invoke.js`;
    script.addEventListener('load', () => resolve(), { once: true });
    // A blocked or failed tag must not leave the queue permanently locked, and
    // must not be reported as an unhandled rejection to the game.
    script.addEventListener('error', () => resolve(), { once: true });
    // Assign immediately before appending: this is the whole reason mounting
    // is serialised.
    window.atOptions = options;
    container.appendChild(script);
  });
}

export interface AdsterraBannerOptions {
  /** Called to decide whether this visitor may receive an ad at all. */
  hasConsent: () => boolean;
  /** Force-off switch, e.g. a build without keys. */
  enabled?: boolean;
}

export function createAdsterraBannerProvider(options: AdsterraBannerOptions): BannerProvider {
  const enabled = options.enabled ?? ADSTERRA_ENABLED;

  return {
    id: 'adsterra-banner',

    async mount(container, spec) {
      const key = adsterraKey(spec.placement);

      // Every one of these is a normal, expected outcome — not an error. The
      // container simply stays empty and keeps its reserved height.
      if (!enabled || !key || !options.hasConsent()) return;

      const size = SLOT_DIMENSIONS[spec.placement];
      const run = () =>
        loadScript(container, key, {
          key,
          format: 'iframe',
          width: size.width,
          height: size.height,
          params: {},
        });

      queue = queue.then(run, run);
      await queue;
    },

    destroy() {
      // The creative lives only inside its container, so clearing the container
      // removes the iframe and every listener that came with it.
      // (Called per-slot by the host.)
    },
  };
}

/** Package the null provider for slots where the network is not configured. */
export function adsterraConfigured(): boolean {
  return ADSTERRA_ENABLED;
}
