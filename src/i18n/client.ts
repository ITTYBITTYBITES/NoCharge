/**
 * Browser-side language behaviour.
 *
 * - The active locale is read from `<html data-locale>`, which the server
 *   sets on every page. Nothing here changes the page language by itself.
 * - Choosing a language (the switcher) stores it in `localStorage` under
 *   `nocharge:pref:language`, using the same `prefKey` namespace as other
 *   visitor preferences. It is only a preference: no analytics, no tracking.
 * - On the English home page (`/`) only, a stored non-English choice routes
 *   the visitor to that language's home page. With no stored choice and a
 *   browser that prefers Turkish, French, Spanish, or German, a dismissible
 *   suggestion appears. Deep links are never redirected, and nothing is
 *   redirected for crawlers (they have no stored preference).
 */

import { prefKey } from '../games/shared/storage';
import { DEFAULT_LOCALE, LOCALE_META, isLocale, type Locale } from './config';
import { withLocale } from './routes';
import { ensureLocale, t } from './messages';

export const LANGUAGE_PREFERENCE_KEY = prefKey('language');

/** Locale of the current document, as set by the server. Falls back to English. */
export function currentLocale(): Locale {
  const value = document.documentElement.dataset.locale;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function readStoredLocale(storage: Storage = window.localStorage): Locale | null {
  try {
    const raw = storage.getItem(LANGUAGE_PREFERENCE_KEY);
    if (raw == null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isLocale(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale, storage: Storage = window.localStorage): void {
  try {
    storage.setItem(LANGUAGE_PREFERENCE_KEY, JSON.stringify(locale));
  } catch {
    // Storage can be blocked (private mode, disabled cookies). The link still works.
  }
}

/**
 * The first browser language we translate into, in the visitor's preference
 * order. English or an unsupported language returns `null`: no suggestion.
 */
export function detectPreferredLocale(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const primary = tag.toLowerCase().split('-')[0];
    if (primary === 'en') return null;
    if (primary === 'tr') return 'tr';
    if (primary === 'fr') return 'fr-ca';
    if (primary === 'es') return 'es';
    if (primary === 'de') return 'de';
  }
  return null;
}

function showSuggestion(suggested: Locale): void {
  const meta = LOCALE_META[suggested];

  const banner = document.createElement('section');
  banner.className = 'lang-prompt';
  banner.lang = meta.htmlLang;
  banner.setAttribute('aria-label', t(suggested, 'lang.prompt.region'));

  const message = document.createElement('p');
  message.className = 'lang-prompt__text';
  message.textContent = t(suggested, 'lang.prompt.message', { language: meta.nativeName });

  const actions = document.createElement('div');
  actions.className = 'lang-prompt__actions';

  const accept = document.createElement('a');
  accept.className = 'btn btn--sm';
  accept.href = withLocale('/', suggested);
  accept.textContent = t(suggested, 'lang.prompt.switch', { language: meta.nativeName });
  accept.addEventListener('click', () => storeLocale(suggested));

  const decline = document.createElement('button');
  decline.type = 'button';
  decline.className = 'btn btn--ghost btn--sm';
  decline.lang = DEFAULT_LOCALE;
  decline.textContent = t(DEFAULT_LOCALE, 'lang.prompt.stay');
  decline.addEventListener('click', () => {
    storeLocale(DEFAULT_LOCALE);
    banner.remove();
  });

  actions.append(accept, decline);
  banner.append(message, actions);
  const header = document.querySelector('.site-header');
  if (header) header.after(banner);
  else document.getElementById('main-content')?.before(banner);
}

/** Run once per page load from the layout. */
export function initLanguagePreference(): void {
  if (currentLocale() !== DEFAULT_LOCALE) return;
  if (window.location.pathname !== '/') return;

  const stored = readStoredLocale();
  if (stored) {
    if (stored !== DEFAULT_LOCALE) window.location.replace(withLocale('/', stored));
    return;
  }

  const suggested = detectPreferredLocale(navigator.languages ?? [navigator.language]);
  if (suggested) void ensureLocale(suggested).then(() => showSuggestion(suggested));
}

let switcherBound = false;

/** Persist the choice when a visitor follows a language-switcher link. */
export function initLocaleSwitcher(): void {
  if (switcherBound) return;
  switcherBound = true;
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const option = target.closest<HTMLElement>('[data-locale-option]');
    const code = option?.dataset.localeOption;
    if (isLocale(code)) storeLocale(code);
  });
}
