/**
 * Locale registry for NoCharge.
 *
 * English is the default and lives at the root (`/`, `/arcade/`, …) so existing
 * URLs, canonicals, and the English end-to-end suite stay unchanged. Other
 * locales live under a URL prefix (`/tr/`, `/fr-ca/`).
 *
 * Keep this file free of Node-only imports: it is bundled into browser code.
 */

export const LOCALES = ['en', 'tr', 'fr-ca'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Locales served under a URL prefix. */
export const PREFIXED_LOCALES = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE) as Exclude<Locale, 'en'>[];

export interface LocaleMeta {
  /** BCP-47 tag written to `<html lang>`. */
  htmlLang: string;
  /** Value for `<html dir>`. No right-to-left locale is planned; kept for future use. */
  dir: 'ltr' | 'rtl';
  /** Open Graph locale token, for example `fr_CA`. */
  ogLocale: string;
  /** Name shown in the language switcher, in the language itself. */
  nativeName: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { htmlLang: 'en', dir: 'ltr', ogLocale: 'en_US', nativeName: 'English' },
  tr: { htmlLang: 'tr', dir: 'ltr', ogLocale: 'tr_TR', nativeName: 'Türkçe' },
  'fr-ca': { htmlLang: 'fr-CA', dir: 'ltr', ogLocale: 'fr_CA', nativeName: 'Français (Canada)' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Words that act as URL prefixes. Checked against the first path segment only,
 * so an English page can never be shadowed by a locale unless it is named the
 * same as a locale code.
 */
export function localeFromSegment(segment: string | undefined): Locale | null {
  if (!segment) return null;
  const lower = segment.toLowerCase();
  return (PREFIXED_LOCALES as readonly string[]).includes(lower) ? (lower as Locale) : null;
}
