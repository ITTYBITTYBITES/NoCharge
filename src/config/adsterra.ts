/**
 * Lab banner configuration (non-Google network).
 *
 * The Quiet Arcade keeps its single AdSense banner; this file is for the Lab
 * section only and must never be rendered on a calm route. `showAds` stays
 * false on every Lab page, so no AdSense tag is ever present on a page that can
 * load this network, and the reverse.
 *
 * Keys come from the environment and are absent by default. With
 * `PUBLIC_ADSTERRA_ENABLED` unset the provider resolves to the null provider
 * and the site makes no third-party request at all — which is the state this
 * repository ships in, and the state every test runs in.
 */

import type { BannerPlacement } from '../lab/ads/providers';

export const ADSTERRA_ENABLED = import.meta.env.PUBLIC_ADSTERRA_ENABLED === 'true';

/** Placement key per slot, or null when that slot is unconfigured. */
export function adsterraKey(placement: BannerPlacement): string | null {
  const key =
    placement === 'mobile-banner'
      ? import.meta.env.PUBLIC_ADSTERRA_KEY_MOBILE
      : placement === 'leaderboard'
        ? import.meta.env.PUBLIC_ADSTERRA_KEY_LEADERBOARD
        : import.meta.env.PUBLIC_ADSTERRA_KEY_RAIL;
  return key && key.trim().length > 0 ? key.trim() : null;
}

/**
 * Domains this network needs. Emitted into the Content-Security-Policy on Lab
 * routes only — the calm site's policy is untouched.
 *
 * Deliberately narrow: no `https:` wildcard, no `unsafe-eval`. If the network
 * needs a new host, it is added here and reviewed, not opened up globally.
 */
export const ADSTERRA_CSP_SOURCES = {
  scriptSrc: ['https://www.highperformanceformat.com'],
  frameSrc: ['https://www.highperformanceformat.com'],
  imgSrc: ['https://*.adsterra.com', 'https://www.highperformanceformat.com'],
  connectSrc: ['https://*.adsterra.com'],
} as const;

export const ADSTERRA_INVOKE_HOST = 'https://www.highperformanceformat.com';
