/**
 * Central ad configuration.
 *
 * Every Adsterra unit is declared here once and rendered through a real,
 * same-origin host page at `/ads/<id>/` (see `src/pages/ads/[unit].astro`).
 * Nothing else in the codebase should hardcode a zone key.
 */

export interface AdUnit {
  /** URL segment for the host page: /ads/<id>/ */
  id: string;
  /** Adsterra zone key. */
  key: string;
  width: number;
  height: number;
}

export const AD_UNITS: AdUnit[] = [
  // Bottom banner, wide viewports.
  { id: 'banner-728x90', key: 'a199226578c2c0b962341e6036074857', width: 728, height: 90 },
  // Bottom banner, phones.
  { id: 'banner-320x50', key: '40e152263863504f784358cd6dba0c2b', width: 320, height: 50 },
  // In-content rectangle above the game stage.
  { id: 'rect-300x250', key: 'bbf27229842bc99d26b859e45478df34', width: 300, height: 250 },
];

export const getUnit = (id: string): AdUnit => {
  const unit = AD_UNITS.find((u) => u.id === id);
  if (!unit) throw new Error(`Unknown ad unit: ${id}`);
  return unit;
};

/**
 * Adsterra Smartlink / Direct Link, used as backfill when a slot returns no
 * creative. The configured publisher Smartlink is the default; set
 * `PUBLIC_ADSTERRA_SMARTLINK` in the build environment (or a `.env` file) to
 * override it for a deployment.
 */
export const SMARTLINK_URL: string =
  import.meta.env.PUBLIC_ADSTERRA_SMARTLINK ??
  'https://harryinspectionlucy.com/srnxu0v8?key=a88515281e2b9a060a8d095fbae6a3d7';

/** A zone key that is still a placeholder should never render. */
export const isPlaceholder = (unit: AdUnit): boolean => unit.key.startsWith('REPLACE_WITH');
