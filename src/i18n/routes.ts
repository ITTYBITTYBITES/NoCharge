/**
 * Locale-aware path helpers. Browser-safe: no Node APIs.
 *
 * Every page exists once per locale. The English copy is the source of truth
 * and its route is the "route" (for example `/arcade/`). A localized URL is
 * the same route with a prefix (`/tr/arcade/`).
 */

import { DEFAULT_LOCALE, localeFromSegment, type Locale } from './config';

/** Ensure a leading slash and a trailing slash on directory-style routes. */
export function normalizeRoute(path: string): string {
  const leading = path.startsWith('/') ? path : `/${path}`;
  const last = leading.split('/').pop() ?? '';
  if (leading === '/' || leading.endsWith('/') || last.includes('.')) return leading;
  return `${leading}/`;
}

/**
 * Split a URL pathname into its locale and its English route.
 *
 *   splitLocale('/tr/arcade/') → { locale: 'tr', route: '/arcade/' }
 *   splitLocale('/arcade/')    → { locale: 'en', route: '/arcade/' }
 */
export function splitLocale(pathname: string): { locale: Locale; route: string } {
  const segments = pathname.split('/');
  const locale = localeFromSegment(segments[1]);
  if (!locale) return { locale: DEFAULT_LOCALE, route: normalizeRoute(pathname) };
  const rest = `/${segments.slice(2).join('/')}`;
  return { locale, route: normalizeRoute(rest) };
}

/** The URL path for an English route in a given locale. */
export function withLocale(route: string, locale: Locale): string {
  const normalized = normalizeRoute(route);
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === '/' ? `/${locale}/` : `/${locale}${normalized}`;
}
