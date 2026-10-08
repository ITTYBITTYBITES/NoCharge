/**
 * Which pages have a translated BODY, per locale.
 *
 * Every page is served in every locale, and the header, footer, controls, and
 * game shells are always translated. A page's own copy is English until it is
 * listed here. For an unlisted page under `/tr/` or `/fr-ca/`:
 *   - the English body sits inside `<main lang="en">`, so screen readers use
 *     the right pronunciation;
 *   - the canonical points at the English URL, so the thin localized copy is
 *     not indexed as duplicate content;
 *   - no hreflang alternate is advertised for that locale.
 *
 * Add a route here only after its body copy has been translated and reviewed.
 */

import { normalizeRoute } from './routes';
import { PREFIXED_LOCALES, type Locale } from './config';

const TRANSLATED_BODY: Readonly<Record<Locale, ReadonlySet<string>>> = {
  en: new Set<string>(),
  tr: new Set<string>(),
  'fr-ca': new Set<string>(),
};

/** English routes that have translated body copy in `locale`. */
export function translatedRoutes(locale: Locale): ReadonlySet<string> {
  return TRANSLATED_BODY[locale];
}

/** True when the body of `route` (English route, e.g. `/arcade/`) is translated in `locale`. */
export function isBodyTranslated(locale: Locale, route: string): boolean {
  if (locale === 'en') return true;
  return TRANSLATED_BODY[locale].has(normalizeRoute(route));
}

/** Locales (other than English) where `route` has a translated body. */
export function translatedLocalesFor(route: string): Locale[] {
  return PREFIXED_LOCALES.filter((locale) => isBodyTranslated(locale, route));
}

/**
 * Word games check answers against ASCII word lists (A–Z only), so their
 * engines are not safe to run in localized copy. Their routes stay English in
 * every locale: a localized URL redirects to the English page.
 */
export const ENGLISH_PINNED_GAMES: ReadonlySet<string> = new Set([
  'hangman',
  'word-loom',
  'word-search',
  'word-tile-rush',
]);

/** True when the game at `gameId` must be served in English regardless of `locale`. */
export function isPinnedToEnglish(locale: Locale, gameId: string): boolean {
  return locale !== 'en' && ENGLISH_PINNED_GAMES.has(gameId);
}
