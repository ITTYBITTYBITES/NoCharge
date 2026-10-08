/**
 * Zero-dependency message lookup for NoCharge.
 *
 * `t(locale, key, params)`:
 *   - `{name}` placeholders are replaced with the matching `params` entry.
 *   - Plurals: pass `count` and define `key.one` / `key.other` in the JSON.
 *     The category comes from `Intl.PluralRules`, so each locale uses its own
 *     rules. A missing plural form falls back to `.other`.
 *   - Fallback: missing key in the requested locale → English, then the key
 *     itself, so a bug is visible without crashing.
 *
 * Where the dictionaries come from:
 *   - Server (Astro build, tests): all locales are imported directly.
 *   - Browser: English is bundled, because it is the fallback. Other locales
 *     are emitted as JSON files and fetched on demand with `ensureLocale()`.
 *     JSON is not JavaScript, so the site's JavaScript budget is unaffected
 *     and visitors only download the language they use. Until a locale has
 *     loaded, `t` falls back to English, so text is never blank.
 *
 * Output is plain text. Never pass translated strings to `innerHTML`.
 *
 * Browser-safe: this module is bundled into game code.
 */

import en from '../locales/en.json';
import trServer from '../locales/tr.json';
import frCaServer from '../locales/fr-ca.json';
// `?url` makes Vite emit the file as a static asset, so it never enters a JS chunk.
import trUrl from '../locales/tr.json?url';
import frCaUrl from '../locales/fr-ca.json?url';
import { DEFAULT_LOCALE, LOCALE_META, type Locale } from './config';

type Dictionary = Readonly<Record<string, string>>;

const SERVER_DICTIONARIES: Readonly<Record<Locale, Dictionary>> = {
  en,
  tr: trServer,
  'fr-ca': frCaServer,
};

const BROWSER_DICTIONARY_URLS: Readonly<Partial<Record<Locale, string>>> = {
  tr: trUrl,
  'fr-ca': frCaUrl,
};

/** Browser cache. English is bundled; other locales are added by `ensureLocale`. */
const browserDictionaries: Partial<Record<Locale, Dictionary>> = { en };

function dictionaryFor(locale: Locale): Dictionary | undefined {
  if (import.meta.env.SSR) return SERVER_DICTIONARIES[locale];
  return browserDictionaries[locale];
}

/**
 * Load a locale's dictionary in the browser. Resolves when it is ready to use.
 * On failure the locale keeps using English, so callers never need to handle
 * an error. Server builds have every locale already, so this does nothing there.
 */
export async function ensureLocale(locale: Locale): Promise<void> {
  if (import.meta.env.SSR || browserDictionaries[locale]) return;
  const url = BROWSER_DICTIONARY_URLS[locale];
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) return;
    browserDictionaries[locale] = (await response.json()) as Dictionary;
  } catch {
    // Keep English; the page stays usable.
  }
}

type EnglishKeys = keyof typeof en;

/** `common.moves.other` is addressed in code as `common.moves`. */
type PluralBase<K extends string> = K extends `${infer Base}.other` ? Base : never;

/** Every key a caller may pass to `t()`, with plural families collapsed. */
export type MessageKey =
  | Exclude<EnglishKeys, `${string}.one` | `${string}.other`>
  | PluralBase<EnglishKeys>;

export type MessageParams = Readonly<Record<string, string | number>>;

const pluralRules = new Map<Locale, Intl.PluralRules>();

function pluralCategory(locale: Locale, count: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(LOCALE_META[locale].htmlLang);
    pluralRules.set(locale, rules);
  }
  return rules.select(count);
}

function resolveTemplate(locale: Locale, key: string, count: number | undefined): string | undefined {
  const dictionary = dictionaryFor(locale);
  if (!dictionary) return undefined;
  if (count !== undefined) {
    const plural = dictionary[`${key}.${pluralCategory(locale, count)}`] ?? dictionary[`${key}.other`];
    if (plural !== undefined) return plural;
  }
  return dictionary[key];
}

/** Translate `key` for `locale`, falling back to English, then to the key. */
export function t(locale: Locale, key: MessageKey, params?: MessageParams): string {
  const count = typeof params?.count === 'number' ? params.count : undefined;
  const template =
    resolveTemplate(locale, key, count) ?? resolveTemplate(DEFAULT_LOCALE, key, count) ?? key;
  return template.replace(/\{(\w+)\}/g, (placeholder: string, name: string) =>
    params && Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder,
  );
}

/** True when `locale` has its own translation for `key` (no English fallback used). */
export function hasTranslation(locale: Locale, key: MessageKey): boolean {
  const dictionary = dictionaryFor(locale);
  if (!dictionary) return false;
  return dictionary[key] !== undefined || dictionary[`${key}.other`] !== undefined;
}
